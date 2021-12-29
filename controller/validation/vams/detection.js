'use strict'

const logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise'),
    schema = require('validate'),
    utils = require('@amuzlab/utils'),
    path = require('path')


Object.defineProperties(
    exports,
    {
        shot: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        contentList: [{
                            id: {
                                type: Number,
                                required: true
                            },
                            filePath: {
                                type: String,
                                required: true
                            },
                            outputThumbnailSize: []
                        }]
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await Promise.all(req.body.contentList.map(_job => {
                        return fs.fileSystem.checkPath(path.join(
                            process.env.RESOURCE_BASE_PATH,
                            _job.filePath))
                    }))

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
        },
        face: {
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
                        },
                        fileName: {
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
                        req.body.filePath,
                        req.body.fileName))

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
        },
        text: {
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
                        },
                        fileName: {
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
                        req.body.filePath,
                        req.body.fileName))

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
        },
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
