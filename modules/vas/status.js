'use strict'

const ERROR_CODE = Object.create(
    null,
    {
        PROCESS: {
            enumerable: true,
            value: 400
        },
        FTP: {
            enumerable: true,
            value: 720
        },
        AMOC: {
            enumerable: true,
            value: 730
        },
        LIBRARY: {
            enumerable: true,
            value: 740
        },
        FILE: {
            enumerable: true,
            value: 750
        }
    }
)

Object.defineProperties(
    exports,
    {
        ERROR_CODE: {
            enumerable: true,
            value: ERROR_CODE
        },
        getErrorStatus: {
            enumerable: true,
            value: (err, targetId) => {                
                let _status = {
                    code: ERROR_CODE[err.errno] !== undefined ? ERROR_CODE[err.errno] :  err.code,
                    message: err.message,
                    detail: err,
                    targetId: targetId,
                    recoveryFlag: false
                }
                                
                switch (err.errno) {
                    case 'PROCESS':
                        //_status.message = `작업이 비 정상적으로 종료 되었습니다.`
                        break;

                    case 'FTP':      
                        if(_status.message !== undefined) {
                            _status.message = `[FTP] ${err.message} (FTP ID : ${targetId})`
                        } else {
                            _status.message = `[FTP] 데이터 전송에 실패 하였습니다. (FTP ID : ${targetId})`
                        }                        
                        break;
                        
                    case 'AMOC':
                        if(_status.message !== undefined) {
                            _status.message = `[AMOC] ${err.message} (AMOC ID : ${targetId})`
                        } else {
                            _status.message = `[AMOC] 데이터 전송에 실패 하였습니다. (AMOC ID : ${targetId})`
                        }
                        break;

                    case 'LIBRARY':
                        switch(err.code){
                            case 20:
                                _status.message = `Multicast를 수신 할 수 없습니다. 주소를 확인해 주세요.`
                                break;
                            case 30:
                                _status.message = `Multicast 수신 중 오류가 발생 하였습니다. 네트워크 상태를 확인 해 주세요.`
                                break;
                        }                        
                }
                return _status
            }
        },
        getRecoveryStatus: {
            enumerable: true,
            value: (errno, targetId) => {                
                let _status = {
                    code: ERROR_CODE[errno],                    
                    recoveryFlag : true                    
                }
                if(targetId !== undefined){
                    _status.targetId= targetId
                }
                switch(errno) {
                    case 'PROCESS':
                        _status.message = `프로세스가 복구 되었습니다.`
                    case 'FTP':      
                        _status.message = `FTP 오류가 복구 되었습니다. (FTP ID: ${targetId})`
                        break;
                    case 'AMOC':
                        _status.message = `AMOC 오류가 복구 되었습니다. (AMOC ID : ${targetId})`                        
                    case 'LIBRARY':
                        _status.message = `작업 프로세스 오류가 복구 되었습니다.`                           
                }
                return _status
            }
        }
    })
