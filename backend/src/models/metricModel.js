const { pool } = require('../config/database')

async function insert({ server_id, cpu_usage, memory_usage, disk_usage }) {
  await pool.query(
    'INSERT INTO metrics (server_id, cpu_usage, memory_usage, disk_usage) VALUES (?, ?, ?, ?)',
    [server_id, cpu_usage, memory_usage, disk_usage],
  )
}

// Aggregated series across ALL servers, bucketed by hour (range=24h) or day
// (range=7d) - this is what feeds the dashboard's CPU/Memory/Disk chart.
async function series(range, liveOnly = false) {
  const hours = range === '7d' ? 168 : 24
  const isLiveDay = liveOnly && range === '24h'
  const bucket = isLiveDay ? 'FROM_UNIXTIME(FLOOR(UNIX_TIMESTAMP(created_at) / 300) * 300)' : 'created_at'
  const bucketFormat = range === '7d' ? '%Y-%m-%d' : isLiveDay ? '%Y-%m-%d %H:%i' : '%Y-%m-%d %H:00'
  const [rows] = await pool.query(
    `SELECT
       DATE_FORMAT(${bucket}, ?) AS label,
       ROUND(AVG(cpu_usage))    AS cpu,
       ROUND(AVG(memory_usage)) AS memory,
       ROUND(AVG(disk_usage))   AS disk
     FROM metrics
     WHERE created_at >= NOW() - INTERVAL ? HOUR
       AND (? = 0 OR EXISTS (SELECT 1 FROM monitor_hosts h WHERE h.server_id = metrics.server_id))
     GROUP BY label
     ORDER BY label`,
    [bucketFormat, hours, Number(liveOnly)],
  )
  return rows
}

module.exports = { insert, series }
