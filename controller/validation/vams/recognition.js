'use strict'

const logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    schema = require('validate'),
    utils = require('@amuzlab/utils'),
    path = require('path'),
    axios = require('axios').default


Object.defineProperties(
    exports,
    {
        face: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        id: {
                            type: Number,
                            required: true
                        },
                        recognitionInfo: [
                            {
                                "personId": {
                                    type: Number,
                                    required: true
                                },
                                "imageInfo": [
                                    {
                                        "filePath": {
                                            type: String,
                                            required: true
                                        },
                                        "position": {
                                            "x1": {
                                                type: Number
                                            },
                                            "y1": {
                                                type: Number
                                            },
                                            "x2": {
                                                type: Number
                                            },
                                            "y2": {
                                                type: Number
                                            }
                                        }
                                    }
                                ]
                            }
                        ],
                        targetFilePath: {
                            type: String,
                            required: true
                        },
                        firstFlag: {
                            type: Boolean
                        }
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    // target file 확인
                    await fs.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.targetFilePath,
                        'FaceDetection/FaceDetection.json'
                    ))

                    // 인식 데이터 확인
                    await Promise.all(req.body.recognitionInfo.map(async _person => {
                        await Promise.all(_person.imageInfo.map(async _imageInfo => {
                            if (_imageInfo.filePath.includes('http')) {
                                await axios({
                                    method: 'GET',
                                    url: _imageInfo.filePath,
                                    responseType: 'stream'
                                })
                            } else {
                                await fs.checkPath(path.join(
                                    process.env.RESOURCE_BASE_PATH,
                                    _imageInfo.filePath))
                            }
                        }))
                    }))

                    res.sendStatus(201)
                    next()

                } catch (err) {
                    res.statusCode = 400
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.send(err.map(_err => _err.message))
                    } else if (err.response != undefined) {
                        logger.error(`${err.response.status} ${err.response.config.url}`)
                        res.send({
                            code: err.response.status,
                            message: err.response.config.url
                        })
                    } else {
                        logger.error(JSON.stringify(err))
                        res.send(err)
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
                        },
                        metaFilePath: {
                            type: String,
                            required: true
                        }
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await fs.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath,
                        req.body.fileName))

                    await fs.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.metaFilePath))

                    res.sendStatus(201)
                    next()

                } catch (err) {
                    res.statusCode = 400
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.send(err.map(_err => _err.message))
                    } else if (err.hasOwnProperty('config')) {
                        logger.error(`${err.response.status} ${err.response.config.url}`)
                        res.send({
                            code: err.response.status,
                            message: err.response.config.url
                        })
                    } else {
                        logger.error(JSON.stringify(err))
                        res.send(err)
                    }
                }
            }
        },
        speech: {
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
                        metaFilePath: {
                            type: String,
                            required: true
                        }
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await fs.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath))

                    await fs.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.metaFilePath))

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
        speechUpdate: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        filePath: {
                            type: String,
                            required: true
                        },
                        shotList: [
                            {
                                index: {
                                    "type": Number,
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
                            }
                        ]
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await fs.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath))

                    req.body.filePath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        path.dirname(req.body.filePath).split('/content')[0], 'recognition/speechRecognition/speechRecognition.json')

                    await fs.checkPath(req.body.filePath)

                    res.sendStatus(201)
                    next()

                } catch (err) {
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.status(400).json(err.map(_err => _err.message))
                    } else {
                        logger.error(JSON.stringify(err))
                        res.status(204).json(err)
                    }
                }
            }
        }
    }
)