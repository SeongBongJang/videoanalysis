'use strict'

const express = require('express'),
    router = express.Router(),
    controller = require('../controller').controller.fileSystem,
    validation = require('../controller').validation.fileSystem

module.exports = exports = router

router.get('/', validation.checkPath, (req, res, next) => {
    res.sendStatus(200)
})

router.delete('/', validation.checkPath, controller.deletePath)