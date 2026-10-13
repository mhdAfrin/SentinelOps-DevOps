const { pool } = require('../config/database')

async function findAll() {
  const [rows] = await pool.query(
    `SELECT a.*, s.server_name AS host_server_name
     FROM applications a
     LEFT JOIN servers s ON s.id = a.host_server_id
     ORDER BY a.id`,
  )
  return rows
}

module.exports = { findAll }
