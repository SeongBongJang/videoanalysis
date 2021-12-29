'use strict'

const logger = require('@amuzlab/logger'),
    sharp = require('sharp'),
    util = require('util'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    path = require('path')

Object.defineProperties(
    exports,
    {
        crop: {
            value: async (req, res, next) => {
                try {
                    let _filePath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath
                    ), _outputPath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.outputPath
                    ),
                    _width, _height, _left, _top, _new_file_info
                    
                    if (req.body.hasOwnProperty("crop")) {
                        let _widthmargin = req.body.position.x2 - req.body.position.x1,
                        _heightmargin = req.body.position.y2 - req.body.position.y1
                        
                        _left = Math.floor(req.body.position.x1 - ((req.body.crop.width - _widthmargin) / 2))
                        _top = Math.floor(req.body.position.y1 - ((req.body.crop.height - _heightmargin) / 2))
                        _width = req.body.crop.width
                        _height = req.body.crop.height
                        
                    } else {                        
                        _left = req.body.position.x1
                        _top = req.body.position.y1
                        _width = Math.floor(req.body.position.x2 - req.body.position.x1)
                        _height = Math.floor(req.body.position.y2 - req.body.position.y1)
                        
                    }

                    await fs.checkPath(_filePath)
                    await fs.checkPath(path.dirname(_outputPath))
                    .catch(async () => {
                        await fs.mkdir(path.dirname(_outputPath))
                    })
                    
                    let _isdir = await fs.fs.lstatSync(_filePath).isDirectory()
                    if (!_isdir) { // 파일일 경우         
                        let {width, height} = await sharp(_filePath).metadata()               
                        
                        _left = _left + _width > width ? _left - ((_left + _width) - width) : _left
                        _top = _top + _height > height ? _top - ((_top + _height) - height) : _top
                        
                        _left = _left < 0 ? 0 : _left
                        _top = _top < 0 ? 0 : _top
                        
                        _new_file_info = await sharp(_filePath).extract({
                            left: _left,
                            top: _top,
                            width: _width,
                            height: _height
                        }).toFile(_outputPath)

                        req.body.save_file_info = _new_file_info

                    } else {
                        throw `Can't read image file. (${req.body.filePath})`
                    }
                    res.status(201).json(req.body)
                } catch (err) {
                    logger.error(err)
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.status(400).json(err.map(_err => _err.message))
                    } else {
                        res.status(400).json("pelase check crop size.")
                    }
                }
            }
        }
    }
)