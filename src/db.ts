import dotenv from "dotenv"
dotenv.config();
import mysql from "mysql";

export const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect(err => {
    if (err) {
        throw err;
    }
    console.log("DB connected...");
});