'use strict'

const path = require('path'),
    utils = require('@amuzlab/utils'),
    ps = require('@amuzlab/process'),
    COMMAND = 'python3'

class Process extends ps.Process {
    constructor(argv) {
        super(COMMAND, {
            env: process.env,
            retryCnt: 0,
            stopSignal: 'SIGTERM'
        })

        Object.defineProperties(
            this,
            {
                _argv: {
                    writable: false,
                    value: argv
                },
                _poc: { //percentage of completion
                    writable: true,
                    value: {
                        loadTime: utils.date.toFormat(),
                        step: {
                            current: 0,
                            total: 1
                        },
                        progress: {
                            current: 0,
                            total: 1
                        }
                    }
                }
            })

        this
            .on('exec', self => {
                this.emit('processExec')
            })
            .on('kill', (self, data) => {
                this.emit('processEnd')
            })
            .on('stop', (self, data) => {
                this.emit('processStop')
            })
            .on('error', err => {
                this.emit('processError', err)
            })
            .on('stderr', stderr => {
                try {
                    let _report = JSON.parse(stderr)
                    if (_report.hasOwnProperty('jobReport')) {
                        this.emit('processReport', _report.jobReport)
                    }
                } catch (err) {
                    if (stderr.includes("Traceback")) {
                        let _stterr = stderr.split("\n")
                        this.errMsg = _stterr[_stterr.length - 2]
                    }
                    if (process.env.DEBUG_MODE == 'true') {
                        console.error(`STDERR ==> \n${stderr}\n`)
                    }
                }
            })
            .on('stdout', stdout => {
                this.poc = stdout.trim().split('\n')[0]
            })
    }

    get argv() {
        return this._argv
    }

    get args() {
        return [path.join(process.env.MODULE_BASE_PATH, process.env.EXEC_FILE), JSON.stringify(this.argv)]
    }

    set poc(stdout) {
        if (stdout.indexOf('step/') !== -1) {
            stdout = stdout.split('step/')[1].split('/')
            let _current = Number(stdout[0]), _total = Number(stdout[1])
            this.poc.step.current = _current > this.poc.step.current ? _current : this.poc.step.current
            this.poc.step.total = _total
            this.poc.step.percentage = parseFloat((this.poc.step.current / this.poc.step.total * 100).toFixed(3))
            this.poc.progress.current = this.poc.progress.total = this.poc.progress.percentage = 0
        } else if (stdout.indexOf('progress/') !== -1) {
            stdout = stdout.split('progress/')[1].split('/')
            let _current = stdout[0].split('\n')[0], _total = stdout[1].split('\n')[0]
            this.poc.progress.current = parseInt(_current)
            this.poc.progress.total = parseInt(_total)
            this.poc.progress.percentage = parseFloat((_current / _total * 100).toFixed(3))
        } else {
            console.log(`_stdout ==> ${stdout}\n`)
        }
    }

    get poc() {
        return this._poc
    }

    set gpu(gpuId) {
        this._argv.gpuId = gpuId
    }

    get gpu() {
        return this._argv.gpuId
    }
}

module.exports = exports = Process