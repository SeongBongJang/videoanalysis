'use strict'

const config = require('@amuzlab/config'),
    utils = require('@amuzlab/utils'),
    logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../../worker'),
    path = require('path'),
    WorkerMessage = require('../../../vas/message')

class FeatureMatchingWorker extends Worker {
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
                        _jobReport.result.map(_matchIndex => {                            
                            _matchIndex.confId = (this.process.argv.queryList.find(_query => _query.index == _matchIndex.index)).confId
                            _matchIndex.compareId = this.process.argv.compareId
                        })

                        let message = WorkerMessage.getResultMessage(
                            super.job.args.id,
                            _jobReport.result)
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
            super.process.argv.execKr = '특징점 매칭'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH

            super.process.argv.outputPath = path.join(
                args.metaFilePath.split('/ShotBoundaryDetection')[0],
                this.job.serviceType)

            super.process.argv.outputMetaFileName = path.format({
                'name': super.job.serviceType,
                'ext': '.json'
            })

            super.process.argv.sbdMetaFilePath = args.metaFilePath

            if (args.hasOwnProperty('debug')) {
                super.process.argv.debugPath = super.process.argv.outputPath
            }

        } catch (err) {
            logger.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = FeatureMatchingWorker