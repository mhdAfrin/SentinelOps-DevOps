const metricModel = require('../models/metricModel')
const serverModel = require('../models/serverModel')
const settingsModel = require('../models/settingsModel')
const { computeStatus } = require('../services/statusService')

// "Store monitoring data" (Objective) - the ingestion endpoint the real
// monitoring agent (next phase) will call every few seconds. It writes
// history (`metrics`) and the server's live reading, and recomputes status.
// It does NOT create incidents/alerts yet - automatic incident/alert
// generation from real thresholds is the Monitoring Engine phase's job, not
// this backend-completion phase's.
async function ingest(req, res, next) {
  try {
    const { serverId, cpuUsage, memoryUsage, diskUsage } = req.body
    if (!serverId || cpuUsage == null || memoryUsage == null || diskUsage == null) {
      return res.status(400).json({ success: false, error: 'serverId, cpuUsage, memoryUsage and diskUsage are required.' })
    }
    const server = await serverModel.findById(serverId)
    if (!server) return res.status(404).json({ success: false, error: `Unknown server "${serverId}".` })

    await metricModel.insert({ server_id: serverId, cpu_usage: cpuUsage, memory_usage: memoryUsage, disk_usage: diskUsage })

    const thresholds = await settingsModel.getThresholds()
    const status = computeStatus({ cpu_usage: cpuUsage, memory_usage: memoryUsage }, thresholds)
    await serverModel.updateReading(serverId, { cpu_usage: cpuUsage, memory_usage: memoryUsage, disk_usage: diskUsage, status })

    res.status(201).json({ success: true, status })
  } catch (err) {
    next(err)
  }
}

// Feeds the dashboard's System Performance chart (24h / 7d).
async function getSeries(req, res, next) {
  try {
    const range = req.query.range === '7d' ? '7d' : '24h'
    res.json(await metricModel.series(range))
  } catch (err) {
    next(err)
  }
}

module.exports = { ingest, getSeries }
