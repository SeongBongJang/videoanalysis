'use strict'

const logger = require('@amuzlab/logger'),
    schema = require('validate'),
    utils = require('@amuzlab/utils')

module.exports = exports = async (req, res, next) => {
    try {
        let _schema = new schema(
            {
                exec: {
                    type: String,
                    required: true
                }
            }
        )

        let _validateResult = _schema.validate(utils.clone(req.body))

        if (_validateResult.length > 0) {
            throw _validateResult
        }

        res.sendStatus(201)
        next()
    } catch (err) {
        console.error(err)
        if (Array.isArray(err)) {
            logger.error(err.map(_err => _err.message))
            res.status(400).json(err.map(_err => _err.message))
        } else {
            logger.error(JSON.stringify(err))
            res.status(400).json(err)
        }
    }
}