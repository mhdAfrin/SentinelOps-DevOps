const express = require('express')
const { list, create, update } = require('../controllers/incidentController')

const router = express.Router()
router.get('/', list)       // Task 10
router.post('/', create)    // Task 10
router.patch('/:id', update) // Task 10
module.exports = router
