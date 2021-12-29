'use strict'

const logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    path = require('path'),
    ps = require('@amuzlab/process'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn

Object.defineProperties(
    exports,
    {
        thumbnail: {
            value: async (req, res, next) => {
                try {
                    let _filePath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.body.filePath
                    ), _outputFilePath = path.join(
                        process.env.RESOURCE_BASE_PATH,
                        path.join(path.dirname(req.body.filePath).split('content')[0]),
                        'Thumbnail'
                    ),_outputFileName = `${req.body.startTimeStamp.split(':')[0]}_${req.body.startTimeStamp.split(':')[1]}_${req.body.startTimeStamp.split(':')[2]}.jpg` 
                    //영상 체크
                    await fs.checkPath(_filePath)
                    //디렉토리 생성
                    fs.checkPath(_outputFilePath)
                        .catch(async (err) => {
                            await fs.mkdir(_outputFilePath)
                        })
                    //command 생성 및 실행

                    /* spawn으로 실행
                    let _command = 'ffmpeg',
                        _args = [
                            '-ss', req.body.startTimeStamp,
                            '-i', _filePath,
                            '-an',
                            '-r', '1',
                            '-vframes', '1',
                            path.join(_outputFilePath,_outputFileName)
                        ],
                        proc = spawn(_command, _args)
                    proc.stdout.on('data', data => {
                        console.log(`proc log => ${data}`)
                    })

                    proc.stderr.setEncoding("utf8")
                    proc.stderr.on('data', err => {
                        console.warn(`proc warn log => ${err}`)
                    })

                    proc.on('close', function () {
                        console.log('proc finished')
                    })*/
                    
                    /* exec로 실행
                    exec(`ffmpeg -ss ${req.body.startTimeStamp} -i ${_filePath} -an -r 1 -vframes 1 ${path.join(_outputFilePath,_outputFileName)}`, function(error, stdout, stderr){
                        console.log(stdout)
                        console.log(stderr)
                        if(error != null){
                            console.error('exec error => ', error)
                        }
                    })*/

                    // amuzlab process로 실행
                    let _command = 'ffmpeg',
                        _args = [
                            '-ss', req.body.startTimeStamp,
                            '-i', _filePath,
                            '-an',
                            '-r', '1',
                            '-vframes', '1',
                            path.join(_outputFilePath,_outputFileName)
                        ]
                    let _process = new ps.Process(_command,{
                        env: process.env,
                        retryCnt: 0,
                        timeout : 1000
                    })              
                    _process.args = _args      
                    _process.exec()

                    res.status(201).send(path.join(
                        path.join(path.dirname(req.body.filePath).split('content')[0]),
                        'Thumbnail',
                        _outputFileName
                    ))
                } catch (err) {
                    logger.error(err)
                    if (Array.isArray(err)) {
                        logger.error(err.map(_err => _err.message))
                        res.status(400).json(err.map(_err => _err.message))
                    } else {
                        res.status(400).json(err)
                    }
                }
            }
        }
    }
)