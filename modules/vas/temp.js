'use strict'
const VASReport = require('./message'),
    VASError = require('./error')

const WORKER = (id, state, err) => {
    let _error

    switch (err) {        
        case 'SEARCH':
            _error = new VASError(err.code, 400, `[${err.code}] 작업을 찾을 수 없습니다. (ID: ${id})`)                        
            break;        
        case 'ERROR':
            _error = new VASError(err.code, 701, `[${err.code}] 프로세스가 비 정상 종료 되었습니다. (ID: ${id})`)
            break;
    }

    return new VASReport(id, state, _error)
}

const FILE = (id, state, req, path) => {
    let _error
    switch (req) {
        case 'FOUND':
            _error =  new VASError(req, 710, `파일을 찾을 수 없습니다. (${path})`)
            break;
        case 'READ':
            _error = new VASError(req, 711, `파일을 읽을 수 없습니다. (${path})`)
            break;
        case 'WRITE':
            _error = new VASError(req, 712, `파일을 생성하지 못했습니다. (${path})`)
            break;
        case 'REMOVE':
            _error = new VASError(req, 713, `파일을 제거하지 못했습니다. (${path})`)
            break;
    }

    return new VASReport(id, state, _error)
}

const FTP = (req, conf, id, state) => {
    let _error

    switch (req) {
        case 'CONNECT':
            _error = new VASError(req, 720, `FTP 연결에 실패 하였습니다. (${JSON.stringify(conf)})`)
            break;
        case 'DISCONNECT':
            _error = new VASError(req, 721, `FTP 연결 해제에 실패 하였습니다. (${JSON.stringify(conf)})`)
            break;
        case 'PUT':
            _error = new VASError(req, 722, `FTP 파일 전송에 실패 하였습니다. (${JSON.stringify(conf)})`)
            break;
    }

    return new VASReport(id, state, _error)
}

const REQUEST = (req, conf, id, state) => {
    let _error

    switch (req) {
        case 'NMS':
            _error = new VASError(req, 730, `NMS 전송에 실패 하였습니다. (${JSON.stringify(conf)})`)
            break;
        case 'AMOC':
            _error = new VASError(req, 731, `AMOC 전송에 실패 하였습니다. (${JSON.stringify(conf)})`)
            break;
    }

    return new VASReport(id, state, _error)
}

const LIBRARY = (req, conf) => {
    let _error

    switch (req) {
        case 20:
            _error = new VASError(req, 741, `Multicast를 수신 할 수 없습니다. 주소를 확인해 주세요. (${JSON.stringify(conf)})`)
            break;
        case 30:
            _error = new VASError(req, 741, `Multicast 수신 중 오류가 발생 하였습니다. 네트워크 상태를 확인 해 주세요. (${JSON.stringify(conf)})`)
            break;
    }

    return new VASReport(id, state, _error)
}

module.exports = {
    WORKER,
    FILE,
    FTP,
    REQUEST,
    LIBRARY
}