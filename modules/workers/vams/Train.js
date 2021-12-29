'use strict'

const Worker = require('../../worker'),
    WorkerMessage = require('../../vas/message')

class TrainWorker extends Worker {
    constructor() {
        super()

        this
            .on('end', async (job, worker) => {
                try {
                    let message = WorkerMessage.getResultMessage()
                    message.state = 'SUCCESS'
                    super.emit('report', message)
                } catch (err) {
                    super.emit('error', err, super.job, this) //@@
                }
            })
    }

    set process(args) {
        try {
            super.process.argv.basePath = process.env.RESOURCE_BASE_PATH
        } catch (err) {
            console.error(`process create error : ${err}`)
        }
    }

    get process() {
        return super.process
    }
}
module.exports = TrainWorker