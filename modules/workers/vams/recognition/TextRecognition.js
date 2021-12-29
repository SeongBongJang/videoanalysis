'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../../worker'),
    path = require('path'),
    WorkerMessage = require('../../../vas/message')

class TextRecognitionWorker extends Worker {
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
            super.process.argv.execKr = '텍스트 인식'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH

            super.process.argv.outputPath = path.join(
                args.filePath.split('/ShotBoundaryDetection')[0],
                super.job.serviceType)

            super.process.argv.outputMetaFileName = path.format({
                'name': super.job.serviceType,
                'ext': '.json'
            })

            super.process.argv.textGpuMemoryFraction = config.vams.recognition.gpuMemory

            if (args.hasOwnProperty('debug')) {
                super.process.argv.faceSlicePath = config.vams.recognition.debug.slicePath
                super.process.argv.faceOverridePath = config.vams.recognition.debug.overridePath
            }

        } catch (err) {
            logger.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = TextRecognitionWorker