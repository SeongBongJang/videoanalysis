'use strict'
const logger = require('@amuzlab/logger'),
    sysinfo = require('@amuzlab/sys-info'),
    gpuLoadBalancer = require('@amuzlab/gpu-load-balancer')

Object.defineProperties(
    exports,
    {
        info: {
            value: async (req, res, next) => {
                try {
                    let _gpuInfo = (await sysinfo.gpu.gpus)
                    res.send(_gpuInfo)
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
        gpuLoadBalance: {
            value: async (req, res, next) => {
                try {
                    let _gpu = (await gpuLoadBalancer.getGPU('ROUND_ROBIN_MEM'))
                    res.status(200).send(_gpu)
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
        gpuLoadBalanceUsage: {
            value: async (req, res, next) => {
                try {
                    let _gpu = (await sysinfo.gpu.getGPU('MEMORY_USAGE')).usage.memory
                    res.send(_gpu)
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