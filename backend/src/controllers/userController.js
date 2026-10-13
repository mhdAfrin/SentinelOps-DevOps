const bcrypt = require('bcrypt')
const crypto = require('crypto')
const userModel = require('../models/userModel')

// Task "User Management" (added - the blueprint's task list skipped a
// dedicated users API, but the frontend's Users page needs one).
async function list(req, res, next) {
  try {
    res.json(await userModel.findAll())
  } catch (err) {
    next(err)
  }
}

// Adding a DevOps engineer doesn't need a chosen password for this project -
// a random one is generated and hashed, matching "no need for complex user
// CRUD" from the application-scope blueprint. A real deployment would email
// an invite / reset link instead.
async function create(req, res, next) {
  try {
    const { name, email } = req.body
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ success: false, error: 'Name and email are both required.' })
    }
    const normalizedEmail = email.trim().toLowerCase()
    const existing = await userModel.findByEmail(normalizedEmail)
    if (existing) return res.status(409).json({ success: false, error: 'That email is already in use.' })

    const randomPassword = crypto.randomBytes(9).toString('base64url')
    const passwordHash = await bcrypt.hash(randomPassword, 10)
    const user = await userModel.create({ name: name.trim(), email: normalizedEmail, passwordHash })
    const { password, ...safeUser } = user
    res.status(201).json(safeUser)
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    await userModel.remove(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, remove }
