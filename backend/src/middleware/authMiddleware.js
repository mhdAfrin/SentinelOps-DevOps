const jwt = require('jsonwebtoken')

// Every route except /api/status and /api/auth/login requires a valid
// "Authorization: Bearer <token>" header, issued at login (Task 6).
function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ success: false, error: 'Missing or invalid Authorization header.' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in again.' })
  }
}

module.exports = { requireAuth }
