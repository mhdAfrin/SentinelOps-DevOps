const { pool } = require('../config/database')

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM alerts ORDER BY created_at DESC')
  return rows
}

async function nextId() {
  const [rows] = await pool.query(
    "SELECT id FROM alerts WHERE id LIKE 'ALT-%' ORDER BY CAST(SUBSTRING(id, 5) AS UNSIGNED) DESC LIMIT 1",
  )
  const last = rows[0] ? Number(rows[0].id.split('-')[1]) : 2000
  return `ALT-${last + 1}`
}

async function create({ id, type, message, source, severity, server_id }) {
  await pool.query(
    'INSERT INTO alerts (id, type, message, source, severity, status, server_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, type, message, source, severity, 'Active', server_id ?? null],
  )
  const [rows] = await pool.query('SELECT * FROM alerts WHERE id = ?', [id])
  return rows[0]
}

async function acknowledge(id) {
  await pool.query("UPDATE alerts SET status = 'Acknowledged' WHERE id = ?", [id])
}

async function acknowledgeAll() {
  await pool.query("UPDATE alerts SET status = 'Acknowledged' WHERE status != 'Acknowledged'")
}

module.exports = { findAll, nextId, create, acknowledge, acknowledgeAll }
