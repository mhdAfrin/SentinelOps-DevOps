// Task 5: Connect MySQL with backend.
// A pooled mysql2 connection, exported so every model can reuse it.
const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // return DATETIME columns as plain strings, not JS Date objects
})

// Fails fast and loudly if the database is unreachable, instead of letting
// every route silently time out.
async function verifyConnection() {
  const conn = await pool.getConnection()
  await conn.ping()
  conn.release()
}

module.exports = { pool, verifyConnection }
