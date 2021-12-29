'use strict'

/**
 * @module      app
 * @since       0.0.1
 * @desc        서버 routing 등록 및 express 설정 module<br/>
 * @date        2020-01-02
 */

/** code example **/
const
    config = require('@amuzlab/config'),
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'), // 세션관리 미들웨어 
    logger = require('@amuzlab/logger'), // 로그 미들 웨어
    routes = require('./routes'),
    path = require('path'),
    { sequelize } = require('./models/index') // MYSQL sequelize 모델    
module.exports = exports = express()

let _reversePath = config.rdte.shotExtract.outputPath

exports
    .use(require('cors')())
    .use(bodyParser.json({
        limit: '300mb'
    }))
    .use(bodyParser.urlencoded({
        limit: '10mb',
        extended: false
    }))
    .use(require('cookie-parser')())
    .use(session({
        secret: 'keyboard cat',
        resave: true,
        saveUninitialized: false,
        cookie: {
            maxAge: null,
            httpOnly: true
        },
        store: new (require('session-memory-store')(session))()
    }))
    .use((err, req, res, next) => {
        logger.error('server error (err : %s)', err.stack)

        if (res.statusCode !== 404) {
            res
                .status(err.statusCode ? err.statusCode : 500)
                .send(err instanceof Error ? err.message : err)
        }
    })
    .use('/page', express.static(path.join(__dirname, 'public')))
    .use(
        '/vams',
        routes.vams
    )
    .use(
        '/rdte',
        routes.rdte
    )
    .use(
        '/sys',
        routes.sys
    )
    .use(
        '/db',
        routes.db
    )
    .use(
        '/utils',
        routes.utils
    )
    .use(
        '/file-system',
        routes.fileSystem
    )
    .use('/rdte_resource', express.static(_reversePath))

//DB 연결, 환경변수 필수
if (config.db.filter(envValue => process.env.hasOwnProperty(envValue)).length == config.db.length) {
    sequelize.sync()
        .then(async () => {
            try {
                await sequelize.authenticate();
                logger.info('Connection has been established successfully.');
            } catch (error) {
                logger.error('Unable to connect to the database:', error);
            }
        })
        .catch(err => {
            logger.error(`Database Connection Failed : ${err}`)
        })
} else {
    let _mis_db_env = config.db.filter(envValue => !process.env.hasOwnProperty(envValue))
    console.debug(`There is no database environment variable : ${_mis_db_env}`)
}
