import mysql from 'mysql2/promise';
import 'dotenv/config';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,        // ✅ Railway ka port add kiya
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'billing_db',
  ssl: { rejectUnauthorized: false },        // ✅ Railway SSL ke liye zaroori
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;