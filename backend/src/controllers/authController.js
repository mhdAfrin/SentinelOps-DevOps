const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')

// Task 6: POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' })
    }

    const user = await userModel.findByEmail(String(email).trim().toLowerCase())
    if (!user) return res.status(401).json({ success: false, error: 'Email or password is incorrect.' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ success: false, error: 'Email or password is incorrect.' })

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' },
    )
    await userModel.touchLastActive(user.id)

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { login }
