const bcrypt = require('bcrypt')
const { pool } = require('../config/database')
const userModel = require('../models/userModel')

async function bootstrapUser() {
  const email = process.env.BOOTSTRAP_EMAIL?.trim().toLowerCase()
  const password = process.env.BOOTSTRAP_PASSWORD
  if (!email && !password) return

  const [users] = await pool.query('SELECT 1 FROM users LIMIT 1')
  if (users.length) return

  if (!email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 160) {
    throw new Error('Set a valid BOOTSTRAP_EMAIL and BOOTSTRAP_PASSWORD for the first account.')
  }
  if (password.length < 12 || Buffer.byteLength(password) > 72) {
    throw new Error('BOOTSTRAP_PASSWORD must be at least 12 characters and no more than 72 bytes.')
  }

  const passwordHash = await bcrypt.hash(password, 10)
  try {
    await userModel.create({ name: 'SentinelOps Administrator', email, passwordHash })
  } catch (err) {
    if (err.code !== 'ER_DUP_ENTRY') throw err
  }
}

module.exports = { bootstrapUser }
