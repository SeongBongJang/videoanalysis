'use strict'

const logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise'),
    schema = require('validate'),
    utils = require('@amuzlab/utils'),
    path = require('path')


Object.defineProperties(
    exports,
    {
        shotClustering: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema(
                        {
                            filePath: {
                                type: String,
                                required: true
                            },
                            metaFilePath: {
                                type: String,
                                required: true
                            },
                            sectionData: {
                                type: Array,
                                required: true
                            }
                        }
                    )

                    let _validateResult = _schema.validate(utils.clone(req.body[0]))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await Promise.all(req.body.map(async _job => {
                        // await fs.fileSystem.checkPath(path.join(
                        //     process.env.RESOURCE_BASE_PATH,
                        //     _job.filePath))
                        await fs.fileSystem.checkPath(path.join(
                            process.env.RESOURCE_BASE_PATH,
                            _job.metaFilePath))
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
        faceRecognition: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema(
                        {
                            filePath: {
                                type: String,
                                required: true
                            },
                            detection: [
                                {
                                    fileName: {
                                        type: String,
                                        required: true
                                    },
                                    faceDetection: [
                                        {
                                            personId: {
                                                type: Number
                                            },
                                            position: {
                                                x1: {
                                                    type: Number
                                                },
                                                y1: {
                                                    type: Number
                                                },
                                                x2: {
                                                    type: Number
                                                },
                                                y2: {
                                                    type: Number
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    )

                    let _validateResult = _schema.validate(utils.clone(req.body))
                    
                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await fs.fileSystem.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath,
                        'FaceDetection/FaceDetection.json'))

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
        textRecognition: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        filePath: {
                            type: String,
                            required: true
                        },
                        textRecognition: [
                            {
                                label: {
                                    type: String,
                                    required: true
                                },
                                position: {
                                    required: true,
                                    x1: {
                                        type: Number,
                                        required: true
                                    },
                                    y1: {
                                        type: Number,
                                        required: true
                                    },
                                    x2: {
                                        type: Number,
                                        required: true
                                    },
                                    y2: {
                                        type: Number,
                                        required: true
                                    }
                                }
                            }
                        ]
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
        },
        speechRecognition: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        filePath: {
                            type: String,
                            required: true
                        },
                        speechRecognition: {
                            type: Array,
                            required: true
                        },
                        speechRecognition: [
                            {
                                speech: {
                                    type: String,
                                    required: true
                                },
                                frontTime: {
                                    type: String,
                                    required: true
                                },
                                rearTime: {
                                    type: String,
                                    required: true
                                }
                            }
                        ]
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
