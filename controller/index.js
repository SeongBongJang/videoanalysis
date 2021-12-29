'use strict'

/**
 * @module      controller
 * @since       0.0.1
 * @desc        서버의 contoller module<br/>
 *              외부로부터의 요청을 처리하는 module<br/>
 *              request data에 대한 validation 체크 및 model로 요청이 전달되기 전에 처리해야할 로직들을 수행한다
 * @date        2020-01-02
*/
Object.defineProperties(
    exports,
    {
        /**
         * @since       0.0.1
         * @date        2020-01-02
         * @constant
         * @static
         * @public
         * @desc        API request에 대한 처리를 하는 module<br/>
         *              model로 요청을 전달하기 전에 처리되어야할 로직들을 수행<br/>
         *              각 서비스 별로 sub module을 만들어서 관리한다
         * @type        {controller/controller}
        */
        controller: {
            enumerable: true,
            value: require('./controller')
        },
        /**
         * @since       0.0.1
         * @date        2020-01-02
         * @constant
         * @static
         * @public
         * @desc        API request data에 대한 validation 체크를 하는 module<br/>
         *              각 서비스 별로 sub module을 만들어서 관리한다
         * @type        {controller/validation}
        */
        validation: {
            enumerable: true,
            value: require('./validation')
        }
    })
