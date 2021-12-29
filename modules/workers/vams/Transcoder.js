'use strict'

const config = require('@amuzlab/config'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../worker'),
    path = require('path'),
    WorkerMessage = require('../../vas/message')

class TranscoderWorker extends Worker {
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
                    if ((Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) && await fs.checkPath(path.join(process.env.RESOURCE_BASE_PATH, super.process.argv.outputPath, super.process.argv.outputFileName))) {
                        let message = WorkerMessage.getResultMessage(
                            super.job.args.id,
                            {
                                "outputFilePath":path.join(super.process.argv.outputPath, super.process.argv.outputFileName)
                            })
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
            super.process.argv.execKr = '트랜스코딩'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH

            super.process.argv.outputPath = path.join(
                args.filePath.split('/content')[0],
                super.job.serviceType
            )

            super.process.argv.outputFileName = path.format({
                'name': path.basename(args.filePath, path.extname(args.filePath)),
                'ext': '.mp4'
            })

            super.process.argv.outputMetaFileName = path.format({
                'name': super.job.serviceType,
                'ext': '.json'
            })
        } catch (err) {
            console.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = TranscoderWorker