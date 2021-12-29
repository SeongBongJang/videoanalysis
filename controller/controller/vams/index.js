'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    worker = require('@amuzlab/worker'),
    date = require('@amuzlab/utils').date,
    utils = require('util'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    gpuLoadBalancer = require('@amuzlab/gpu-load-balancer'),
    nosu = require('node-os-utils'),
    CpuContainer = new worker.WorkerContainer({
        maxWorkerCount: async () => {
            try {
                let _memUsage = Number((100 - (await nosu.mem.info()).freeMemPercentage).toFixed(2)),
                    _memLimit = process.env.PERFORMANCE_MEM_LIMIT ? Number(process.env.PERFORMANCE_MEM_LIMIT) : 80

                let _memFlag = _memUsage < _memLimit,
                    _workerFlag = process.env.PERFORMANCE_CPU_WORKER_LIMIT ? CpuContainer.workers.length < Number(process.env.PERFORMANCE_CPU_WORKER_LIMIT) : true

                if (_memFlag && _workerFlag) {
                    return true
                } else {
                    return false
                }
            } catch (err) {
                return false
            }
        },
        autoGenerateJobId: true,
        scheduling: process.env.PERFORMANCE_CPU_WORKER_SCHEDULING ? Number(process.env.PERFORMANCE_CPU_WORKER_SCHEDULING) : 3000
    })
        .on('workerEnd', (job, worker, workerContainer) => {
            exports.removeFile(process.env.JOB_FILE_PATH, job.id)
        })
        .on('workerError', (err, job, worker, workerContainer) => {
            exports.removeFile(process.env.JOB_FILE_PATH, job.id)
        }),
    GpuContainer = new worker.WorkerContainer({
        maxWorkerCount: async () => {
            try {
                let _gpuProcessFlg = true, // gpu 사용가능 여부
                    _gpuProcessCnt = 0,     // gpu 사용 개수
                    _gpumemUsage = (await gpuLoadBalancer.getGPU('ROUND_ROBIN_MEM')), // 지정된 gpu의 현재 메모리 사용량
                    _memUsage = Number((100 - (await nosu.mem.info()).freeMemPercentage).toFixed(2)), // 현재 메모리 사용량
                    _gpumemLimit = process.env.PERFORMANCE_GPUMEM_LIMIT ? Number(process.env.PERFORMANCE_GPUMEM_LIMIT) : 80, // gpu 메모리 최대 허용량
                    _memLimit = process.env.PERFORMANCE_MEM_LIMIT ? Number(process.env.PERFORMANCE_MEM_LIMIT) : 80, // 메모리 최대 허용량
                    _transcodeLimit = process.env.PERFORMANCE_TRANSCODE_WORKER_LIMIT ? Number(process.env.PERFORMANCE_TRANSCODE_WORKER_LIMIT) : 2 // 트랜스코딩 동시 처리 허용 개수

                // host에 설치 된 서버로부터 gpu 사용량 조회
                if (process.env.SYSTEM_SERVER) {
                    try {
                        (await axios({
                            method: 'get',
                            url: `http://${process.env.SYSTEM_SERVER}:${process.env.SYSTEM_SERVER_PORT}${config.sys.server.gpu}`,
                            timeout: 10000
                        })).data.gpus.map(_gpu => _gpuProcessCnt += _gpu.processes.length)
                        _gpuProcessFlg = _gpuProcessCnt >= GpuContainer.workers.length ? true : false // 생성한 work의 개수가 실행중인 gpu process개수보다 작거나 같아야 한다. 
                    } catch (err) {
                        logger.debug(`Please checking system server : ${err}`)
                    }
                }

                let _gpuFlag = (_gpumemUsage.usage.memory.per < _gpumemLimit), // gpu 메모리 사용량이 허용량 아래인지 확인
                    _memFlag = _memUsage < _memLimit,   // 메모리 사용량이 허용량 아래인지 확인
                    _workerFlag = (process.env.PERFORMANCE_GPU_WORKER_LIMIT ? GpuContainer.workers.length < Number(process.env.PERFORMANCE_GPU_WORKER_LIMIT) : true) && _gpuProcessFlg, // gpu worker 제한이 있는 경우 현재 작업중인 gpu worker가 허용개수 아래인지 그리고 생성한 개수와 비교
                    _transcodingFlag = GpuContainer.workers.slice().filter(_worker => _worker.job.serviceType == "Transcoder").length < _transcodeLimit // 실행 중인 gpu worker 중에 transcoder 작업이 허용개수 아래인지

                let _gpuFlagMsg = `gpu : ${_gpumemUsage.deviceNo} -> ${_gpumemUsage.usage.memory.per}/${process.env.PERFORMANCE_GPUMEM_LIMIT}(${_gpuFlag})`,
                    _memFlagMsg = `mem : ${Number((100 - (await nosu.mem.info()).freeMemPercentage).toFixed(2))}/${process.env.PERFORMANCE_MEM_LIMIT}(${_memFlag})`,
                    _workerFlagMsg = `worker process : ${_gpuProcessCnt}/${GpuContainer.workers.length}(${_gpuProcessFlg})`,
                    _transcodingFlagMsg = `Transcoder : ${GpuContainer.workers.slice().filter(_worker => _worker.job.serviceType == "Transcoder").length}/${_transcodeLimit} (${_transcodingFlag})`
                                
                logger.debug(`\n${_gpuFlagMsg}\n${_memFlagMsg}\n${_workerFlagMsg}\n${_transcodingFlagMsg}`)                

                if (_gpuFlag && _memFlag && _workerFlag && GpuContainer.readyQueue.length > 0) {

                    if (GpuContainer.readyQueue[0].serviceType == 'Transcoder') {

                        if (!_transcodingFlag) {                            

                            let _anotherJobIndex = GpuContainer.readyQueue.findIndex(_job => _job.serviceType != 'Transcoder')

                            if (_anotherJobIndex != -1) {
                                GpuContainer.readyQueue.unshift(GpuContainer.readyQueue[_anotherJobIndex])
                                GpuContainer.readyQueue.splice(_anotherJobIndex + 1, 1)
                            } else {
                                throw `Transcoder : ${GpuContainer.workers.slice().filter(_worker => _worker.job.serviceType == "Transcoder").length}/${_transcodeLimit} (${_transcodingFlag})`
                            }

                        }   

                        return true

                    } else {                                                
                        return true
                    }
                } else {                                        
                    throw `GPU STATE:${_gpuFlag} MEM STATE:${_memFlag} READY:${GpuContainer.readyQueue.length} WORKING:${GpuContainer.workers.length}`
                }
            } catch (err) {
                logger.debug(`The next work is pending : ${err}`)
                return false
            }
        },
        autoGenerateJobId: true,
        scheduling: process.env.PERFORMANCE_GPU_WORKER_SCHEDULING ? Number(process.env.PERFORMANCE_GPU_WORKER_SCHEDULING) : 10000
    })
        .on('workerEnd', (job, worker, workerContainer) => {
            exports.removeFile(process.env.JOB_FILE_PATH, job.id)
        })
        .on('workerError', (err, job, worker, workerContainer) => {
            exports.removeFile(process.env.JOB_FILE_PATH, job.id)
        }),
    path = require('path'),
    axios = require('axios').default,
    PATH = path.join(__filename.split('controller')[0], 'modules/workers/vams')

worker.map = new Map([
    ['ShotBoundaryDetection', path.join(PATH, 'detection/ShotBoundaryDetection.js')],
    ['FeatureMatching', path.join(PATH, 'match/FeatureMatching.js')],
    ['PixelImageMatching', path.join(PATH, 'match/PixelImageMatching.js')],
    ['DeepFeatureTemporalMatching', path.join(PATH, 'match/DeepFeatureTemporalMatching.js')],
    ['FaceDetection', path.join(PATH, 'detection/FaceDetection.js')],
    ['TextDetection', path.join(PATH, 'detection/TextDetection.js')],
    ['FaceRecognition', path.join(PATH, 'recognition/FaceRecognition.js')],
    ['TextRecognition', path.join(PATH, 'recognition/TextRecognition.js')],
    ['SpeechRecognition', path.join(PATH, 'recognition/SpeechRecognition.js')],
    ['Trailer', path.join(PATH, 'Trailer.js')],
    ['SectionThumbnail', path.join(PATH, 'SectionThumbnail.js')],
    ['Transcoder', path.join(PATH, 'Transcoder.js')],
    ['ShotClustering', path.join(PATH, 'ShotClustering.js')],
    ['BroadcastRecord', path.join(PATH, 'BroadcastRecord.js')],
    ['DeepFeatureGenerator', path.join(PATH, 'generation/DeepFeatureGenerator.js')],
    ['Train', path.join(PATH, 'Train.js')]
])

Object.defineProperties(
    exports,
    {
        init: {
            value: async () => {
                try {
                    let _dir = await fs.readdir(process.env.JOB_FILE_PATH)
                    _dir.files.map(async _file => {
                        let _data = JSON.parse((await fs.readFile(path.join(process.env.JOB_FILE_PATH, _file))).data)
                        let job = new worker.Job()
                        job.serviceType = _data.serviceType
                        job.host = _data.host
                        job.args = _data

                        switch (_data.serviceType) {
                            case 'ShotBoundaryDetection':
                            case 'DeepFeatureGenerator':
                            case 'FeatureMatching':
                            case 'PixelImageMatching':
                            case 'DeepFeatureTemporalMatching':
                            case 'FaceDetection':
                            case 'TextDetection':
                            case 'FaceRecognition':
                            case 'TextRecognition':
                            case 'SpeechRecognition':
                            case 'Transcoder':
                            case 'ShotClustering':                            
                            case 'Train':
                                GpuContainer.exec(job)
                                break;
                            case 'SectionThumbnail':
                            case 'Trailer':
                            case 'BroadcastRecord':
                                CpuContainer.exec(job)
                            default:
                                break;
                        }
                    })
                } catch (err) {
                    logger.info(`job path initialized. (${err.filePath})`)
                }
            }
        },
        detection: {
            value: require('./detection')
        },
        match: {
            value: require('./match')
        },
        recognition: {
            value: require('./recognition')
        },
        trailer: {
            value: require('./trailer')
        },
        intervalThumbnail: {
            value: require('./intervalThumbnail')
        },
        transcoding: {
            value: require('./transcoding')
        },
        shotClustering: {
            value: require('./shotClustering')
        },
        broadcastRecord: {
            value: require('./broadcastRecord')
        },
        generation: {
            value: require('./generation')
        },
        datasets: {
            value: require('./datasets')
        },
        train: {
            value: require('./train')
        },
        metadata: {
            value: require('./metadata')
        },
        search: {
            value: (req, res, next) => {
                let _service = req.query.service,
                    _id = Number(req.query.id),
                    _inactivates = CpuContainer.readyQueue.slice().concat(GpuContainer.readyQueue.slice()),
                    _activates = CpuContainer.workers.slice().concat(GpuContainer.workers.slice())

                if (_service) {
                    _inactivates = _inactivates.filter(_awaiter => (_awaiter.serviceType == _service))
                    _activates = _activates.filter(_worker => (_worker.job.serviceType == _service))
                }

                if (_id) {
                    _inactivates = _inactivates.filter(_awaiter => (_awaiter.args.id == _id))
                    _activates = _activates.filter(_worker => (_worker.process.argv.id == _id))
                }

                res.send({
                    "inactivates": _inactivates.map(_awaiter => _awaiter.args),
                    "activates": _activates.map(_worker => {
                        _worker.process.poc.elapsedTime = new Date(
                            date.dateCompareTo(date.toFormat(), _worker.process.poc.loadTime)
                        ).toISOString().substr(11, 8)

                        return Object.assign(_worker.process.argv, _worker.process.poc)
                    })
                })
            }
        },
        stop: {
            value: (req, res, next) => {
                if (req.query.id) {
                    CpuContainer.cancel((job) => {
                        if (job.args.id == Number(req.query.id)) {
                            exports.removeFile(process.env.JOB_FILE_PATH, job.id)
                            return job
                        }
                    })
                    GpuContainer.cancel((job) => {
                        if (job.args.id == Number(req.query.id)) {
                            exports.removeFile(process.env.JOB_FILE_PATH, job.id)
                            return job
                        }
                    })
                } else {
                    CpuContainer.cancel(Symbol.for('amuzlab.worker.cancel.ALL'))
                    GpuContainer.cancel(Symbol.for('amuzlab.worker.cancel.ALL'))
                    exports.removeFile()
                }

                res.sendStatus(200)
            }
        },
        retransmission: {
            value: async (req, res, next) => {
                let _files = (await fs.readdir(process.env.MSG_FILE_PATH)).files

                _files.map(async _file => {
                    let _data = JSON.parse((await fs.readFile(path.join(process.env.MSG_FILE_PATH, _file), 'utf-8')).data)

                    try {
                        await axios({
                            method: 'post',
                            url: `http://${_data.host ? _data.host : process.env.SERVICE_SERVER_HOST}:${process.env.SERVICE_SERVER_PORT}${config.vams.nms.url[_data.serviceType]}`,
                            data: _data
                        })
                        exports.removeFile(process.env.MSG_FILE_PATH, path.basename(_file, path.extname(_file)).substring(1, _file.length))
                    } catch (err) {
                        logger.error(err, _data)
                    }
                })
                res.sendStatus(200)
            }
        },
        CpuContainer: {
            get: () => CpuContainer
        },
        GpuContainer: {
            get: () => GpuContainer
        },
        removeFile: {
            value: async (filePath, id) => {
                try {
                    if (id) {
                        await utils.promisify(fs.fs.unlinkSync)(path.format({
                            dir: filePath,
                            name: '.' + id,
                            ext: '.json'
                        }))
                    } else {
                        let _dir = await fs.readdir(process.env.JOB_FILE_PATH)

                        _dir.files.map(async _file => {
                            await fs.fs.unlinkSync(path.join(_dir.path, _file))
                        })
                    }
                } catch (err) {
                    logger.error('error : ', err)
                }
            }
        }
    }
)

process.env.LISENCE == 'VAMS' && this.init()