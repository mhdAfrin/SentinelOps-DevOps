const express = require('express')
const { get, update } = require('../controllers/settingsController')

const router = express.Router()
router.get('/thresholds', get)
router.put('/thresholds', update)
module.exports = router
