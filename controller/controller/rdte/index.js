'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    worker = require('@amuzlab/worker'),
    utils = require('util'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    fse = require('fs-extra'),
    sysinfo = require('@amuzlab/sys-info'),
    nosu = require('node-os-utils'),
    GpuContainer = new worker.WorkerContainer({
        maxWorkerCount: async () => {
            try {
                let _gpuUsage = (await sysinfo.gpu.getGPU('MEMORY_USAGE')).usage.memory.per
                let _memUsage = Number(100 - (await nosu.mem.info()).freeMemPercentage).toFixed(2)
                let _gpuLimit = 80, _memLimit = 80, maxWorkerCount = 4

                if (_gpuUsage < _gpuLimit && _memUsage < _memLimit && GpuContainer.workers.length < maxWorkerCount) {
                    return true
                } else {
                    return false
                }
            } catch (err) {
                return false
            }
        },
        autoGenerateJobId: true,
        scheduling: 5000
    })
        .on('workerEnd', (job, worker, workerContainer) => {
            exports.removeFile(config.db.jobDir, job.id)
        }),        
    path = require('path'),
    axios = require('axios').default,
    PATH = path.join(__filename.split('controller')[0], 'modules/workers/rdte')

worker.map = new Map([
    ['shotExtract', path.join(PATH, 'shotExtract.js')],
])

Object.defineProperties(
    exports,
    {
        init: {
            value: async () => {
                try {
                    config.server.configPath = path.join(__dirname, '../../../conf/server.json')
                    fs.writeFile(config.server.configPath, JSON.stringify(config.server, null, 4))

                    if (config.rdte.nms.hasOwnProperty('host')) { //host 정보가 있는 경우                        
                        let _response = await axios.get(`http://${config.rdte.nms.host}:${config.rdte.nms.port}${config.rdte.nms.url.shotExtract.jobs}/${config.server.port}`)
                        exports.removeFile() //기존 작업 삭제                            
                        if (_response.data.jobList.length != 0) { //데이터 시작                                                        
                            this.extraction.shot({ body: _response.data })
                        }
                    } else {                        
                        throw null
                    }
                }
                catch (err) {
                    if (err == null) {
                        if (fs.fs.existsSync(config.db.jobDir) && config.server.serverId) { // host 정보가 없으면서, 이미 할 당 된 서버 id가 있는 경우                            
                            let _localJobs = await fs.readdir(config.db.jobDir)
                            _localJobs.files.map(async _file => {
                                let _data = await fs.readFile(path.join(_localJobs.path, _file))
                                this.extraction.shot({
                                    body: JSON.parse(_data.data)
                                })
                                exports.removeFile(config.db.jobDir, _file.split('.')[1])
                            })
                        }
                    } else {
                        logger.error(err)
                    }
                }
            }
        },
        extraction: {
            value: require('./extraction')
        },
        failover: {
            value: (req, res, next) => {
                config.server.state = req.params.state
                res.sendStatus(200)
            }
        },
        search: {
            value: (req, res, next) => {
                let _id = Number(req.params.id),
                    _inactivates = GpuContainer.readyQueue.slice(),
                    _activates = GpuContainer.workers.slice()

                if (_id) {
                    _inactivates = _inactivates.filter(_awaiter => (_awaiter.args.id == _id))
                    _activates = _activates.filter(_worker => (_worker.process.argv.id == _id))
                }

                res.send({
                    "serverState": config.server.state,
                    "inactivates": _inactivates.map(_awaiter => _awaiter.args),
                    "activates": _activates.map(_worker => Object.assign(
                        _worker.process.argv,
                        {
                            errors: _worker.errors
                        }
                    ))
                })
            }
        },
        stop: {
            value: (req, res, next) => {
                if (req.params.id == undefined) {
                    GpuContainer.cancel(Symbol.for('amuzlab.worker.cancel.ALL'))
                    exports.removeFile()
                } else {
                    GpuContainer.cancel((job) => {
                        if (job.args.id == Number(req.params.id)) {
                            exports.removeFile(config.db.jobDir, job.id)
                            return job
                        }
                    })
                }

                res.sendStatus(200)
            }
        },
        retransmission: {
            value: async (req, res, next) => {
                let _files = (await fs.readdir(config.db.messageDir)).files

                _files.map(async _file => {
                    let _data = JSON.parse((await fs.readFile(path.join(config.db.messageDir, _file), 'utf-8')).data)

                    try {
                        await axios({
                            method: 'post',
                            url: `http://${_data.host ? _data.host : config.rdte.nms.host}:${config.rdte.nms.port}${config.rdte.nms.url[_data.serviceType].report}`,
                            data: _data
                        })
                        exports.removeFile(config.db.messageDir, path.basename(_file, path.extname(_file)).substring(1, _file.length))
                    } catch (err) {
                        logger.error(err, _data)
                    }
                })
                res.sendStatus(200)
            }
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
                        await fse.remove(config.db.jobDir)
                    }
                } catch (err) {
                    logger.error(JSON.stringify(err))                    
                }
            }
        }
    }
)

process.env.LISENCE == 'RDTE' &&  this.init()
