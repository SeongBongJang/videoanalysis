'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    utils = require('@amuzlab/utils'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    worker = require('@amuzlab/worker'),
    gpuLoadBalancer = require('@amuzlab/gpu-load-balancer'),
    path = require('path'),
    axios = require('axios').default,
    Process = require('./process'),
    WorkerMessage = require('./vas/message')

class VASWorker extends worker.Worker {
    constructor() {
        super()
        Object.defineProperties(
            this,
            {
                _process: {
                    writable: true,
                    value: null
                }
            })

        this
            .on('exec', async (job, worker) => {                              
                if(!this.process.argv.hasOwnProperty('gpuId')){
                    this.process.gpu = (await gpuLoadBalancer.getGPU('ROUND_ROBIN_MEM')).deviceNo                 
                }         
                
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
            .on('error', (err, job, worker) => {                                
                if(err.code == 'E102'){
                    err.errno = 'FILE'
                }else {
                    err.errno = 'PROCESS'
                    err.message = `${err} ${this.process.errMsg}`
                }        
                
                let message = WorkerMessage.getErrorMessage(
                    this.job.args.id,
                    err)
                message.state = 'ERROR'
                this.emit('report', message)
            })
            .on('report', async message => {
                try {
                    await axios({
                        method: 'post',
                        url: `http://${this.job.host ? this.job.host : process.env.SERVICE_SERVER_HOST}:${process.env.SERVICE_SERVER_PORT}${config.vams.nms.url[this.job.serviceType]}`,
                        data: message,
                        timeout: 10000
                    })
                    logger.info(`[RESULT] ${JSON.stringify(message, null, 4)}`)
                }
                catch (err) {
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

                    fs.writeFile(path.format({
                        dir: process.env.MSG_FILE_PATH,
                        name: '.' + this.job.id,
                        ext: '.json'
                    }), JSON.stringify(Object.assign(message,
                        {
                            serviceType: this.job.serviceType,
                            host: this.job.host
                        }), null, 4), 'utf-8')

                    logger.error(`[REQUEST] ${JSON.stringify(err, null, 4)}`)
                }
            })
    }

    set job(job) { // job 수정    
        super.job = job
        this._process = new Process(utils.clone(job.args))
        this.process
                .on('processEnd', () => {
                    this.process.emit('rollback')                    
                    this.emit('end', super.job, this)
                })
                .on('processStop', () => {                    
                    this.process.emit('rollback')                    
                    this.emit('stoped', super.job, this)
                })
                .on('processError', err => {
                    this.process.emit('rollback')                    
                    this.emit('error', err, super.job, this)
                })                
        this.process = job.args
    }

    get job() {
        return super.job
    }
    
    get process() {
        return this._process
    }
}   

module.exports = VASWorker