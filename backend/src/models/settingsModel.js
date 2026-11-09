const { pool } = require('../config/database')
const { RULES, isPercentage } = require('../services/monitorRules')

const DEFAULTS = { cpuWarning: 80, cpuCritical: 90, memWarning: 80, memCritical: 90, diskWarning: 80, diskCritical: 90 }

function thresholdsFrom(rows) {
  const thresholds = { ...DEFAULTS }
  for (const { setting_key: key, setting_value: value } of rows) {
    if (Object.hasOwn(DEFAULTS, key) && isPercentage(Number(value))) thresholds[key] = Number(value)
  }
  // Sprint 1–2 had only a memory warning. Preserve it when it is above the new default critical value.
  if (thresholds.memWarning >= thresholds.memCritical) {
    thresholds.memWarning = Math.min(thresholds.memWarning, 99)
    thresholds.memCritical = Math.min(100, Math.floor(thresholds.memWarning) + 1)
  }
  return thresholds
}

async function getThresholds(db = pool) {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM settings')
  return thresholdsFrom(rows)
}

async function setThresholds(changes) {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings FOR UPDATE')
    const next = { ...thresholdsFrom(rows), ...changes }
    for (const { warning, critical, label } of RULES) {
      if (!isPercentage(next[warning]) || !isPercentage(next[critical]) || next[warning] >= next[critical]) {
        const error = new Error(label + ' requires 0 ≤ warning < critical ≤ 100.')
        error.status = 400
        throw error
      }
    }
    for (const [key, value] of Object.entries(changes)) {
      await db.execute(
        'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, String(value), String(value)],
      )
    }
    await db.commit()
    return next
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}

module.exports = { getThresholds, setThresholds, DEFAULTS }
