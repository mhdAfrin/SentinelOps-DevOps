const { pool } = require('../config/database')

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email])
  return rows[0] ?? null
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id])
  return rows[0] ?? null
}

async function findAll() {
  const [rows] = await pool.query('SELECT id, name, email, role, status, last_active FROM users ORDER BY name')
  return rows
}

async function create({ name, email, passwordHash }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)',
    [name, email, passwordHash, 'DevOps Engineer', 'Active'],
  )
  return findById(result.insertId)
}

async function remove(id) {
  await pool.query('DELETE FROM users WHERE id = ?', [id])
}

async function touchLastActive(id) {
  await pool.query('UPDATE users SET last_active = NOW() WHERE id = ?', [id])
}

module.exports = { findByEmail, findById, findAll, create, remove, touchLastActive }
