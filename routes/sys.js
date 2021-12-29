'use strict'

const express = require('express'),
    logger = require('@amuzlab/logger'),
    router = express.Router(),
    controller = require('../controller').controller.sys,
    snmp = require('net-snmp'),
    session = snmp.createSession(process.env.SYSTEM_SERVER, 'Mosaic'),
    oids = [
        process.env.SNMP_CPU, // cpu
        process.env.SNMP_MEMTOT,   // memory used
        process.env.SNMP_MEMUSED,   // memory total   
        process.env.SNMP_MEMFREE  // memory free        
    ]

module.exports = exports = router

router.get('/cpu', controller.cpu.info)
router.get('/gpu', controller.gpu.info)
router.get('/cpu/usage', controller.cpu.usage)
router.get('/gpu/load-balance', controller.gpu.gpuLoadBalance)
router.get('/gpu/load-balance/usage', controller.gpu.gpuLoadBalanceUsage)

router.get('/snmp', async (req, res, next) => {
    try {
        session.get(oids, (err, varbinds) => {
            if (err) {
                throw err
            } else {
                res.send(varbinds)
            }
        })

        session.trap(snmp.TrapType.LinkDown, function (err) {
            if (err) {
                throw err
            }
        })
        session.onClose()
    } catch (err) {
        logger.error(err)
        res.status(400).send(String(err))
    }
})