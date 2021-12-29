'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    util = require('@amuzlab/utils'),
    path = require('path'),
    axios = require('axios').default,
    WorkerMessage = require('../../../modules/vas/message')

Object.defineProperties(
    exports,
    {
        shotBoundaryDetection: {
            value: async (req, res, next) => {
                try {
                    let _path = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path
                    )
                    let _metadata = await fs.readFile(_path)
                    let _jobReport = JSON.parse(_metadata.data).jobReport

                    if (Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) {
                        _jobReport.result.outputPath = path.dirname(req.query.path)
                        _jobReport.result.outputMetaFileName = path.basename(req.query.path)
                        let message = WorkerMessage.getResultMessage(
                            _jobReport.command.id,
                            _jobReport.result)
                        message.state = 'SUCCESS'

                        await axios({
                            method: 'post',
                            url: `http://${process.env.SERVICE_SERVER_HOST}:${process.env.SERVICE_SERVER_PORT}${config.vams.nms.url["ShotBoundaryDetection"]}`,
                            data: message,
                            timeout: 10000
                        })
                        logger.info(`[RESULT] ${JSON.stringify(message, null, 4)}`)
                    } else {
                        throw _jobReport.error
                    }
                    res.sendStatus(200)
                } catch (err) {
                    logger.error(JSON.stringify(err))
                    res.send(JSON.stringify(err))
                }
            }
        },
        faceDetection: {
            value: async (req, res, next) => {
                try {
                    let _path = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path
                    )

                    let _metadata = await fs.readFile(_path)
                    let _jobReport = JSON.parse(_metadata.data).jobReport

                    if (Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) {
                        _jobReport.result.outputPath = path.dirname(req.query.path)
                        _jobReport.result.outputMetaFileName = path.basename(req.query.path)
                        let message = WorkerMessage.getResultMessage(
                            _jobReport.command.id,
                            _jobReport.result)
                        message.state = 'SUCCESS'

                        await axios({
                            method: 'post',
                            url: `http://${process.env.SERVICE_SERVER_HOST}:${process.env.SERVICE_SERVER_PORT}${config.vams.nms.url["FaceDetection"]}`,
                            data: message,
                            timeout: 10000
                        })
                        logger.info(`[RESULT] ${JSON.stringify(message, null, 4)}`)

                    } else {
                        throw _jobReport.error
                    }
                    res.sendStatus(200)
                } catch (err) {
                    logger.error(JSON.stringify(err))
                    res.send(JSON.stringify(err))
                }
            }
        },
        faceRecognition: {
            value: async (req, res, next) => {
                try {
                    let _path = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path
                    )

                    let _metadata = await fs.readFile(_path)
                    let _jobReport = JSON.parse(_metadata.data).jobReport

                    if (Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) {
                        let message = WorkerMessage.getResultMessage(
                            _jobReport.command.id,
                            _jobReport.result)
                        message.state = 'SUCCESS'

                        await axios({
                            method: 'post',
                            url: `http://${process.env.SERVICE_SERVER_HOST}:${process.env.SERVICE_SERVER_PORT}${config.vams.nms.url["FaceRecognition"]}`,
                            data: message,
                            timeout: 10000
                        })
                        logger.info(`[RESULT] ${JSON.stringify(message, null, 4)}`)

                    } else {
                        throw _jobReport.error
                    }
                    res.sendStatus(200)
                } catch (err) {
                    logger.error(JSON.stringify(err))
                    res.send(JSON.stringify(err))
                }
            }
        },
        faceRecognitionDatasets: {
            value: async (req, res, next) => {
                try {
                    let _recognitionPath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path,
                        "FaceRecognition/FaceRecognition.json"
                    )

                    let _answerPath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path,
                        process.env.DATASETS_PATH_FACERECOGNITION,
                        "FaceRecognition.json"
                    )

                    let _metadata = await fs.readFile(_recognitionPath)
                    let _answerdata = await fs.readFile(_answerPath)
                    let _jobReport = JSON.parse(_metadata.data).jobReport

                    let _recognition = _jobReport.result
                    _recognition.map(_shot => {
                        _shot.faceDetection.map(_detection => {
                            _detection.personId = -1
                            _detection.groupId = 1
                            _detection.distance = "2.0"
                        })
                    })

                    let _answer = JSON.parse(_answerdata.data).detection

                    _answer.map(_answerShot => {
                        let shot = _recognition.find(_recognitionShot => Number(_answerShot.index) == _recognitionShot.index)

                        _answerShot.faceDetection.map(_answerDetection => {
                            let _matchingShot = shot.faceDetection.find(_recognitionDetection =>
                                _recognitionDetection.position.x1 === _answerDetection.position.x1 &&
                                _recognitionDetection.position.y1 === _answerDetection.position.y1 &&
                                _recognitionDetection.position.x2 === _answerDetection.position.x2 &&
                                _recognitionDetection.position.y2 === _answerDetection.position.y2
                            )

                            _matchingShot.distance = "0.0"
                            _matchingShot.personId = _answerDetection.personId
                        })
                    })

                    let message = WorkerMessage.getResultMessage(
                        _jobReport.command.id,
                        _recognition)
                    message.state = 'SUCCESS'

                    await axios({
                        method: 'post',
                        url: `http://${process.env.SERVICE_SERVER_HOST}:${process.env.SERVICE_SERVER_PORT}${config.vams.nms.url["FaceRecognition"]}`,
                        data: message,
                        timeout: 10000
                    })

                    logger.info(`[RESULT] ${JSON.stringify(message, null, 4)}`)

                    res.sendStatus(200)
                } catch (err) {
                    logger.error(JSON.stringify(err))
                    res.send(JSON.stringify(err))
                }
            }
        },
        faceRecognitionAccuracy: {
            value: async (req, res, next) => {
                try {

                    let _detectionFilePath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path,
                        "FaceDetection/FaceDetection.json"),
                        _metadataFilePath = path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.query.path,
                            "FaceRecognition/FaceRecognition.json"),
                        _markingFilePath = path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.query.path,
                            process.env.DATASETS_PATH_FACERECOGNITION,
                            "FaceRecognition.json"),
                        _personListFilePath = path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.query.path,
                            process.env.DATASETS_PATH_FACERECOGNITION,
                            "FaceRecognition.txt"),
                        _response = {
                            metadataFilePath: _metadataFilePath,
                            markingFilePath: _markingFilePath,
                            detectionCnt: 0,
                            recognitionCnt: 0,
                            averageRecognitionRate: 0,
                            averageTrueRecognitionRate: 0,                            
                            perAccuracy: []
                        },
                        _detection = JSON.parse((await fs.readFile(_detectionFilePath)).data).jobReport.result
                            .filter(_shot => _shot.faceDetection.length != 0),                        
                        _marking = JSON.parse((await fs.readFile(_markingFilePath)).data).detection,
                        _recognition
                    
                    if(req.body.hasOwnProperty('recognition')){
                        _recognition = req.body.recognition
                            .map(_shot => {
                                _shot.faceDetection = _shot.faceDetection.filter(_position => _position.personId != -1)
                                return _shot
                            })
                            .filter(_shot => _shot.faceDetection.length != 0)
                    }else {
                        _recognition = JSON.parse((await fs.readFile(_metadataFilePath)).data).jobReport.result
                            .map(_shot => {
                                _shot.faceDetection = _shot.faceDetection.filter(_position => _position.personId != -1)
                                return _shot
                            })
                            .filter(_shot => _shot.faceDetection.length != 0)
                    }
                        

                    _response.perAccuracy = ((await fs.readFile(_personListFilePath, 'utf-8')).data.toString()
                        .split('\n'))
                        .filter(_person => _person != "")
                        .map(_person => {
                            return {
                                id: Number(_person.split(',')[0]),
                                name: _person.split(',')[1],
                                markCnt: 0,
                                recognitionCnt: 0,
                                truePositive: 0,
                                falseNagative: 0,
                                falsePositive: 0
                            }
                        })

                    _detection.map(_shot => _response.detectionCnt += _shot.faceDetection.length)       //검출 개수
                    _recognition.map(_shot => _response.recognitionCnt += _shot.faceDetection.length)   //인식 개수
                    
                    //TruePositive / falseNagative 
                    _response.perAccuracy.map(_person => {
                        let _markList = util.clone(_marking).map(_shot => {
                            _shot.faceDetection = _shot.faceDetection.filter(_position => _position.personId == _person.id)
                            return _shot
                        }).filter(_shot => _shot.faceDetection.length != 0)

                        let _recognitionList = util.clone(_recognition).map(_shot => {
                            _shot.faceDetection = _shot.faceDetection.filter(_position => _position.personId == _person.id)
                            return _shot
                        }).filter(_shot => _shot.faceDetection.length != 0)

                        _markList.map(_shot => _person.markCnt += _shot.faceDetection.length)
                        _recognitionList.map(_shot => _person.recognitionCnt += _shot.faceDetection.length)
                                                
                        //TruePositive / falseNagative
                        _markList.map(_mShot => {
                            let _shot = _recognitionList.find(_rShot => _rShot.index == Number(_mShot.index))
                            if (_shot) {
                                _mShot.faceDetection.map(_mDetection => {
                                    _shot.faceDetection.find(_rDetection => _mDetection.position.x1 == _rDetection.position.x1 &&
                                        _mDetection.position.x2 == _rDetection.position.x2 &&
                                        _mDetection.position.y1 == _rDetection.position.y1 &&
                                        _mDetection.position.y2 == _rDetection.position.y2)
                                        ? _person.truePositive += 1 : _person.falseNagative += 1
                                })
                            } else {
                                _person.falseNagative += _mShot.faceDetection.length
                            }
                        })

                        //FalsePositive
                        _recognitionList.map(_rShot => {
                            let _shot = _markList.find(_mShot => Number(_mShot.index) == _rShot.index)
                            if (_shot) {
                                _rShot.faceDetection.map(_rDetection => {
                                    _shot.faceDetection.find(_mDetection => _rDetection.position.x1 == _mDetection.position.x1 &&
                                        _rDetection.position.x2 == _mDetection.position.x2 &&
                                        _rDetection.position.y1 == _mDetection.position.y1 &&
                                        _rDetection.position.y2 == _mDetection.position.y2)
                                        ? null : _person.falsePositive += 1
                                })
                            } else {
                                _person.falsePositive += _rShot.faceDetection.length
                            }
                        })

                        _person.recognitionRate = Number(((_person.recognitionCnt / _person.markCnt) * 100).toFixed(2))
                        _person.trueRecognitionRate = Number((( _person.truePositive / _person.markCnt) * 100).toFixed(2))
                        _person.misRecognitionRate = Number((( _person.falseNagative / _person.markCnt) * 100).toFixed(2))
                        _person.falseAcceptanceRate = Number((( _person.falsePositive / _person.markCnt) * 100).toFixed(2))
                        _person.precision = (_person.truePositive == 0) && (_person.falsePositive == 0) ? 0 : Number((_person.truePositive / (_person.truePositive + _person.falsePositive)).toFixed(2))
                        _person.recall = (_person.truePositive == 0) && (_person.falsePositive == 0) ? 0 : Number((_person.truePositive / (_person.truePositive + _person.falseNagative)).toFixed(2))
                        
                        _response.averageTrueRecognitionRate += _person.trueRecognitionRate
                        _response.averageRecognitionRate += _person.recognitionRate
                    })
                    
                    _response.averageRecognitionRate = Number(((_response.averageRecognitionRate / _response.perAccuracy.length)).toFixed(2))
                    _response.averageTrueRecognitionRate = Number(((_response.averageTrueRecognitionRate / _response.perAccuracy.length)).toFixed(2))

                    res.status(200).json(_response)
                } catch (err) {
                    logger.error(JSON.stringify(err))
                    res.send(JSON.stringify(err))
                }
            }
        }
    }
)