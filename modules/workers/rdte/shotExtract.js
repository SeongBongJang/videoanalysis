'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    utils = require('@amuzlab/utils'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    ftpClient = require('@amuzlab/ftp-client'),
    Worker = require('@amuzlab/worker').Worker,
    sysinfo = require('@amuzlab/sys-info'),
    path = require('path'),
    axios = require('axios').default,
    qs = require('querystring'),
    Process = require('../../process'),
    WorkerMessage = require('../../vas/message'),
    TYPE = 'shotExtract'

class ShotExtracttWorker extends Worker {
    constructor() {
        super()
        Object.defineProperties(
            this,
            {
                _state: {
                    writable: true,
                    value: 'READY'
                },
                _process: {
                    writable: true,
                    value: null
                },
                _errors: {
                    writable: true,
                    value: []
                }
            })

        this
            .on('exec', async (job, worker) => {
                await new Promise(resolve => setTimeout(resolve, 5000))
                this.process.gpu = (await sysinfo.gpu.getGPU('MEMORY_USAGE')).deviceNo
                this.process.exec()
                this.emit('report', WorkerMessage.getStateMessage(this.job.args.id, 'RUNNING'))
            })
            .on('stop', (job, worker) => {
                this.process.stop()
                this.emit('report', WorkerMessage.getStateMessage(this.job.args.id, 'STOPPING'))
            })
            .on('stoped', (job, worker) => {
                this.emit('report', WorkerMessage.getStateMessage(this.job.args.id, 'STOP'))
            })
            .on('WorkerError', async (err, job, worker) => {
                await new Promise(resolve => setTimeout(resolve, 5000))
                this.process.gpu = (await sysinfo.gpu.getGPU('MEMORY_USAGE')).deviceNo
                this.process.exec()
            })
            .on('report', async message => {
                try {
                    let _message = utils.clone(message)
                    if (message.state !== undefined) {
                        this._state = message.state
                        await axios({
                            method: 'put',
                            url: `http://${this.job.host ? this.job.host : config.rdte.nms.host}:${config.rdte.nms.port}${config.rdte.nms.url[TYPE].status}`,
                            data: message,
                            timeout: 10000
                        })

                        logger.info(`[STATE] ${JSON.stringify(_message, null, 4)}`)
                    } else if (message.result !== undefined) {
                        message.state = this._state
                        await axios({
                            method: 'post',
                            url: `http://${this.job.host ? this.job.host : config.rdte.nms.host}:${config.rdte.nms.port}${config.rdte.nms.url[TYPE].report}`,
                            data: message,
                            timeout: 10000
                        })

                        logger.info(`[RESULT] ${JSON.stringify(_message, null, 4)}`)
                    } else {
                        let _preErrCnt = this.errors.length,
                            _idx

                        if (message.status.hasOwnProperty('targetId') && message.status.targetId !== undefined) {
                            _idx = this.errors.findIndex(_err => (_err.code == message.status.code) && (_err.targetId == message.status.targetId))
                        } else {
                            _idx = this.errors.findIndex(_err => _err.code == message.status.code)
                        }

                        if (message.status.recoveryFlag && _idx > -1) {
                            this.errors.splice(_idx, 1)
                        } else if (!message.status.recoveryFlag && _idx < 0) {
                            this.errors.push(message.status)
                        }

                        if (this.errors.length > 0) {
                            this._state = 'ERROR'
                        } else {
                            this._state = 'RUNNING'
                        }

                        if (_preErrCnt != this.errors.length) {
                            _message.state = this._state
                            await axios({
                                method: 'put',
                                url: `http://${this.job.host ? this.job.host : config.rdte.nms.host}:${config.rdte.nms.port}${config.rdte.nms.url[TYPE].status}`,
                                data: _message,
                                timeout: 10000
                            })

                            logger.info(`[ERR/RECV] ${JSON.stringify(_message, null, 4)}`)
                        }
                    }

                } catch (err) {
                    let _err = {}

                    if (err.response) {
                        _err.code = err.response.status
                        _err.message = err.response.statusText
                    } else if (err.request) { // 요청이 이루어 졌으나 응답 받지 못함                                                                                                                                                       
                        _err.code = err.code
                        _err.message = err.message
                    } else { // 오류를 발생 시킨 요청을 설정하는 중에 문제 발생                        
                        _err = err
                    }

                    if (message.result !== undefined) {
                        fs.writeFile(path.format({
                            dir: config.db.messageDir,
                            name: '.' + this.job.id,
                            ext: '.json'
                        }), JSON.stringify(Object.assign(message.result,
                            {
                                serviceType: this.job.serviceType,
                                host: this.job.host
                            }), null, 4), 'utf-8')
                    }

                    logger.error(`[REQUEST] ${JSON.stringify(err, null, 4)}`)
                }
            })
    }

    get state() {
        return this._state
    }

    set job(job) { // job 수정    
        super.job = job
        this.process = job.args
    }

    get job() {
        return super.job
    }

    set process(args) {
        try {
            this._process = new Process(utils.clone(args))
            this.process.argv.exec = TYPE
            this.process.argv.outputPath = path.join(
                config.rdte[TYPE].outputPath,
                String(config.server.serverId),
                args.channelInfo.svcId
            )
            this.process.argv.svcId = args.channelInfo.svcId
            this.process.argv.mip = args.channelInfo.mip
            this.process.argv.thumbnailWidth = args.optionInfo.thumbnailWidth
            this.process.argv.thumbnailHeight = args.optionInfo.thumbnailHeight
            this.process.argv.period = args.optionInfo.period
            this.process.ftpClientInstances = []

            this.process
                .on('processExec', () => {
                    if (this.process.ftpClientInstances.length == 0) {
                        args.ftpList.map(async _ftpConf => {
                            let _ftpClientInstance = await ftpClient.createFtpClient(
                                Object.assign(_ftpConf,
                                    {
                                        "isConnect": true
                                    }))
                                .on('connect', (_config, _ftp) => {
                                    this.emit('report', WorkerMessage.getRecoveryMessage(this.job.args.id, 'FTP', _ftpConf.ftpId))
                                })
                                .on('error', (_err, _config, _ftp) => {
                                    let err = {
                                        errno: 'FTP',
                                        code: 646,
                                        message: '연결이 끊어졌습니다.'
                                    }
                                    this.emit('report', WorkerMessage.getErrorMessage(this.job.args.id, err, _ftpConf.ftpId))
                                })
                            this.process.ftpClientInstances.push(_ftpClientInstance)
                        })
                    }
                })
                .on('processStop', async () => {
                    await this.process.emit('processFTPDisconnect')
                    this.emit('stoped', this.job, this)
                })
                .on('processError', async err => {
                    this.emit('WorkerError', err, this.job, this)
                })
                .on('processFTPDisconnect', async () => {
                    try {
                        await Promise.all(this.process.ftpClientInstances.map(async _ftpClientInstance => {
                            return await _ftpClientInstance.disconnect()
                        }))
                        this.process.ftpClientInstances = []
                    } catch (err) {
                        logger.error(`[FTP] DISCONNECT ERROR : ${err}`)
                    }
                })
                .on('processReport', async report => {
                    if (Number(report.error.code) == 200) {
                        this.emit('report', WorkerMessage.getRecoveryMessage(this.job.args.id, 'LIBRARY'))

                        // nms send
                        report.result.forwardImgPath = path.join('rdte_resource', report.result.realimgPath.split(config.rdte[TYPE].outputPath)[1])
                        report.result.imgPath = path.posix.join(
                            `CH${report.result.svcId}_image`,
                            report.result.imgTime.substring(0, 4),
                            report.result.imgTime.substring(4, 6),
                            report.result.imgTime.substring(6, 8),
                            path.basename(report.result.realimgPath))

                        this.emit('report', WorkerMessage.getResultMessage(this.job.args.id, report.result))

                        // result send
                        if (config.server.state.toUpperCase() == 'MAIN' || this.state == 'ERROR') {
                            try {
                                let _ftpFileConf = {
                                    "source": report.result.realimgPath,
                                    "sourceType": ftpClient.SOURCE_TYPE.FILE,
                                    "destination": report.result.imgPath
                                }

                                await Promise.all(this.process.ftpClientInstances.map(async _ftpClientInstance => { // FTP
                                    try {
                                        let _result = await _ftpClientInstance.put(_ftpFileConf)
                                        let _ftp = {
                                            ftpId: _ftpClientInstance.config.ftpId,
                                            data: _result
                                        }
                                        this.emit('report', WorkerMessage.getRecoveryMessage(this.job.args.id, 'FTP', _ftpClientInstance.config.ftpId))
                                        logger.info(`[FTP] ${JSON.stringify(_ftp, null, 4)}`)
                                        return _result
                                    } catch (err) {
                                        return Promise.reject(
                                            WorkerMessage.getErrorMessage(
                                                this.job.args.id,
                                                {
                                                    errno: 'FTP',
                                                    code: err.code,
                                                    message: err.message
                                                },
                                                _ftpClientInstance.config.ftpId
                                            )
                                        )
                                    }
                                }))

                                await Promise.all(args.reportList.filter(_reportConf => _reportConf.name.toUpperCase().includes("AMOC")).map(async _conf => {
                                    try {
                                        await axios({
                                            method: 'post',
                                            url: `http://${_conf.host}:${_conf.port}${_conf.url}?${qs.stringify(report.result)}`,
                                            timeout: _conf.timeout,
                                            transformResponse: (data) => {
                                                data = JSON.parse(data)
                                                if (Number(data.result) == 1) {
                                                    let _amoc = {
                                                        amocId: _conf.reportId,
                                                        data: report.result
                                                    }
                                                    logger.info(`[AMOC] ${JSON.stringify(_amoc, null, 4)}`)
                                                    this.emit('report', WorkerMessage.getRecoveryMessage(this.job.args.id, 'AMOC', _conf.reportId))
                                                    return data
                                                } else {
                                                    throw data
                                                }
                                            }
                                        })
                                    } catch (err) {
                                        let _err = {
                                            errno: 'AMOC',
                                            id: _conf.reportId
                                        }

                                        if (err.response) {   // 응답이 이상한 경우                                                                                       
                                            _err.code = err.response.status
                                            _err.message = err.response.statusText
                                        } else if (err.request) {    // 주소가 잘 못 된 경우                                                                                                                                          
                                            _err.code = err.code
                                            _err.message = err.message
                                        } else {
                                            _err.message = JSON.stringify(err)
                                        }

                                        return Promise.reject(WorkerMessage.getErrorMessage(this.job.args.id, _err, _conf.reportId))
                                    }
                                }))

                            } catch (err) {
                                this.emit('report', err)
                            }
                        }

                        // file clear
                        // fs.limitFiles(
                        //     path.dirname(report.result.realimgPath),
                        //     (args.optionInfo.hasOwnProperty('outputFileLimit') && args.optionInfo.outputFileLimit != null) ?
                        //         args.optionInfo.outputFileLimit :
                        //         config.rdte[TYPE].outputFileLimit) //썸네일 이미지 관리 개수 수정
                        // (file-system.js)
                        // exports.limitFiles = async function (dirPath, limitCount){
                        //     /*try {
                        //         let _result = await exports.readdir(dirPath)
                        //         await new Promise((resolve, reject) => {
                        //             result.files = result.files.filter(_file => !!path.extname(_file))            
                        //             while(result.files.length > limitCount){
                        //                 let _delFile = path.join(dirPath, result.files.shift())
                        //                 fs.unlinkSync(_delFile, err => {
                        //                     err ? reject(err) : resolve(_delFile)
                        //                 })
                        //             }
                        //         })
                        //     } catch (err) {
                        //         console.error(`${err}`)
                        //     }*/
                        //     return exports.readdir(dirPath)
                        //         .then(result => new Promise((resolve, reject) => {
                        //             result.files = result.files.filter(_file => path.extname(_file))            
                        //             while(result.files.length > limitCount){
                        //                 let _delFile = path.join(dirPath, result.files.shift())
                        //                 fs.unlinkSync(_delFile, err => {
                        //                     err ? reject(err) : resolve(_delFile)
                        //                 })
                        //             }
                        //         }))
                        // };
                        await new Promise(async (resolve, reject) => {
                            let _dirPath = path.dirname(report.result.realimgPath)

                            let _dirFiles = (await fs.readdir(_dirPath)).files

                            let _limitCount = args.optionInfo.hasOwnProperty('outputFileLimit') && args.optionInfo.outputFileLimit != null ? args.optionInfo.outputFileLimit : config.rdte[TYPE].outputFileLimit

                            while (_dirFiles.length > _limitCount) {
                                let _delFile = path.join(_dirPath, _dirFiles.shift())
                                fs.fs.unlinkSync(_delFile, err => {
                                    err ? reject(err) : resolve(_delFile)
                                })
                            }
                        })

                    } else {
                        report.error.errno = 'LIBRARY'
                        this.emit('report', WorkerMessage.getErrorMessage(this.job.args.id, report.error))
                    }
                })
        } catch (err) {
            console.error(err)
        }

    }

    get process() {
        return this._process
    }

    set errors(errors) {
        this._errors = errors
    }

    get errors() {
        return this._errors
    }
}
module.exports = ShotExtracttWorker