const { pool } = require('../config/database')

async function insert({ server_id, cpu_usage, memory_usage, disk_usage }) {
  await pool.query(
    'INSERT INTO metrics (server_id, cpu_usage, memory_usage, disk_usage) VALUES (?, ?, ?, ?)',
    [server_id, cpu_usage, memory_usage, disk_usage],
  )
}

// Aggregated series across ALL servers, bucketed by hour (range=24h) or day
// (range=7d) - this is what feeds the dashboard's CPU/Memory/Disk chart.
async function series(range) {
  const hours = range === '7d' ? 168 : 24
  const bucketFormat = range === '7d' ? '%Y-%m-%d' : '%Y-%m-%d %H:00'
  const [rows] = await pool.query(
    `SELECT
       DATE_FORMAT(created_at, ?) AS label,
       ROUND(AVG(cpu_usage))    AS cpu,
       ROUND(AVG(memory_usage)) AS memory,
       ROUND(AVG(disk_usage))   AS disk
     FROM metrics
     WHERE created_at >= NOW() - INTERVAL ? HOUR
     GROUP BY label
     ORDER BY label`,
    [bucketFormat, hours],
  )
  return rows
}

module.exports = { insert, series }
