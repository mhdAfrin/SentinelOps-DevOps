const settingsModel = require('../models/settingsModel')

// Settings Module: Alert Threshold Settings (added API - not in the
// blueprint's task list, but the thresholds have to be readable/writable
// from somewhere for Settings.jsx and the future monitoring engine).
async function get(req, res, next) {
  try {
    res.json(await settingsModel.getThresholds())
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const { cpuWarning, cpuCritical, memWarning } = req.body
    if (cpuWarning !== undefined && cpuCritical !== undefined && Number(cpuWarning) >= Number(cpuCritical)) {
      return res.status(400).json({ success: false, error: 'cpuWarning must be lower than cpuCritical.' })
    }
    res.json(await settingsModel.setThresholds({ cpuWarning, cpuCritical, memWarning }))
  } catch (err) {
    next(err)
  }
}

module.exports = { get, update }
