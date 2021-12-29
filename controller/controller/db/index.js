'use strict'

const Sequelize = require('../../../models')

Object.defineProperties(
    exports,
    {
        /* create(values: Object, options: Object) : 레코드 생성 함수이다.
        findOrCreate(options: Object): 조회 시 없으면 생성해주는 함수이다.
        findCreateFind(options: Object) : 조회 시 없으면 생성 후 조회하는 함수이다.
        upsert(values: Object, options: Object) : 한 레코드만 인서트하거나 업데이트 해주는 함수.
        -attributes : 조회할 칼럼을 정하는 옵션.
        -attributes안의 include : table없는 칼럼을 추가할 때 쓰는 옵션.
        -where : 조회할 칼럼의 조건문을 정하는 옵션.
        -include : foreignKey로 Outer Left Join하는 옵션.
        -order : 정렬 옵션.
        -limit : 조회하는 레코드의 개수를 정하는 옵션.
        -offset : 몇 번째부터 조회할지 정하는 옵션. */
        insert: {
            value: async (table, data) => {
                try {
                    if (await this.table(table)) { // 테이블이 있는지 조회
                        await Sequelize[table].create(data)
                    } else {
                        throw 'Table not Found.'
                    }
                } catch (err) {
                    throw err
                }
            }
        },
        /* findOne(options: Object) : 하나만 조회하는 함수이다. find()와 동일
                findAll(options: Object) : 여러 개를 조회하는 함수이다.
                findAndCountAll(findOptions: Object) : 조회 후 총 수까지 알 수 있다. 조회 객체.count로 접근
                findByPk(id: Number | String | Buffer, options: Object) : 프라이머리키로 조회하는 함수이다.
                findCreateFind(options: Object) : 조회 시 없으면 생성 후 조회하는 함수이다.
                findOrCreate(options: Object): 조회수 없으면 생성해주는 함수이다. */
        search: {
            /**
             * @brief 조회
             * @param {*} table 조회 할 테이블
             * @param {*} query 쿼리 내용
             * @returns 
             */
            value: async (table, query) => {                
                try {
                    if (await this.table(table)) {
                        return await Sequelize[table].findAll(query)
                    } else {
                        throw 'Table not Found.'
                    }
                } catch (err) {
                    throw err
                }
            }
        },
        /* 
        update(values: Object, options: Object) : 값을 업데이트 해주는 함수. 여러 레코드도 가능.
        upsert(values: Object, options: Object) : 한 레코드만 인서트하거나 업데이트해 주는 함수. */
        update: {
            value: async (table, set, query) => {
                try {
                    if (await this.table(table)) { // 테이블이 있는지 조회
                        (await Sequelize[table].findOne(query)).update(set)
                    } else {
                        throw 'Table not Found.'
                    }
                } catch (err) {
                    throw err
                }
            }
        },
        delete: {
            value: async (table, query) => {
                try {
                    if (await this.table(table)) { // 테이블이 있는지 조회
                        !query.hasOwnProperty('where') && (query.truncate = true)
                        return await Sequelize[table].destroy(query)
                    } else {
                        throw 'Table not Found.'
                    }
                } catch (err) {
                    throw err
                }
            }
        },
        table: {
            value: async (table) => {
                try {
                    let _tables = await Sequelize.sequelize.getQueryInterface().showAllSchemas()

                    if (table) { // 테이블 검색
                        return _tables.find(_index => _index[`Tables_in_${process.env.MYSQL_DATABASE}`] == table) //없는 경우 undefined
                    } else { // 테이블 리스트                        
                        return _tables.map(index => {
                            return index[`Tables_in_${process.env.MYSQL_DATABASE}`]
                        })
                    }
                } catch (err) {
                    return err
                }
            }
        },
        connection: {
            value: async () => {
                try {
                    await Sequelize.sequelize.authenticate()
                    return `Connection has been established successfully.`
                } catch (err) {
                    return `Unable to connect to the database : ${err} `
                }
            }
        },
        query: {
            value: async (crud, query) => {
                try {
                    return await Sequelize.sequelize.query( // 쿼리 실행
                        query, // 쿼리문
                        {
                            type: require('sequelize').QueryTypes[crud] // 필수
                        })
                } catch (err) {
                    return err
                }
            }
        }
    }
)