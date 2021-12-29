'use strict'

const express = require('express'),
    logger = require('@amuzlab/logger'),
    router = express.Router(),
    controller = require('../controller').controller.db

module.exports = exports = router

// 쿼리 요청
router.post('/', async (req, res, next) => {
    try {
        let _crud = Object.keys(req.query)[0]        
        res.send(await controller.query(_crud.toUpperCase(), req.query[_crud]))
    } catch (err) {
        logger.error(err)
        res.status(400).send(err)
    }
})

// 테이블 리스트
router.get('/', async (req, res, next) => {
    try {
        res.send(await controller.table())
    } catch (err) {
        res.status(400).send(err)
    }
})

// 연결 확인
router.get('/connection', async (req, res, next) => {
    try {
        res.send(await controller.connection())
    } catch (err) {
        logger.error(err)
        res.status(400).send(err)
    }
})

// 조회
router.get('/:table', async (req, res, next) => {
    try {
        res.send(await controller.search(req.params.table, req.body))
    } catch (err) {
        logger.error(err)
        res.status(400).send(err)
    }
})

// 삽입
router.post('/:table', async (req, res, next) => {
    try {
        await controller.insert(req.params.table, req.body)
        res.sendStatus(200)
    } catch (err) {
        res.status(400).send(err)
    }
})

// 수정
router.put('/:table', async (req, res, next) => {
    try {
        await controller.update(req.params.table, req.body.set, req.body.where)
        res.sendStatus(200)
    } catch (err) {
        res.status(400).send(err)
    }
})

// 삭제
router.delete('/:table', async (req, res, next) => {
    try {
        await controller.delete(req.params.table, req.body)
        res.sendStatus(200)
    } catch (err) {
        logger.error(err)
        res.status(400).send(err)
    }
})

//SHOW COLUMNS FROM servers FROM vas
//SHOW COLUMNS FROM vas.servers