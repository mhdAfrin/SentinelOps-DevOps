const alertModel = require('../models/alertModel')

// Task 11: GET /api/alerts, plus Acknowledge (the Alert Management Module's
// only defined action).
async function list(req, res, next) {
  try {
    res.json(await alertModel.findAll())
  } catch (err) {
    next(err)
  }
}

async function acknowledge(req, res, next) {
  try {
    await alertModel.acknowledge(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

async function acknowledgeAll(req, res, next) {
  try {
    await alertModel.acknowledgeAll()
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

module.exports = { list, acknowledge, acknowledgeAll }
