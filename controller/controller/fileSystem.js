'use strict'

const config = require('@amuzlab/config'),
    logger = require('@amuzlab/logger'),
    utils = require('util'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    path = require('path'),
    axios = require('axios').default,
    WorkerMessage = require('../../modules/vas/message')

Object.defineProperties(
    exports,
    {
        deletePath: {
            value: async (req, res, next) => {
                try {
                    let _path = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path)

                    await fs.fs.lstatSync(_path).isDirectory() ? await fs.rmdir(_path) : await utils.promisify(fs.fs.unlink)(_path)
                    logger.info(`File/folder deletion successful. ${_path}`)
                    res.sendStatus(200)
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