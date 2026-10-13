const { pool } = require('../config/database')

const DEFAULTS = { cpuWarning: '80', cpuCritical: '90', memWarning: '80' }

async function getThresholds() {
  const [rows] = await pool.query('SELECT setting_key, setting_value FROM settings')
  const map = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]))
  return {
    cpuWarning: Number(map.cpuWarning ?? DEFAULTS.cpuWarning),
    cpuCritical: Number(map.cpuCritical ?? DEFAULTS.cpuCritical),
    memWarning: Number(map.memWarning ?? DEFAULTS.memWarning),
  }
}

async function setThresholds({ cpuWarning, cpuCritical, memWarning }) {
  const entries = Object.entries({ cpuWarning, cpuCritical, memWarning }).filter(([, v]) => v !== undefined)
  for (const [key, value] of entries) {
    await pool.query(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, String(value), String(value)],
    )
  }
  return getThresholds()
}

module.exports = { getThresholds, setThresholds, DEFAULTS }
