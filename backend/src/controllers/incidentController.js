const incidentModel = require('../models/incidentModel')
const serverModel = require('../models/serverModel')
const { computeStatus } = require('../services/statusService')
const settingsModel = require('../models/settingsModel')

// Task 10: GET/POST /api/incidents, PATCH /api/incidents/:id
async function list(req, res, next) {
  try {
    res.json(await incidentModel.findAll())
  } catch (err) {
    next(err)
  }
}

// Manual incident creation (e.g. an engineer noticing something the
// monitoring engine hasn't flagged yet). Automatic creation from real
// threshold breaches is the Monitoring Engine phase's job, built on top of
// this same model function.
async function create(req, res, next) {
  try {
    const { title, source, severity, server_id, assigned_user } = req.body
    if (!title || !source || !severity) {
      return res.status(400).json({ success: false, error: 'title, source and severity are required.' })
    }
    const id = await incidentModel.nextId()
    const incident = await incidentModel.create({ id, title, source, severity, server_id, assigned_user })
    res.status(201).json(incident)
  } catch (err) {
    next(err)
  }
}

// Status flow: Open -> Investigating -> Resolved (or Reopen back to Open).
// Also accepts a bare assignee change with no status change.
async function update(req, res, next) {
  try {
    const { status, assigned_user } = req.body
    const allowed = ['Open', 'Investigating', 'Resolved']
    if (status !== undefined && !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: `status must be one of ${allowed.join(', ')}` })
    }

    const incident = await incidentModel.findById(req.params.id)
    if (!incident) return res.status(404).json({ success: false, error: `No incident "${req.params.id}".` })

    await incidentModel.update(req.params.id, { status, assigned_user })

    // Demo-friendly recovery: resolving an incident that was caused by the
    // "Simulate Failure" action brings that server's CPU back down, since
    // there is no real monitoring agent yet to report a new, healthy reading.
    // Once the Monitoring Engine phase is wired up, real readings replace
    // this entirely.
    if (status === 'Resolved' && incident.server_id) {
      const server = await serverModel.findById(incident.server_id)
      if (server && Number(server.cpu_usage) >= 90) {
        const thresholds = await settingsModel.getThresholds()
        const recoveredCpu = Math.max(30, thresholds.cpuWarning - 20)
        const newStatus = computeStatus({ cpu_usage: recoveredCpu, memory_usage: server.memory_usage }, thresholds)
        await serverModel.updateReading(incident.server_id, {
          cpu_usage: recoveredCpu,
          memory_usage: server.memory_usage,
          disk_usage: server.disk_usage,
          status: newStatus,
        })
      }
    }

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update }
