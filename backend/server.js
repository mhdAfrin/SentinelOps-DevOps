// Task 3: Create Express server.
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const { verifyConnection } = require('./src/config/database')
const { requireAuth } = require('./src/middleware/authMiddleware')
const { notFound, errorHandler } = require('./src/middleware/errorHandler')

const authRoutes = require('./src/routes/authRoutes')
const userRoutes = require('./src/routes/userRoutes')
const serverRoutes = require('./src/routes/serverRoutes')
const applicationRoutes = require('./src/routes/applicationRoutes')
const incidentRoutes = require('./src/routes/incidentRoutes')
const alertRoutes = require('./src/routes/alertRoutes')
const settingsRoutes = require('./src/routes/settingsRoutes')
const dashboardRoutes = require('./src/routes/dashboardRoutes')
const metricRoutes = require('./src/routes/metricRoutes')

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }))
app.use(express.json())

// First API (Task 3): GET /api/status - no auth required, used for health checks.
app.get('/api/status', (req, res) => {
  res.json({ status: 'SentinelOps Backend Running' })
})

// Login is the one route that must work without a token.
app.use('/api/auth', authRoutes)

// Everything else requires a signed-in DevOps Engineer.
app.use('/api/users', requireAuth, userRoutes)
app.use('/api/servers', requireAuth, serverRoutes)
app.use('/api/applications', requireAuth, applicationRoutes)
app.use('/api/incidents', requireAuth, incidentRoutes)
app.use('/api/alerts', requireAuth, alertRoutes)
app.use('/api/settings', requireAuth, settingsRoutes)
app.use('/api/dashboard', requireAuth, dashboardRoutes)
app.use('/api/metrics', requireAuth, metricRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT ?? 5000

async function start() {
  try {
    await verifyConnection()
    console.log('Connected to MySQL (sentinelops_db)')
  } catch (err) {
    console.error('Could not connect to MySQL - check backend/.env:', err.message)
    process.exit(1)
  }
  app.listen(PORT, () => console.log(`SentinelOps backend listening on http://localhost:${PORT}`))
}

start()
