const express = require('express')
const { list } = require('../controllers/applicationController')

const router = express.Router()
router.get('/', list) // Task 9: GET /api/applications
module.exports = router
