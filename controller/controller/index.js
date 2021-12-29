'use strict'

/**
 * @module      controller/contoller
 * @since       0.0.1
 * @desc        API request에 대한 처리를 하는 module<br/>
 *              model로 요청을 전달하기 전에 처리되어야할 로직들을 수행<br/>
 *              각 서비스 별로 sub module을 만들어서 관리한다
 * @date        2020-01-02
*/

Object.defineProperties(
    exports,
    {
        vams: {
            value: require('./vams')
        },
        rdte: {
            value: require('./rdte')
        },
        sys: {
            value: require('./sys')
        },
        db: {
            value: require('./db')
        },
        utils: {
            value: require('./utils')
        },
        fileSystem: {
            value: require('./fileSystem')
        }
    }
)