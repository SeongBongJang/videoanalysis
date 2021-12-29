'use strict'

const worker = require('@amuzlab/worker'),
    utils = require('@amuzlab/utils'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    path = require('path'),
    vams = require('.')

Object.defineProperties(
    exports,
    {
        shot: {
            value: (req, res, next) => {
                let _type = 'FeatureMatching'
                
                let job = new worker.Job()
                job.serviceType = _type
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
            }
        },
        deepFeatureTemporalMatching: {
            value: (req, res, next) => {
                let _type = 'DeepFeatureTemporalMatching'
                
                let job = new worker.Job()
                job.serviceType = _type
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
            }
        },
        pixel: {
            value: (req, res, next) => {
                let _type = 'PixelImageMatching'
                
                let job = new worker.Job()
                job.serviceType = _type
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
            }
        }
    }
)