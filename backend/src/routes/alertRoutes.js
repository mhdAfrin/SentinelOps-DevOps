const express = require('express')
const { list, acknowledge, acknowledgeAll } = require('../controllers/alertController')

const router = express.Router()
router.get('/', list) // Task 11
router.patch('/acknowledge-all', acknowledgeAll)
router.patch('/:id/acknowledge', acknowledge)
module.exports = router
