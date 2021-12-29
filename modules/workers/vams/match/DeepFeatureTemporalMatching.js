'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),    
    fs = require('@amuzlab/fs-promise').fileSystem,
    Worker = require('../../../worker'),
    path = require('path'),    
    WorkerMessage = require('../../../vas/message')

class DeepFeatureTemporalMatchingWorker extends Worker {
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
                        _jobReport.result.startConfId = super.process.argv.startConfId
                        _jobReport.result.endConfId = super.process.argv.endConfId
                        _jobReport.result.querySegmentProfile =  super.job.args.querySegmentProfile
                        _jobReport.result.outputMetaFilePath = path.join(
                            super.process.argv.outputPath, 
                            super.process.argv.outputMetaFileName
                            )
                        delete _jobReport.result.matchInfo
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
            super.process.argv.execKr = '구간 매칭'

            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH
                        
            super.process.argv.outputPath = path.join(
                args.targetFeatureMetaFilePath.split('/DeepFeatureGenerator')[0],  
                super.process.argv.exec                              
            )            

            super.process.argv.outputMetaFileName = path.format({
                'name': args.querySegmentProfile,
                'ext': '.json'
            })     
            
            // 장면 탐색 옵션
            super.process.argv.videoSigma = args.videoSigma ? args.videoSigma : process.env.DFTMVIDEOSIGMA ? process.env.DFTMVIDEOSIGMA : 3.5
            super.process.argv.audioSigma = args.audioSigma ? args.audioSigma : process.env.DFTMAUDIOSIGMA ? process.env.DFTMAUDIOSIGMA : 3.5
            super.process.argv.videoMinThreshold = args.videoMinThreshold ? args.videoMinThreshold : process.env.DFTMVIDEIMINTHRESHOLD ? process.env.DFTMVIDEIMINTHRESHOLD : 0.54
            super.process.argv.audioMinThreshold = args.audioMinThreshold ? args.audioMinThreshold : process.env.DFTMAUDIOMINTHRESHOLD ? process.env.DFTMAUDIOMINTHRESHOLD : 0.66

            switch(args.querySegmentProfile.toLowerCase()){
                case "none":
                    super.process.argv.querySegmentProfile = 0
                    break;
                case "intro":
                case "semiintro":
                    super.process.argv.querySegmentProfile = 1
                    break;
                case "ending":
                    super.process.argv.querySegmentProfile = 2
                    break;
            }            
        } catch (err) {
            logger.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = DeepFeatureTemporalMatchingWorker