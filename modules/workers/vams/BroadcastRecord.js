'use strict'

const config = require('@amuzlab/config'),
    utils = require('@amuzlab/utils'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../worker'),
    path = require('path'),
    WorkerMessage = require('../../vas/message')

class BroadCastRecordWorker extends Worker {
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
                    if ((Number(_jobReport.error.code) == 200 || Number(_jobReport.error.code) == 0) && await fs.checkPath(path.join(super.process.argv.basePath, _jobReport.result.outputFilePath))) {
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
            super.process.argv.execKr = '채널 녹화'

            super.process.argv.basePath = process.env.DATASETS_PATH_BROADCAST

            super.process.argv.outputPath = config.vams.broadcastRecord.outputPath

            super.process.argv.outputMetaFileName = path.format({
                'name': `${String(super.job.args.id)}_${utils.date.toFormat('YYYY-MM-DD_HH24_MI')}`,
                'ext': '.json'})           

        } catch (err) {
            console.error(`process create error : ${err}`)
        }        
    }

    get process() {
        return super.process
    }
}
module.exports = BroadCastRecordWorker