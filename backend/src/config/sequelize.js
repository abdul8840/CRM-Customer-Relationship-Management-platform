require('dotenv').config();
const common = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: process.env.DB_DIALECT || 'mysql',
  define: { underscored: true, timestamps: true, paranoid: true },
};
module.exports = { development: common, test: common, production: { ...common, logging: false } };