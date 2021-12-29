'use strict'

const config = require('@amuzlab/config'),
    worker = require('@amuzlab/worker'),
    utils = require('@amuzlab/utils'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    path = require('path'),
    rdte = require('./')


Object.defineProperties(
    exports,
    {
        shot: {
            value: async (req, res, next) => {
                if (req.body.hasOwnProperty('serverId')) {
                    config.server.serverId = req.body.serverId
                    config.server.state = req.body.sState
                    fs.writeFile(config.server.configPath, JSON.stringify(config.server, null, 4))
                }

                if (req.body.hasOwnProperty('jobList')) {
                    req.body.jobList.map(_job => {
                        let job = new worker.Job()
                        job.serviceType = 'shotExtract'
                        job.host = config.rdte.nms.host ? config.rdte.nms.host : req.headers['x-forwarded-for'] || req.connection.remoteAddress
                        job.args = utils.clone(_job)

                        rdte.GpuContainer.exec(job)

                        fs.writeFile(path.format({
                            dir: config.db.jobDir,
                            name: '.' + job.id,
                            ext: '.json'
                        }), JSON.stringify(Object.assign(utils.clone(job.args), {
                            serviceType: job.serviceType,
                            host: job.host
                        }), null, 4), 'utf-8')
                    })
                } else {                    
                    let job = new worker.Job()                                        
                    job.serviceType = 'shotExtract'
                    job.host = req.body.host
                    job.args = utils.clone(req.body)                                                                             
                    rdte.GpuContainer.exec(job)

                    fs.writeFile(path.format({
                        dir: config.db.jobDir,
                        name: '.' + job.id,
                        ext: '.json'
                    }), JSON.stringify(Object.assign(utils.clone(job.args), {
                        serviceType: job.serviceType,
                        host: job.host
                    }), null, 4), 'utf-8')
                }
            }
        }
    }
)