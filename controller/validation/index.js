'use strict'

/**
 * @module      controller/validation
 * @since       0.0.1
 * @desc        API request data에 대한 validation 체크를 하는 module<br/>
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
        fileSystem: {
            value: require('./fileSystem')
        }
    }
)