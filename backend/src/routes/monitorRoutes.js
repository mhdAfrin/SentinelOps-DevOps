const express = require('express')
const { createHash, timingSafeEqual } = require('node:crypto')
const { isIP } = require('node:net')
const { requireAuth } = require('../middleware/authMiddleware')
const { HOSTS, hasHost, isPercentage } = require('../services/monitorRules')
const monitoring = require('../services/monitoring')

const router = express.Router()
const digest = value => createHash('sha256').update(value).digest()
const isTime = value => Number.isSafeInteger(value) && value > 0 && value <= Date.now() + 60000

function requireAgent(req, res, next) {
  const id = req.get('X-Monitor-Host')
  const secret = hasHost(id) && process.env[HOSTS[id].tokenEnv]
  const auth = req.get('Authorization') || ''
  if (!secret || !timingSafeEqual(digest('Bearer ' + secret), digest(auth))) {
    return res.status(401).json({ error: 'Invalid monitoring credentials.' })
  }
  req.monitorHost = id
  next()
}

router.post('/heartbeat', requireAgent, async (req, res) => {
  const { cpuUsage, memoryUsage, diskUsage, ipAddress, observedAt } = req.body ?? {}
  if (![cpuUsage, memoryUsage, diskUsage].every(isPercentage) || typeof ipAddress !== 'string' || !isIP(ipAddress)
    || !isTime(observedAt) || observedAt < Date.now() - 120000) {
    return res.status(400).json({ error: 'Expected fresh CPU, RAM and disk percentages, an IP address, and an observation time.' })
  }
  res.json(await monitoring.recordHost(req.monitorHost, { cpuUsage, memoryUsage, diskUsage, ipAddress, observedAt }))
})

router.post('/probes', requireAgent, async (req, res) => {
  if (!HOSTS[req.monitorHost].probe) return res.status(403).json({ error: 'Only the PC 2 witness can submit service probes.' })
  const { api, database, observedAt, rechecked } = req.body ?? {}
  if (!['up', 'down'].includes(api) || !['up', 'down', 'unknown'].includes(database)
    || (api === 'down' && database !== 'unknown') || !isTime(observedAt) || typeof rechecked !== 'boolean') {
    return res.status(400).json({ error: 'Invalid API/database probe observation.' })
  }
  await monitoring.recordProbes({ api, database, observedAt, rechecked })
  res.sendStatus(204)
})

router.get('/summary', requireAuth, async (_req, res) => res.json(await monitoring.monitoringSummary()))
router.get('/events', requireAuth, async (_req, res) => res.json(await monitoring.events()))
module.exports = router
