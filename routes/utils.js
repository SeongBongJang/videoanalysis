'use strict'

const express = require('express'),
    logger = require('@amuzlab/logger'),
    router = express.Router(),
    util = require('util'),
    controller = require('../controller').controller.utils

module.exports = exports = router

router.post('/image-crop', controller.image.crop)

router.post('/thumbnail', controller.video.thumbnail)