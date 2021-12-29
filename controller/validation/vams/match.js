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
                        id: {
                            type: Number,
                            required: true
                        },
                        queryList: [{
                            confId: {
                                type: Number,
                                required: true
                            },
                            index: {
                                type: Number,
                                required: true
                            },
                            filePath: {
                                type: String,
                                required: true
                            },
                            position: {
                                type: Object,
                                required: false
                            }
                        }],
                        compareId: {
                            type: Number,
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

                    await Promise.all(req.body.queryList.map(async _query => {
                        await fs.fileSystem.checkPath(path.join(
                            process.env.RESOURCE_BASE_PATH,
                            _query.filePath))
                    }))

                    await fs.fileSystem.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.metaFilePath
                    ))

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
        deepFeatureTemporalMatching: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        id: {
                            type: Number,
                            required: true
                        },
                        queryFeatureMetaFilePath: {
                            type: String,
                            required: true
                        },
                        targetFeatureMetaFilePath: {
                            type: String,
                            required: true
                        },                        
                        queryStartTimeStamp: {
                            type: String,
                            required: true
                        },
                        queryEndTimeStamp: {
                            type: String,
                            required: true
                        },
                        querySegmentProfile: {
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
                        req.body.queryFeatureMetaFilePath))

                    await fs.fileSystem.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.targetFeatureMetaFilePath))

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
        pixel: {
            value: async (req, res, next) => {                
                try {                    
                    let _schema = new schema({
                        id: {
                            type: Number,
                            required: true
                        },
                        queryList: [{
                            confId: {
                                type: Number,
                                required: true
                            },
                            index: {
                                type: Number,
                                required: true
                            },
                            filePath: {
                                type: String,
                                required: true
                            },
                            position: {
                                type: Object,
                                required: false
                            }
                        }],
                        compareId: {
                            type: Number,
                            required: true
                        },
                        filePath: { // 실제로는 metafile이 아닌 영상 파일 경로
                            type: String,
                            required: true
                        }
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    await Promise.all(req.body.queryList.map(async _query => {
                        await fs.fileSystem.checkPath(path.join(
                            process.env.RESOURCE_BASE_PATH,
                            _query.filePath))
                    }))

                    await fs.fileSystem.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath
                    ))

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