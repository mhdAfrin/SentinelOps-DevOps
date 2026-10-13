const express = require('express')
const { list, simulateFailure } = require('../controllers/serverController')

const router = express.Router()
router.get('/', list) // Task 8: GET /api/servers
router.post('/:id/simulate-failure', simulateFailure)
module.exports = router
