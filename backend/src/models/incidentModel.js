const { pool } = require('../config/database')

async function findAll() {
  const [rows] = await pool.query(
    `SELECT i.*, u.name AS assignee_name
     FROM incidents i
     LEFT JOIN users u ON u.id = i.assigned_user
     ORDER BY i.created_at DESC`,
  )
  return rows
}

async function findById(id) {
  const { pool } = require('../config/database')
  const [rows] = await pool.query('SELECT * FROM incidents WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

async function findOpenByServer(serverId) {
  const [rows] = await pool.query(
    "SELECT * FROM incidents WHERE server_id = ? AND status != 'Resolved' LIMIT 1",
    [serverId],
  )
  return rows[0] ?? null
}

async function nextId() {
  const [rows] = await pool.query(
    "SELECT id FROM incidents WHERE id LIKE 'INC-%' ORDER BY CAST(SUBSTRING(id, 5) AS UNSIGNED) DESC LIMIT 1",
  )
  const last = rows[0] ? Number(rows[0].id.split('-')[1]) : 1041
  return `INC-${last + 1}`
}

async function create({ id, title, source, severity, server_id, assigned_user }) {
  await pool.query(
    'INSERT INTO incidents (id, title, source, severity, status, server_id, assigned_user) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, title, source, severity, 'Open', server_id ?? null, assigned_user ?? null],
  )
  const [rows] = await pool.query('SELECT * FROM incidents WHERE id = ?', [id])
  return rows[0]
}

async function update(id, patch) {
  const fields = []
  const values = []
  if (patch.status !== undefined) {
    fields.push('status = ?')
    values.push(patch.status)
    fields.push('resolved_at = ?')
    values.push(patch.status === 'Resolved' ? new Date() : null)
  }
  if (patch.assigned_user !== undefined) {
    fields.push('assigned_user = ?')
    values.push(patch.assigned_user)
  }
  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE incidents SET ${fields.join(', ')} WHERE id = ?`, values)
}

module.exports = { findAll, findById, findOpenByServer, nextId, create, update }
