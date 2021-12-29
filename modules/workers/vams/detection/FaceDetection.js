'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../../worker'),
    path = require('path'),
    WorkerMessage = require('../../../vas/message')

class FaceDetectionWorker extends Worker {
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

                        /*let _count = 1
                        let _data = JSON.parse(_file.data)
                        _data.jobReport.result.forEach(_thumb => {
                            _thumb.thumbId = _count
                            _count += 1
                        })
                        fs.writeFile(path.join(
                            super.process.argv.basePath,
                            super.process.argv.outputPath,
                            super.process.argv.outputMetaFileName),
                            JSON.stringify(_data, null, 4),
                            'utf-8')*/

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
            super.process.argv.execKr = '얼굴 검출'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH

            super.process.argv.fileName = 'ShotBoundaryDetection.json'

            super.process.argv.outputPath = path.join(
                args.filePath.split('/ShotBoundaryDetection')[0],
                super.job.serviceType)

            super.process.argv.outputMetaFileName = path.format({
                name: super.job.serviceType,
                ext: '.json'
            })

            super.process.argv.faceMetaFileName = super.process.argv.outputMetaFileName

            super.process.argv.faceGpuMemoryFraction = config.vams.detection.gpuMemory

            if (args.hasOwnProperty('debug')) {
                super.process.argv.faceSlicePath = path.join(super.job.serviceType, config.vams.detection.debug.slicePath)
                super.process.argv.faceOverridePath = path.join(super.job.serviceType, config.vams.detection.debug.overridePath)
            }

        } catch (err) {
            logger.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = FaceDetectionWorker