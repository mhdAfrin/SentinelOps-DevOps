const express = require('express')
const { summary } = require('../controllers/dashboardController')

const router = express.Router()
router.get('/', summary) // Task 7: GET /api/dashboard
module.exports = router
