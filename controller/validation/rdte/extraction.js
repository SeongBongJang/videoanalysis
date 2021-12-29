'use strict'

const logger = require('@amuzlab/logger'),
    schema = require('validate'),
    utils = require('@amuzlab/utils')

Object.defineProperties(
    exports,
    {
        shot: {
            value: async (req, res, next) => {
                try {
                    let _schema = new schema({
                        serverId: {
                            type: Number,
                            required: true
                        },
                        sState: {
                            type: String,
                            required: true
                        },
                        jobList: [
                            {
                                id: {
                                    type: Number,
                                    required: true
                                },
                                channelInfo: {
                                    channelId: {
                                        type: Number,
                                        required: true
                                    },
                                    svcId: {
                                        type: String,
                                        required: true
                                    },
                                    name: {
                                        type: String,
                                        required: true
                                    },
                                    mip: {
                                        type: String,
                                        required: true
                                    },
                                    overrunNonfatal: {
                                        type: String,
                                        required: false
                                    },
                                    fifoSize: {
                                        type: String,
                                        required: false
                                    }
                                },
                                ftpList: [
                                    {
                                        ftpId: {
                                            type: Number,
                                            required: true
                                        },
                                        name: {
                                            type: String,
                                            required: true
                                        },
                                        host: {
                                            type: String,
                                            required: true
                                        },
                                        port: {
                                            type: Number,
                                            required: true
                                        },
                                        user: {
                                            type: String,
                                            required: true
                                        },
                                        password: {
                                            type: String,
                                            required: true
                                        }
                                    }
                                ],
                                reportList: [
                                    {
                                        reportId: {
                                            type: Number,
                                            required: true
                                        },
                                        name: {
                                            type: String,
                                            required: true
                                        },
                                        host: {
                                            type: String,
                                            required: true
                                        },
                                        port: {
                                            type: Number,
                                            required: true
                                        },
                                        url: {
                                            type: String,
                                            required: true
                                        },
                                        timeout: {
                                            type: Number,
                                            required: true
                                        }
                                    }
                                ],
                                optionInfo: {
                                    thumbnailWidth: {
                                        type: Number,
                                        required: true
                                    },
                                    thumbnailHeight: {
                                        type: Number,
                                        required: true
                                    },
                                    period: {
                                        type: Number,
                                        required: true
                                    },
                                    outputFileLimit: {
                                        type: Number,
                                        required: false
                                    }
                                }
                            }
                        ]
                    })

                    let _validateResult = _schema.validate(utils.clone(req.body))

                    if (_validateResult.length > 0) {
                        throw _validateResult
                    }

                    res.sendStatus(201)
                    next()

                } catch (err) {
                    logger.error(err.map(_err => _err.message))
                    res.status(400).json(err.map(_err => _err.message))
                }
            }
        }
    }
)