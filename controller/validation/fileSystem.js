'use strict'

const logger = require('@amuzlab/logger'),
    fs = require('@amuzlab/fs-promise').fileSystem,
    path = require('path')

Object.defineProperties(
    exports,
    {
        checkPath: {
            value: async (req, res, next) => {
                try {
                    await fs.checkPath(path.join(
                        process.env.RESOURCE_BASE_PATH,
                        req.query.path))

                    next()
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

// async function getDirs(dir){   
//     let _dirList = [] // 리턴 할 디렉토리 정보
//     return new Promise(async (resolve , reject) => {
//         try {
//             let _dirInfo = await fs.readdir(dir)
//             _dirList.push(_dirInfo)
//             await Promise.all(_dirInfo.files.map(_target => {
//                 return new Promise(async(resolve, reject) => {
//                     let _targetPath = path.join(_dirInfo.path, _target)                    
//                     try {                        
//                         let _isDir = await fs.fs.lstatSync(_targetPath).isDirectory()                        
//                         if(_isDir){
//                             let _tempDirs = await getDirs(_targetPath)                            
//                             _tempDirs.map(_tempDir => {
//                                 if(_tempDir.files.length == 0) {
//                                     _tempDirs.splice(_tempDirs.indexOf(_tempDir))
//                                 }
//                             })
//                             _dirList = _dirList.concat(_tempDirs)                                  
//                             resolve(true)
//                         }else {
//                             let _index = _dirInfo.files.indexOf(_target)
//                             _dirInfo.files.splice(_index,1)
//                             resolve(true)
//                         }                 
//                     }catch (err) {
//                         reject(err)
//                     }
//                 })                                  
//             }))           
//             console.error(_dirList)                     
//             resolve(_dirList)
//         }catch (err) {
//             console.error("에러", err)
//             reject(err)            
//         }
//     })         
// }
//await fs.fs.readdirSync(dir).map(name => path.join(dir, name)).filter(isDirectory(dir))      
// async function getDirectories(dir) {
//     return new Promise(async (resolve, reject)=>{
//         try{
//             let result = await fs.fs.readdirSync(dir).map(name => path.join(dir, name)).filter(async _path => await isDirectory(_path))  
//             result.map(async _path => console.error(await isDirectory(_path)))
//             console.error(result.filter(_path => isDirectory(_path)))
//             // result = result.filter(async _path => await isDirectory(_path))
//             resolve(result)
//         }catch (err){
//             reject(err)
//         }
//     })
// }
// async function isDirectory(dir) {
//     return await fs.fs.lstatSync(dir).isDirectory(dir)
// }