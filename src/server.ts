import net from 'net';
import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2';

dotenv.config({ path: path.resolve(__dirname, `../.env`) }); // need to do it like this so .env files work with ts-node

class Server {
    conn: any;
    constructor() {
        this.conn;
    }
    async initDB() {
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            dateStrings: true
        });
        this.conn = pool.promise();
    }
    async start() {
        await this.initDB();
        const server = net.createServer((socket) => {
            socket.on('data', async (data) => {
                let json = JSON.parse(data.toString());
                switch(json[0]) {
                    case "init":
                        let [results, fields] = await this.conn.query(`SELECT * FROM information WHERE unique_id = ?`, [json[1]]);
                        console.log(results);
                        socket.write(`${JSON.stringify(['bye', `${JSON.stringify(results)}`])}`);
                        break;
                    default:
                        socket.write(`["bye", "[]"]`);
                }
            });
            socket.on('end', () => {
                console.log('disconnected');
            });
            socket.on('error', (err) => {
                console.log(err);
            });
        });
        server.listen(parseInt(process.env.PORT || '8080'), process.env.IP);
    }
}

let server = new Server();
server.start();

console.log(`TCP Server is running on ${process.env.IP}:${process.env.PORT}`);