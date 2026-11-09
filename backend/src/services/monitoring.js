const { readFile } = require('node:fs/promises')
const path = require('node:path')
const { randomBytes } = require('node:crypto')
const { pool } = require('../config/database')
const { getThresholds } = require('../models/settingsModel')
const { HOSTS, RULES, severityFor } = require('./monitorRules')

async function initializeMonitoring() {
  const sql = await readFile(path.join(__dirname, '../config/monitoring.sql'), 'utf8')
  for (const statement of sql.split(';').map(part => part.trim()).filter(Boolean)) {
    await pool.query(statement)
  }
  const timeout = Number(process.env.MONITOR_OFFLINE_SECONDS || 90)
  if (!Number.isInteger(timeout) || timeout < 5 || timeout > 86400) {
    throw new Error('MONITOR_OFFLINE_SECONDS must be an integer between 5 and 86400.')
  }
  const tokens = Object.values(HOSTS).map(host => process.env[host.tokenEnv]).filter(Boolean)
  if (tokens.some(token => token.length < 32) || new Set(tokens).size !== tokens.length) {
    throw new Error('Monitoring tokens must be distinct and at least 32 characters long.')
  }
  return timeout
}

async function transaction(work) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const result = await work(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

async function logEvent(db, target, incident, type, detail, observedAt) {
  await db.execute(
    'INSERT INTO monitor_events (target_id, incident_id, event_type, detail, observed_at) VALUES (?, ?, ?, ?, ?)',
    [target, incident, type, detail, observedAt],
  )
}

// The caller holds the host or probe row lock for this target. The condition,
// incident, alert and history are committed together.
async function applyCondition(db, { target, rule, title, source, severity, detail, observedAt, serverId = null, recoverySamples = 1 }) {
  const [[active]] = await db.execute(
    'SELECT incident_id, alert_id, severity, healthy_count FROM monitor_conditions WHERE target_id = ? AND rule_key = ?',
    [target, rule],
  )
  if (!severity) {
    if (!active) return
    if (active.healthy_count + 1 < recoverySamples) {
      await db.execute(
        'UPDATE monitor_conditions SET healthy_count = healthy_count + 1 WHERE target_id = ? AND rule_key = ?',
        [target, rule],
      )
      return
    }
    await db.execute("UPDATE incidents SET status = 'Resolved', resolved_at = FROM_UNIXTIME(? / 1000) WHERE id = ?", [observedAt, active.incident_id])
    await db.execute("UPDATE alerts SET status = 'Resolved' WHERE id = ?", [active.alert_id])
    await db.execute('DELETE FROM monitor_conditions WHERE target_id = ? AND rule_key = ?', [target, rule])
    await logEvent(db, target, active.incident_id, 'Recovered', detail, observedAt)
    await logEvent(db, target, active.incident_id, 'Auto-resolved', 'Closed the incident and alert after confirmed recovery.', observedAt)
    return
  }

  if (active) {
    if (severity === 'Critical' && active.severity === 'Warning') {
      await db.execute("UPDATE incidents SET severity = 'Critical' WHERE id = ?", [active.incident_id])
      await db.execute("UPDATE alerts SET severity = 'Critical', status = 'Active', message = ? WHERE id = ?", [detail, active.alert_id])
      await db.execute("UPDATE monitor_conditions SET severity = 'Critical', healthy_count = 0 WHERE target_id = ? AND rule_key = ?", [target, rule])
      await logEvent(db, target, active.incident_id, 'Escalated', detail, observedAt)
    } else if (active.healthy_count) {
      await db.execute('UPDATE monitor_conditions SET healthy_count = 0 WHERE target_id = ? AND rule_key = ?', [target, rule])
    }
    return
  }

  const incidentId = 'MON-' + randomBytes(8).toString('hex')
  const alertId = 'MAL-' + randomBytes(8).toString('hex')
  await db.execute(
    'INSERT INTO incidents (id, title, source, severity, server_id, created_at) VALUES (?, ?, ?, ?, ?, FROM_UNIXTIME(? / 1000))',
    [incidentId, title, source, severity, serverId, observedAt],
  )
  await db.execute(
    'INSERT INTO alerts (id, type, message, source, severity, server_id, created_at) VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(? / 1000))',
    [alertId, title, detail, source, severity, serverId, observedAt],
  )
  await db.execute(
    'INSERT INTO monitor_conditions (target_id, rule_key, incident_id, alert_id, severity) VALUES (?, ?, ?, ?, ?)',
    [target, rule, incidentId, alertId, severity],
  )
  await logEvent(db, target, incidentId, 'Opened', detail, observedAt)
}

async function recordHost(id, reading) {
  const source = HOSTS[id].label
  return transaction(async db => {
    // Insert only once. Subsequent writes serialize on the server row before reading monitor state.
    await db.execute(
      "INSERT INTO servers (id, server_name, server_type, ip_address) VALUES (?, ?, 'Web', ?) ON DUPLICATE KEY UPDATE id = id",
      [id, source, reading.ipAddress],
    )
    const [[previous]] = await db.execute('SELECT sample_at FROM monitor_hosts WHERE server_id = ? FOR UPDATE', [id])
    if (previous && Number(previous.sample_at) >= reading.observedAt) return { accepted: false }

    const thresholds = await getThresholds(db)
    await db.execute(
      'INSERT INTO metrics (server_id, cpu_usage, memory_usage, disk_usage) VALUES (?, ?, ?, ?)',
      [id, reading.cpuUsage, reading.memoryUsage, reading.diskUsage],
    )
    await db.execute(
      'INSERT INTO monitor_hosts (server_id, last_seen, sample_at) VALUES (?, UTC_TIMESTAMP(3), ?) ON DUPLICATE KEY UPDATE last_seen = UTC_TIMESTAMP(3), sample_at = ?',
      [id, reading.observedAt, reading.observedAt],
    )
    const observedAt = Date.now()
    await applyCondition(db, {
      target: id, serverId: id, rule: 'heartbeat', source,
      title: 'Agent offline', severity: null, detail: 'Agent heartbeat resumed.', observedAt,
    })

    let status = 'Healthy'
    for (const rule of RULES) {
      const value = reading[rule.field]
      const severity = severityFor(value, thresholds[rule.warning], thresholds[rule.critical])
      if (severity === 'Critical' || (severity === 'Warning' && status === 'Healthy')) status = severity
      await applyCondition(db, {
        target: id, serverId: id, rule: rule.key, title: rule.label + ' above threshold', source, severity,
        detail: severity
          ? rule.label + ' is ' + value + '% (threshold ' + thresholds[severity === 'Critical' ? rule.critical : rule.warning] + '%).'
          : rule.label + ' returned below warning at ' + value + '%.',
        observedAt, recoverySamples: 2,
      })
    }
    await db.execute(
      'UPDATE servers SET ip_address = ?, cpu_usage = ?, memory_usage = ?, disk_usage = ?, status = ? WHERE id = ?',
      [reading.ipAddress, reading.cpuUsage, reading.memoryUsage, reading.diskUsage, status, id],
    )
    return { accepted: true, status }
  })
}

async function checkOffline(timeout) {
  const [hosts] = await pool.execute(
    "SELECT server_id FROM monitor_hosts JOIN servers ON servers.id = server_id WHERE last_seen < UTC_TIMESTAMP(3) - INTERVAL ? SECOND AND status != 'Offline'",
    [timeout],
  )
  for (const { server_id: id } of hosts) {
    await transaction(async db => {
      await db.execute('SELECT id FROM servers WHERE id = ? FOR UPDATE', [id])
      const [[stale]] = await db.execute(
        'SELECT server_id FROM monitor_hosts WHERE server_id = ? AND last_seen < UTC_TIMESTAMP(3) - INTERVAL ? SECOND FOR UPDATE',
        [id, timeout],
      )
      if (!stale) return
      await db.execute("UPDATE servers SET status = 'Offline' WHERE id = ?", [id])
      await db.execute('UPDATE monitor_conditions SET healthy_count = 0 WHERE target_id = ?', [id])
      await applyCondition(db, {
        target: id, serverId: id, rule: 'heartbeat', source: HOSTS[id].label, title: 'Agent offline',
        severity: 'Critical', detail: 'No heartbeat received for more than ' + timeout + ' seconds.', observedAt: Date.now(),
      })
    })
  }
}

function startOfflineChecks(timeout) {
  async function tick() {
    try { await checkOffline(timeout) } catch (error) { console.error('Heartbeat check failed:', error.message) }
    setTimeout(tick, Math.min(timeout * 1000, 10000)).unref()
  }
  void tick()
}

const PROBES = { api: 'SentinelOps API', database: 'SentinelOps MySQL' }
async function recordProbes({ api, database, observedAt, rechecked }) {
  return transaction(async db => {
    for (const [probe, state] of Object.entries({ api, database })) {
      await db.execute(
        "INSERT INTO monitor_probes (probe_key, state, observed_at) VALUES (?, 'unknown', 0) ON DUPLICATE KEY UPDATE probe_key = probe_key",
        [probe],
      )
      const [[last]] = await db.execute('SELECT state, observed_at FROM monitor_probes WHERE probe_key = ? FOR UPDATE', [probe])
      if (Number(last.observed_at) >= observedAt) continue
      await db.execute('UPDATE monitor_probes SET state = ?, observed_at = ? WHERE probe_key = ?', [state, observedAt, probe])
      if (state === 'unknown') continue
      const source = PROBES[probe]
      const target = 'service-' + probe
      await applyCondition(db, {
        target, rule: 'availability', source, title: source + ' unavailable',
        severity: state === 'down' ? 'Critical' : null,
        detail: state === 'down' ? source + ' failed its health probe.' : source + ' passed its health probe.',
        observedAt,
      })
      if (state === 'down' && last.state !== 'down' && rechecked) {
        const [[condition]] = await db.execute('SELECT incident_id FROM monitor_conditions WHERE target_id = ? AND rule_key = ?', [target, 'availability'])
        await logEvent(db, target, condition.incident_id, 'Rechecked', 'The witness repeated the read-only health check before opening an incident.', observedAt)
      }
    }
  })
}

async function monitoringSummary() {
  const [hosts] = await pool.query(
    "SELECT s.id, s.status, s.ip_address, DATE_FORMAT(m.last_seen, '%Y-%m-%dT%H:%i:%s.%fZ') AS last_seen FROM servers s JOIN monitor_hosts m ON m.server_id = s.id",
  )
  const [probes] = await pool.query('SELECT probe_key, state, observed_at FROM monitor_probes ORDER BY probe_key')
  const witness = hosts.find(host => host.id === 'ncc-pc-2')
  return {
    hosts: Object.entries(HOSTS).map(([id, host]) => ({
      id, label: host.label, enabled: Boolean(process.env[host.tokenEnv]), ...hosts.find(row => row.id === id),
    })),
    probes: Object.entries(PROBES).map(([key, label]) => {
      const probe = probes.find(row => row.probe_key === key)
      return {
        key, label, observed_at: probe?.observed_at,
        state: witness && witness.status !== 'Offline' ? probe?.state ?? 'unknown' : 'unknown',
      }
    }),
  }
}

async function events() {
  const [rows] = await pool.query('SELECT id, target_id, incident_id, event_type, detail, observed_at FROM monitor_events ORDER BY id DESC LIMIT 50')
  return rows
}

async function investigateIncident(id, patch) {
  return transaction(async db => {
    const [[incident]] = await db.execute('SELECT status FROM incidents WHERE id = ? FOR UPDATE', [id])
    if (patch.status !== undefined && (patch.status !== 'Investigating' || incident.status === 'Resolved')) return false
    if (patch.assigned_user !== undefined) await db.execute('UPDATE incidents SET assigned_user = ? WHERE id = ?', [patch.assigned_user, id])
    if (patch.status === 'Investigating' && incident.status === 'Open') {
      await db.execute("UPDATE incidents SET status = 'Investigating' WHERE id = ?", [id])
      const [[opened]] = await db.execute("SELECT target_id FROM monitor_events WHERE incident_id = ? AND event_type = 'Opened' LIMIT 1", [id])
      await logEvent(db, opened.target_id, id, 'Investigating', 'An engineer acknowledged the incident and started investigation.', Date.now())
    }
    return true
  })
}

module.exports = { initializeMonitoring, startOfflineChecks, recordHost, recordProbes, monitoringSummary, events, investigateIncident }
