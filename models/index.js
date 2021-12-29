'use strict';

const logger = require('@amuzlab/logger'),
  fs = require('fs'),
  path = require('path'),
  Sequelize = require('sequelize'),
  basename = path.basename(__filename),
  db = {};

let sequelize,
  reconnOption = { // 재연결 옵션
    max_retries: 999,
    onRetry: (count) => {
      logger.log(`connection lost, trying to reconnect ${count}`)
    }
  },
  option = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT ? process.env.DB_DIALECT : "mysql",
    logging: logger.info,
    reconnect: reconnOption || true,
    define: {
      freezeTableName: true,
      timestamps: false
    }
  }

sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  option
);

// 모델 정보 읽어오기
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// 모델 관계 통합
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 모델 추가
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
