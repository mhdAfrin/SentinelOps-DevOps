// Seeds sentinelops_db with the same data the frontend's old mockData.js
// used, so the live app looks identical on first run. Run with `npm run seed`
// AFTER importing database/schema.sql.
require('dotenv').config()
const bcrypt = require('bcrypt')
const { pool } = require('../config/database')

function hoursAgo(h, m = 0, daysAgo = 0) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(h, m, 0, 0)
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

const USERS = [
  { name: 'Dinuka Kavinda', email: 'devops@sentinelops.io', password: 'devops123', status: 'Active', lastActive: hoursAgo(10, 20) },
  { name: 'Nimali Perera', email: 'nimali@sentinelops.io', password: 'nimali123', status: 'Active', lastActive: hoursAgo(9, 55) },
  { name: 'Kasun Silva', email: 'kasun@sentinelops.io', password: 'kasun123', status: 'Active', lastActive: hoursAgo(8, 40) },
  { name: 'Ishara Fernando', email: 'ishara@sentinelops.io', password: 'ishara123', status: 'Active', lastActive: hoursAgo(17, 10, 1) },
  { name: 'Tharindu Jayasuriya', email: 'tharindu@sentinelops.io', password: 'tharindu123', status: 'Inactive', lastActive: hoursAgo(12, 0, 9) },
]

const SERVERS = [
  ['prod-web-01', 'prod-web-01', 'Web', '10.0.1.11', 85, 72, 60],
  ['prod-web-02', 'prod-web-02', 'Web', '10.0.1.12', 45, 58, 40],
  ['prod-api-01', 'prod-api-01', 'API', '10.0.2.21', 52, 61, 48],
  ['prod-api-02', 'prod-api-02', 'API', '10.0.2.22', 47, 57, 51],
  ['prod-api-03', 'prod-api-03', 'API', '10.0.2.23', 41, 52, 37],
  ['prod-api-04', 'prod-api-04', 'API', '10.0.2.24', 38, 49, 44],
  ['prod-db-01', 'prod-db-01', 'Database', '10.0.3.31', 92, 81, 70],
  ['prod-db-02', 'prod-db-02', 'Database', '10.0.3.32', 30, 40, 65],
]

const APPS = [
  ['User Authentication Service', 'v2.0.7', 'Healthy', 98, 99.9, 'prod-api-01'],
  ['Payment Service', 'v3.1.0', 'Down', null, 95.2, 'prod-api-02'],
  ['Notification Service', 'v1.8.3', 'Healthy', 210, 99.8, 'prod-api-03'],
  ['Database Service', 'MySQL 8.0', 'Critical', 1200, 92.1, 'prod-db-01'],
  ['API Gateway Service', 'v1.12.0', 'Healthy', 132, 99.6, 'prod-api-04'],
]

async function run() {
  const conn = await pool.getConnection()
  try {
    console.log('Clearing existing data...')
    await conn.query('SET FOREIGN_KEY_CHECKS = 0')
    for (const t of ['metrics', 'alerts', 'incidents', 'applications', 'servers', 'users', 'settings']) {
      await conn.query(`TRUNCATE TABLE ${t}`)
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1')

    console.log('Seeding settings (alert thresholds)...')
    await conn.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?,?), (?,?), (?,?)',
      ['cpuWarning', '80', 'cpuCritical', '90', 'memWarning', '80'],
    )

    console.log('Seeding users...')
    const userIds = {}
    for (const u of USERS) {
      const passwordHash = await bcrypt.hash(u.password, 10)
      const [result] = await conn.query(
        'INSERT INTO users (name, email, password, role, status, last_active) VALUES (?,?,?,?,?,?)',
        [u.name, u.email, passwordHash, 'DevOps Engineer', u.status, u.lastActive],
      )
      userIds[u.email] = result.insertId
    }

    console.log('Seeding servers...')
    for (const [id, name, type, ip, cpu, mem, disk] of SERVERS) {
      const status = cpu >= 90 ? 'Critical' : cpu >= 80 || mem >= 80 ? 'Warning' : 'Healthy'
      await conn.query(
        'INSERT INTO servers (id, server_name, server_type, ip_address, status, cpu_usage, memory_usage, disk_usage) VALUES (?,?,?,?,?,?,?,?)',
        [id, name, type, ip, status, cpu, mem, disk],
      )
    }

    console.log('Seeding applications...')
    for (const [name, version, status, responseTime, uptime, host] of APPS) {
      await conn.query(
        'INSERT INTO applications (name, version, status, response_time, uptime, host_server_id) VALUES (?,?,?,?,?,?)',
        [name, version, status, responseTime, uptime, host],
      )
    }

    const u1 = userIds['devops@sentinelops.io']
    const u2 = userIds['nimali@sentinelops.io']
    const u4 = userIds['ishara@sentinelops.io']

    console.log('Seeding incidents...')
    const incidents = [
      ['INC-1042', 'Database Connection Failure', 'prod-db-01', 'Critical', 'Open', 'prod-db-01', null, hoursAgo(10, 15), null],
      ['INC-1041', 'High CPU Usage', 'prod-web-01', 'Warning', 'Investigating', 'prod-web-01', u2, hoursAgo(9, 40), null],
      ['INC-1040', 'Payment Service Unavailable', 'Payment Service', 'Critical', 'Open', 'prod-api-02', null, hoursAgo(8, 12), null],
      ['INC-1039', 'Database Replica Lag', 'prod-db-02', 'Warning', 'Resolved', 'prod-db-02', u2, hoursAgo(16, 20, 1), hoursAgo(17, 5, 1)],
      ['INC-1037', 'Auth Service Latency Spike', 'User Authentication Service', 'Warning', 'Resolved', 'prod-api-01', u1, hoursAgo(11, 5, 2), hoursAgo(11, 50, 2)],
      ['INC-1036', 'API Gateway 5xx Errors', 'API Gateway Service', 'Critical', 'Resolved', 'prod-api-04', u1, hoursAgo(9, 45, 5), hoursAgo(10, 20, 5)],
      ['INC-1035', 'Memory Leak In Notification Worker', 'Notification Service', 'Warning', 'Resolved', 'prod-api-03', u4, hoursAgo(14, 0, 4), hoursAgo(16, 30, 4)],
    ]
    for (const row of incidents) {
      await conn.query(
        'INSERT INTO incidents (id, title, source, severity, status, server_id, assigned_user, created_at, resolved_at) VALUES (?,?,?,?,?,?,?,?,?)',
        row,
      )
    }

    console.log('Seeding alerts...')
    const alerts = [
      ['ALT-2001', 'Memory Usage Above 80%', 'Memory usage on prod-db-01 has stayed above 80% for 5 minutes.', 'prod-db-01', 'Critical', 'Active', 'prod-db-01', hoursAgo(10, 10)],
      ['ALT-2002', 'Disk I/O Latency Above Threshold', 'Disk I/O latency on prod-web-01 exceeds the configured threshold.', 'prod-web-01', 'Critical', 'Active', 'prod-web-01', hoursAgo(9, 55)],
      ['ALT-2003', 'CPU Usage Above 80%', 'CPU usage on prod-web-01 has crossed the warning threshold.', 'prod-web-01', 'Warning', 'Active', 'prod-web-01', hoursAgo(9, 40)],
      ['ALT-2004', 'Application Not Responding', 'Payment Service is not responding to health checks.', 'Payment Service', 'Warning', 'Active', 'prod-api-02', hoursAgo(9, 30)],
      ['ALT-2005', 'Failed Login Attempts Spike', 'Unusual number of failed logins detected.', 'User Authentication Service', 'Warning', 'Active', 'prod-api-01', hoursAgo(8, 20)],
      ['ALT-2006', 'Database Connection Failed', 'Database Service could not reach prod-db-01.', 'Database Service', 'Critical', 'Active', 'prod-db-01', hoursAgo(8, 50)],
      ['ALT-2007', 'High Response Time Detected', 'API Gateway Service response time is above normal.', 'API Gateway Service', 'Warning', 'Acknowledged', 'prod-api-04', hoursAgo(2, 30)],
      ['ALT-2008', 'Notification Delivery Delayed', 'Notification Service delivery is running behind schedule.', 'Notification Service', 'Information', 'Acknowledged', 'prod-api-03', hoursAgo(18, 5, 1)],
    ]
    for (const row of alerts) {
      await conn.query(
        'INSERT INTO alerts (id, type, message, source, severity, status, server_id, created_at) VALUES (?,?,?,?,?,?,?,?)',
        row,
      )
    }

    console.log('Seeding a day of metrics history (for the dashboard chart)...')
    const serverIds = SERVERS.map((s) => s[0])
    const points = []
    for (const id of serverIds) {
      const base = SERVERS.find((s) => s[0] === id)
      for (let h = 23; h >= 0; h--) {
        const jitter = () => Math.round((Math.random() - 0.5) * 10)
        points.push([
          id,
          Math.max(5, Math.min(98, base[4] + jitter())),
          Math.max(5, Math.min(98, base[5] + jitter())),
          Math.max(5, Math.min(98, base[6] + jitter())),
          `NOW() - INTERVAL ${h} HOUR`,
        ])
      }
    }
    for (const [serverId, cpu, mem, disk, whenExpr] of points) {
      await conn.query(
        `INSERT INTO metrics (server_id, cpu_usage, memory_usage, disk_usage, created_at) VALUES (?,?,?,?, ${whenExpr})`,
        [serverId, cpu, mem, disk],
      )
    }

    console.log('Done. Demo logins:')
    console.log('  devops@sentinelops.io / devops123')
    console.log('  ishara@sentinelops.io / ishara123')
  } finally {
    conn.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
