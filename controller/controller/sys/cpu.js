'use strict'
const logger = require('@amuzlab/logger'),        
    nosu = require('node-os-utils')

Object.defineProperties(
    exports,
    {
        info: {
            value: async (req, res, next) => {
                try {
                    let _cpuInfo = await nosu.mem.info()
                    res.send(_cpuInfo)
                } catch (err) {
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.status(400).json(err.map(_err => _err.message))
                    } else {
                        logger.error(JSON.stringify(err))
                        res.status(400).json(err)
                    }
                }
            }
        },
        usage: {
            value: async (req, res, next) => {
                try {
                    let _memUsage = Number(100 - (await nosu.mem.info()).freeMemPercentage).toFixed(2)
                    res.send(_memUsage)
                } catch (err) {
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.status(400).json(err.map(_err => _err.message))
                    } else {
                        logger.error(JSON.stringify(err))
                        res.status(400).json(err)
                    }
                }
            }
        }
    }
)