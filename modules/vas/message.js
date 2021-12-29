'use strict'

const config = require('@amuzlab/config'),
    WorkerStatus = require('./status')

Object.defineProperties(
    exports,
    {
        getResultMessage: {
            enumerable: true,
            value: (id, result) => {
                return new Message(id, undefined, undefined, result)
            }
        },
        getStateMessage: {
            enumerable: true,
            value: (id, state) => {
                return new Message(id, state)
            }
        },
        getErrorMessage: {
            enumerable: true,
            value: (id, err, targetId) => {
                return new Message(id, undefined, WorkerStatus.getErrorStatus(err, targetId))
            }
        },
        getRecoveryMessage: {
            enumerable: true,
            value: (id, errno, targetId) => {
                return new Message(id, undefined, WorkerStatus.getRecoveryStatus(errno, targetId))
            }
        }
    }
)

class Message {
    constructor(id, state, status, result) {
        this.serverId = config.server.serverId

        this.id = id

        this.state = state

        if (status) {
            this.status = status
        } else {
            this.status = {
                code: 200,
                message: ""
            }
        }

        if (result) {
            this.result = result
        }        
    }
}