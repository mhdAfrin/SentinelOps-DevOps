const express = require('express')
const { ingest, getSeries } = require('../controllers/metricController')

const router = express.Router()
router.post('/', ingest)
router.get('/series', getSeries)
module.exports = router
