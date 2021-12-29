'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    worker = require('@amuzlab/worker'),
    utils = require('@amuzlab/utils'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    axios = require('axios').default,
    path = require('path'),
    vams = require('./')

Object.defineProperties(
    exports,
    {
        face: {
            value: async (req, res, next) => {
                let _serviceType = 'FaceRecognition'
                try {
                    // 웹 이미지일 경우 다운로드
                    await Promise.all(req.body.recognitionInfo.map(async _person => {
                        await Promise.all(_person.imageInfo.map(async _imageInfo => {
                            if (_imageInfo.filePath.includes('http')) {
                                let _downloadPath = path.join(
                                    req.body.targetFilePath,
                                    _serviceType,
                                    'person',
                                    String(_person.personId)
                                )

                                await fs.mkdir(path.join(
                                    process.env.RESOURCE_BASE_PATH,
                                    _downloadPath
                                ))
                            }
                        }))
                    }))
                    //웹 이미지 다운로드 경로로 파일 경로 수정
                    await Promise.all(req.body.recognitionInfo.map(async _person => {
                        await Promise.all(_person.imageInfo.map(async _imageInfo => {
                            if (_imageInfo.filePath.includes('http')) {
                                let _downloadPath = path.join(
                                    req.body.targetFilePath,
                                    _serviceType,
                                    'person',
                                    String(_person.personId)
                                ),
                                    _writer = fs.fs.createWriteStream(path.join(
                                        process.env.RESOURCE_BASE_PATH,
                                        _downloadPath,
                                        path.basename(_imageInfo.filePath)
                                    )),
                                    _response

                                _response = await axios({
                                    method: 'GET',
                                    url: _imageInfo.filePath,
                                    responseType: 'stream'
                                })

                                _response.data.pipe(_writer)

                                _imageInfo.filePath = path.join(
                                    _downloadPath,
                                    path.basename(_imageInfo.filePath)
                                )
                                logger.debug(`Downloaded images for face recognition : ${_person.personId} - ${path.join(
                                    process.env.RESOURCE_BASE_PATH,
                                    _downloadPath,
                                    path.basename(_imageInfo.filePath)
                                )}`)
                            }
                        }))
                    }))

                    // 얼굴 메타 파일 저장
                    let _metaFilePath = path.format({
                        dir: path.join(
                            process.env.RESOURCE_BASE_PATH,
                            req.body.targetFilePath,
                            _serviceType),
                        name: 'face',
                        ext: '.json'
                    })
                    fs.writeFile(_metaFilePath, JSON.stringify(req.body.recognitionInfo, null, 4), 'utf-8')
                    req.body.metaFilePath = _metaFilePath


                    let job = new worker.Job()
                    job.serviceType = _serviceType
                    job.host = process.env.SERVICE_SERVER_HOST ? process.env.SERVICE_SERVER_HOST : req.headers['x-forwarded-for'] || req.connection.remoteAddress
                    job.args = utils.clone(req.body)

                    vams.GpuContainer.exec(job)

                    fs.writeFile(path.format({
                        dir: process.env.JOB_FILE_PATH,
                        name: '.' + job.id,
                        ext: '.json'
                    }), JSON.stringify(Object.assign(utils.clone(job.args), {
                        serviceType: job.serviceType,
                        host: job.host
                    }), null, 4), 'utf-8')

                } catch (err) {
                    logger.error(err)
                }
            }
        },
        text: {
            value: async (req, res, next) => {
                try {
                    let job = new worker.Job()
                    job.serviceType = 'TextRecognition'
                    job.host = process.env.SERVICE_SERVER_HOST ? process.env.SERVICE_SERVER_HOST : req.headers['x-forwarded-for'] || req.connection.remoteAddress
                    job.args = utils.clone(req.body)

                    vams.GpuContainer.exec(job)

                    fs.writeFile(path.format({
                        dir: process.env.JOB_FILE_PATH,
                        name: '.' + job.id,
                        ext: '.json'
                    }), JSON.stringify(Object.assign(utils.clone(job.args), {
                        serviceType: job.serviceType,
                        host: job.host
                    }), null, 4), 'utf-8')
                } catch (err) {
                    logger.error(err)
                }
            }
        },
        speech: {
            value: (req, res, next) => {
                try {
                    let job = new worker.Job()
                    job.serviceType = 'SpeechRecognition'
                    job.host = process.env.SERVICE_SERVER_HOST ? process.env.SERVICE_SERVER_HOST : req.headers['x-forwarded-for'] || req.connection.remoteAddress
                    job.args = utils.clone(req.body)

                    vams.CpuContainer.exec(job)

                    fs.writeFile(path.format({
                        dir: process.env.JOB_FILE_PATH,
                        name: '.' + job.id,
                        ext: '.json'
                    }), JSON.stringify(Object.assign(utils.clone(job.args), {
                        serviceType: job.serviceType,
                        host: job.host
                    }), null, 4), 'utf-8')
                } catch (err) {
                    logger.error(err)
                }
            }
        },
        speechUpdate: {
            value: async (req, res, next) => {
                try {
                    let _speechRecognitionData = JSON.parse((await fs.readFile(req.body.filePath)).data)
                    let _recognitionJSONPath = path.join(process.env.RESOURCE_BASE_PATH, _speechRecognitionData.jobReport.result.recognitionFilePath)
                    let _recognitionVTTPath = path.join(process.env.RESOURCE_BASE_PATH, _speechRecognitionData.jobReport.result.vttFilePath)


                    let _recognitionJSON = JSON.parse((await fs.readFile(_recognitionJSONPath)).data)
                    let _recognitionVTT = (await fs.readFile(_recognitionVTTPath, 'utf-8')).data

                    // JSON 파일 덮어쓰기
                    req.body.shotList.map(_shot => {
                        _recognitionJSON[_recognitionJSON.findIndex(_s => _s.index == _shot.index)] = _shot
                    })
                    fs.writeFile(_recognitionJSONPath, JSON.stringify(_recognitionJSON, null, 4), 'utf-8')
                    logger.info(`The ${_recognitionJSONPath} metafile has been modified.`)

                    // VTT 파일 덮어쓰기


                } catch (err) {
                    logger.error(err)
                }
            }
        }
    }
)