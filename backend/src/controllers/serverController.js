const serverModel = require('../models/serverModel')
const incidentModel = require('../models/incidentModel')
const alertModel = require('../models/alertModel')
const settingsModel = require('../models/settingsModel')

// Task 8: GET /api/servers
async function list(req, res, next) {
  try {
    res.json(await serverModel.findAll())
  } catch (err) {
    next(err)
  }
}

// Infrastructure Monitoring Module -> "Simulate Failure" action. Forces a
// critical CPU reading on a real row, then creates a real incident + alert -
// a manual stand-in for the Monitoring Engine phase's automatic detection,
// used for demos before the real agent is wired up.
async function simulateFailure(req, res, next) {
  try {
    const { id } = req.params
    const server = await serverModel.findById(id)
    if (!server) return res.status(404).json({ success: false, error: `Unknown server "${id}".` })

    const existing = await incidentModel.findOpenByServer(id)
    if (existing) return res.status(409).json({ success: false, error: 'This server already has an open incident.' })

    const thresholds = await settingsModel.getThresholds()
    await serverModel.updateReading(id, {
      cpu_usage: 96,
      memory_usage: server.memory_usage,
      disk_usage: server.disk_usage,
      status: 'Critical',
    })

    const incidentId = await incidentModel.nextId()
    const incident = await incidentModel.create({
      id: incidentId,
      title: `Critical CPU Usage on ${server.server_name}`,
      source: server.server_name,
      severity: 'Critical',
      server_id: id,
    })

    const alertId = await alertModel.nextId()
    await alertModel.create({
      id: alertId,
      type: `CPU Usage Above ${thresholds.cpuCritical}%`,
      message: `CPU usage on ${server.server_name} has crossed the critical threshold.`,
      source: server.server_name,
      severity: 'Critical',
      server_id: id,
    })

    res.status(201).json(incident)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, simulateFailure }
