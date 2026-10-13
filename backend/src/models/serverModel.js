const { pool } = require('../config/database')

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM servers ORDER BY id')
  return rows
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM servers WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

async function updateReading(id, { cpu_usage, memory_usage, disk_usage, status }) {
  await pool.query(
    'UPDATE servers SET cpu_usage = ?, memory_usage = ?, disk_usage = ?, status = ? WHERE id = ?',
    [cpu_usage, memory_usage, disk_usage, status, id],
  )
}

async function setStatus(id, status) {
  await pool.query('UPDATE servers SET status = ? WHERE id = ?', [status, id])
}

module.exports = { findAll, findById, updateReading, setStatus }
