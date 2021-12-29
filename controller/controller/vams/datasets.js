'use strict'

const logger = require('@amuzlab/logger'),
    utils = require('@amuzlab/utils'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    path = require('path')

Object.defineProperties(
    exports,
    {
        shotClustering: {
            value: async (req, res, next) => {
                try {
                    let _filePath = path.format({
                        dir: process.env.DATASETS_PATH_SHOTCLUSTERING,
                        name: utils.date.toFormat('YYYY-MM-DD_HH24_MI'),
                        ext: '.json'
                    })
                    let _data = {
                        data: utils.clone(req.body)
                    }

                    await fs.writeFile(_filePath, JSON.stringify(_data, null, 4), 'utf-8')

                    logger.info(`[TRAIN] A metafile for learning 'shot clustering' has been created.`)

                } catch (err) {
                    console.error(err)
                }

            }
        },
        faceRecognition: {
            value: async (req, res, next) => {
                try {
                    // json파일은 파일 명만 바꿔서 저장
                    let _filePath = path.format({
                        dir: path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.body.filePath,
                            process.env.DATASETS_PATH_FACERECOGNITION),
                        name: 'FaceRecognition',
                        ext: '.json'
                    })

                    req.body.detection.map(_detection => {
                        _detection.fileName = path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.body.filePath,
                            'ShotBoundaryDetection',
                            _detection.fileName)
                    })

                    await fs.writeFile(_filePath, JSON.stringify(utils.clone(req.body), null, 4), 'utf-8')

                    logger.info(`[TRAIN] A metafile for learning '${_filePath}' has been created.`)

                    //txt파일은 personId와 personName을 key,value로 저장
                    _filePath = path.format({
                        dir: path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.body.filePath,
                            process.env.DATASETS_PATH_FACERECOGNITION),
                        name: 'FaceRecognition',
                        ext: '.txt'
                    })

                    let _data = new Map(), _writeFormat = ""

                    req.body.detection.map(_file => {
                        _file.faceDetection.map(_faceDetection => {
                            if (_faceDetection.personId) {
                                _data.set(_faceDetection.personId, _faceDetection.personName)
                            }
                        })

                    })

                    for (const item of _data) {
                        _writeFormat += `${item[0]},${item[1]}\n`
                    }

                    await fs.writeFile(_filePath, _writeFormat, 'utf-8')

                    logger.info(`[TRAIN] A metafile for learning '${_filePath}' has been created.`)
                } catch (err) {
                    console.error(err)
                }

            }
        },
        textRecognition: {
            value: async (req, res, next) => {
                try {
                    let _filePath = path.format({
                        dir: path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.body.filePath.split('ShotBoundaryDetection')[0],
                            process.env.DATASETS_PATH_TEXTRECOGNITION),
                        name: path.basename(req.body.filePath, path.extname(req.body.filePath)),
                        ext: '.json' 
                    })  

                    await fs.writeFile(_filePath, JSON.stringify(utils.clone(req.body), null, 4), 'utf-8')

                    logger.info(`[TRAIN] A metafile for learning '${_filePath}' has been created.`)

                } catch (err) {
                    console.error(err)
                }

            }
        },
        speechRecognition: {
            value: async (req, res, next) => {
                try {
                    let _filePath = path.format({
                        dir: path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.body.filePath.split('content')[0],
                            process.env.DATASETS_PATH_SPEECHRECOGNITION),
                        name: utils.date.toFormat('YYYY-MM-DD_HH24_MI'),
                        ext: '.json'
                    })

                    await fs.writeFile(_filePath, JSON.stringify(utils.clone(req.body), null, 4), 'utf-8')

                    logger.info(`[TRAIN] A metafile for learning '${_filePath}' has been created.`)

                } catch (err) {
                    console.error(err)
                }

            }
        }
    }
)