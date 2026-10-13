const applicationModel = require('../models/applicationModel')

// Task 9: GET /api/applications
async function list(req, res, next) {
  try {
    res.json(await applicationModel.findAll())
  } catch (err) {
    next(err)
  }
}

module.exports = { list }
