'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../worker'),
    path = require('path'),
    WorkerMessage = require('../../vas/message')

class TrailerWorker extends Worker {
    constructor() {
        super()

        this
            .on('end', async (job, worker) => {
                try {
                    await fs.checkPath(path.join(process.env.RESOURCE_BASE_PATH, super.process.argv.outputPath))
                    let _file = await fs.readFile(
                        path.join(
                            process.env.RESOURCE_BASE_PATH,
                            super.process.argv.outputPath,
                            super.process.argv.outputMetaFileName))

                    let _jobReport = JSON.parse(_file.data).jobReport
                    if ((Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) && await fs.checkPath(path.join(process.env.RESOURCE_BASE_PATH, _jobReport.result.outputFilePath))) {
                        _jobReport.result.outputFilePath = path.join(process.env.RESOURCE_BASE_PATH, _jobReport.result.outputFilePath)
                        _jobReport.result.version = super.process.argv.version
                        let message = WorkerMessage.getResultMessage(
                            super.job.args.id,
                            _jobReport.result)
                        message.state = 'SUCCESS'

                        super.emit('report', message)
                    } else {
                        throw _jobReport.error
                    }
                } catch (err) {
                    super.emit('error', err, super.job, this) //@@
                }
            })
    }

    set process(args) {
        try {

            super.process.argv.exec = super.job.serviceType
            super.process.argv.execKr = '배경 예고편'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH

            super.process.argv.filePath = path.join(
                args.filePath,
                args.fileName)

            super.process.argv.outputPath = path.join(
                args.filePath.includes('Transcoder') ? args.filePath.split('/Transcoder')[0] : args.filePath.split('/content')[0],
                super.job.serviceType)

            super.process.argv.outputFileName = path.format({
                name: super.job.serviceType,
                ext: '.ts'
            })

            super.process.argv.outputMetaFileName = path.format({
                name: super.job.serviceType,
                ext: '.json'
            })

            super.process.argv.outputHlsFilePath = path.format({
                dir: 'hls',
                name: path.basename(args.fileName, path.extname(args.fileName)),
                ext: '.m3u8'
            })

            super.process.argv.interval = config.vams.trailer.interval

            super.process.argv.cpuCore = config.vams.trailer.cpuCore

        } catch (err) {
            logger.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = TrailerWorker