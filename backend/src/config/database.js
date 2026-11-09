const mysql = require('mysql2/promise')
require('dotenv').config({ quiet: true })

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'sentinelops_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 3000,
  dateStrings: true,
})

async function verifyConnection() {
  await pool.query({ sql: 'SELECT 1 FROM settings LIMIT 1', timeout: 3000 })
}

module.exports = { pool, verifyConnection }
