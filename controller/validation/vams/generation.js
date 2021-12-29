'use strict'

const logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise'),
    schema = require('validate'),
    utils = require('@amuzlab/utils'),
    path = require('path')


Object.defineProperties(
    exports,
    {
        feature: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        id: {
                            type: Number,
                            required: true
                        },
                        filePath: {
                            type: String,
                            required: true
                        }
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await fs.fileSystem.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath))

                    res.sendStatus(201)
                    next()

                } catch (err) {
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.status(400).json(err.map(_err => _err.message))
                    } else {
                        logger.error(JSON.stringify(err))
                        res.status(400).json(err)
                    }
                }
            }
        }
    }
)
