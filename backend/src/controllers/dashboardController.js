const serverModel = require('../models/serverModel')
const applicationModel = require('../models/applicationModel')
const incidentModel = require('../models/incidentModel')
const alertModel = require('../models/alertModel')

// Task 7: GET /api/dashboard
// The blueprint's example response was a flat {servers, applications,
// activeIncidents, alerts} count. Dashboard.jsx actually needs the
// Infrastructure Health breakdown (healthy/warning/critical/offline) and a
// Recent Incidents list too, so this response is enriched to match what the
// frontend renders - the four counts are still there, just alongside it.
async function summary(req, res, next) {
  try {
    const [servers, applications, incidents, alerts] = await Promise.all([
      serverModel.findAll(),
      applicationModel.findAll(),
      incidentModel.findAll(),
      alertModel.findAll(),
    ])

    const health = { healthy: 0, warning: 0, critical: 0, offline: 0 }
    for (const s of servers) {
      const key = s.status.toLowerCase()
      if (health[key] !== undefined) health[key] += 1
    }
    const percent = servers.length ? Math.round((health.healthy / servers.length) * 100) : 0

    res.json({
      servers: servers.length,
      applications: applications.length,
      activeIncidents: incidents.filter((i) => i.status !== 'Resolved').length,
      alerts: alerts.filter((a) => a.status !== 'Acknowledged').length,
      health: { ...health, total: servers.length, percent },
      recentIncidents: incidents.slice(0, 5),
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { summary }
