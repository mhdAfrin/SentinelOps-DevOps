const metricModel = require('../models/metricModel')
const serverModel = require('../models/serverModel')
const settingsModel = require('../models/settingsModel')
const { computeStatus } = require('../services/statusService')
const { hasHost, isPercentage } = require('../services/monitorRules')

// Legacy ingestion for demo inventory. Live lab agents use the monitored heartbeat endpoint.
async function ingest(req, res, next) {
  try {
    const { serverId, cpuUsage, memoryUsage, diskUsage } = req.body ?? {}
    if (typeof serverId !== 'string' || !serverId || ![cpuUsage, memoryUsage, diskUsage].every(isPercentage)) {
      return res.status(400).json({ success: false, error: 'Expected a server ID and CPU, memory and disk percentages from 0 to 100.' })
    }
    if (hasHost(serverId)) return res.status(409).json({ error: 'This host accepts readings only from its agent.' })
    const server = await serverModel.findById(serverId)
    if (!server) return res.status(404).json({ success: false, error: `Unknown server "${serverId}".` })

    await metricModel.insert({ server_id: serverId, cpu_usage: cpuUsage, memory_usage: memoryUsage, disk_usage: diskUsage })

    const thresholds = await settingsModel.getThresholds()
    const status = computeStatus({ cpu_usage: cpuUsage, memory_usage: memoryUsage, disk_usage: diskUsage }, thresholds)
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
    res.json(await metricModel.series(range, req.query.live === '1'))
  } catch (err) {
    next(err)
  }
}

module.exports = { ingest, getSeries }
