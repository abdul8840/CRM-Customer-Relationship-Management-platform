const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Otp', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.INTEGER,
  email: { type: DataTypes.STRING(150), allowNull: false },
  code: { type: DataTypes.STRING(10), allowNull: false },
  purpose: { type: DataTypes.ENUM('email_verify', 'password_reset', 'login_2fa'), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  consumed_at: DataTypes.DATE,
  attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'otps', paranoid: false });