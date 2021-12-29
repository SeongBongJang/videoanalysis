'use strict'

const config = require('@amuzlab/config'),
    utils = require('@amuzlab/utils'),
    logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../../worker'),
    path = require('path'),
    WorkerMessage = require('../../../vas/message')

class PixelImageMatchingWorker extends Worker {
    constructor() {
        super()

        this
            .on('end', async (job, worker) => {
                try {
                    let _file = await fs.readFile(
                        path.join(
                            process.env.RESOURCE_BASE_PATH,
                            super.process.argv.outputPath,
                            super.process.argv.outputMetaFileName))

                    let _jobReport = JSON.parse(_file.data).jobReport
                    if (Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) {
                        _jobReport.result.matchResult.map(_matchIndex => {                            
                            _matchIndex.confId = (this.process.argv.queryList.find(_query => _query.index == _matchIndex.index)).confId
                            _matchIndex.compareId = this.process.argv.compareId
                        })

                        let message = WorkerMessage.getResultMessage(
                            super.job.args.id,
                            _jobReport.result.matchResult)
                        message.state = 'SUCCESS'

                        super.emit('report', message)
                    } else {
                        throw _jobReport.error
                    }
                } catch (err) {
                    super.emit('error', err, this.job, this)
                }
            })
    }

    set process(args) {
        try {

            super.process.argv.exec = super.job.serviceType
            super.process.argv.execKr = '픽셀 매칭'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH

            super.process.argv.outputPath = path.join(
                args.filePath.split('/content')[0],
                this.job.serviceType)

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
module.exports = PixelImageMatchingWorker