'use strict'

const { resolve } = require('path')

const logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../../worker'),
    path = require('path'),
    WorkerMessage = require('../../../vas/message'),
    fsPromise = require('fs').promises,
    DateFormat = (birthtimeMs) => {
        let _birthtimeMs = new Date(birthtimeMs),
                    _year = _birthtimeMs.getFullYear().toString(),
                    _month = (_birthtimeMs.getMonth() + 1).toString(),
                    _date = _birthtimeMs.getDate().toString(),
                    _hour = _birthtimeMs.getHours().toString(),
                    _minute = _birthtimeMs.getMinutes().toString(),
                    _second = _birthtimeMs.getSeconds().toString()
        
        return `${_year}-${_month[1] ? _month : "0" + _month}-${_date[1] ? _date : "0"+_date} ${_hour[1] ? _hour : "0" + _hour}:${_minute[1] ? _minute : "0" + _minute}:${_second[1] ? _second : "0" + _second}`
        /*return new Promise((resolve, reject) => {
            try {
                let _birthtimeMs = new Date(birthtimeMs),
                    _year = _birthtimeMs.getFullYear().toString(),
                    _month = (_birthtimeMs.getMonth() + 1).toString(),
                    _date = _birthtimeMs.getDate().toString(),
                    _hour = _birthtimeMs.getHours().toString(),
                    _minute = _birthtimeMs.getMinutes().toString(),
                    _second = _birthtimeMs.getSeconds().toString()

                resolve(`${_year}-${_month[1] ? _month : "0" + _month}-${_date[1] ? _date : "0"+_date} ${_hour[1] ? _hour : "0" + _hour}:${_minute[1] ? _minute : "0" + _minute}:${_second[1] ? _second : "0" + _second}`)
            } catch (err) {
                console.error(err)
                reject(err)
            }
        })*/
    }


class ShotBoundaryDetectionWorker extends Worker {
    constructor() {
        super()

        this
            .on('end', async (job, worker) => {
                try {
                    let _file = await fs.readFile(
                        path.join(
                            super.process.argv.basePath,
                            super.process.argv.outputPath,
                            super.process.argv.outputMetaFileName))

                    let _jobReport = JSON.parse(_file.data).jobReport
                    if (Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) {
                        // 파일 사이즈 추가
                        await Promise.all(_jobReport.result.shotData.map(async _shot => {
                            let _startFile = await fsPromise.stat(path.join(process.env.RESOURCE_BASE_PATH, super.process.argv.outputPath, _shot.startFileName)),
                                _thumbFile = await fsPromise.stat(path.join(process.env.RESOURCE_BASE_PATH, super.process.argv.outputPath, _shot.thumbnailFileName)),
                                _bestFile = await fsPromise.stat(path.join(process.env.RESOURCE_BASE_PATH, super.process.argv.outputPath, _shot.bestFileName)),
                                _endFile = await fsPromise.stat(path.join(process.env.RESOURCE_BASE_PATH, super.process.argv.outputPath, _shot.endFileName))

                            _shot.startFileSize = String(_startFile.size)
                            _shot.thumbFileSize = String(_thumbFile.size)
                            _shot.bestFileSize = String(_bestFile.size)
                            _shot.endFileSize = String(_endFile.size)

                            _shot.startFileRegDate = DateFormat(_startFile.birthtimeMs)                            
                            _shot.thumbFileRegDate = DateFormat(_thumbFile.birthtimeMs)
                            _shot.bestFileRegDate = DateFormat(_bestFile.birthtimeMs)
                            _shot.endFileRegDate = DateFormat(_endFile.birthtimeMs)
                        }))

                        _jobReport.result.outputPath = super.process.argv.outputPath
                        _jobReport.result.outputMetaFileName = super.process.argv.outputMetaFileName

                        let message = WorkerMessage.getResultMessage(
                            super.job.args.id,
                            _jobReport.result)
                        message.state = 'SUCCESS'

                        super.emit('report', message)
                    } else {
                        throw _jobReport.error
                    }
                } catch (err) {
                    super.emit('error', err, super.job, this)
                }
            })
    }

    set process(args) {
        try {

            super.process.argv.exec = super.job.serviceType
            super.process.argv.execKr = '샷 추출'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH

            super.process.argv.outputPath = path.join(
                args.filePath.split('/content')[0],
                super.job.serviceType)

            super.process.argv.outputMetaFileName = path.format({
                'name': super.job.serviceType,
                'ext': '.json'
            })

        } catch (err) {
            logger.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = ShotBoundaryDetectionWorker