const settingsModel = require('../models/settingsModel')

async function get(req, res, next) {
  try {
    res.json(await settingsModel.getThresholds())
  } catch (err) {
    next(err)
  }
}

async function update(req, res, next) {
  try {
    const changes = Object.fromEntries(
      Object.entries(req.body ?? {}).filter(([key]) => Object.hasOwn(settingsModel.DEFAULTS, key)),
    )
    res.json(await settingsModel.setThresholds(changes))
  } catch (err) {
    next(err)
  }
}

module.exports = { get, update }
