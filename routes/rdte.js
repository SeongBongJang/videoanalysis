'use strict'

const express = require('express'),
    router = express.Router(),    
    controller = require('../controller').controller.rdte,
    validation = require('../controller').validation.rdte

module.exports = exports = router

router.post('/shot/extraction', validation.extraction.shot, controller.extraction.shot)

router.get('/', controller.search)
router.get('/:id', controller.search)

router.delete('/', controller.stop)
router.delete('/:id', controller.stop)

router.put('/failover/:state', controller.failover)

router.post('/retransmission', controller.retransmission)