const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize(
  process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    define: { underscored: true, timestamps: true, paranoid: true },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

const connectDB = async () => {
  await sequelize.authenticate();
  logger.info('✅ MySQL connected');
};

module.exports = { sequelize, connectDB };