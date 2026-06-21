const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('LoginHistory', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  ip_address: DataTypes.STRING(45),
  user_agent: DataTypes.STRING(500),
  status: { type: DataTypes.ENUM('success', 'failed'), allowNull: false },
  reason: DataTypes.STRING(255),
}, { tableName: 'login_history', paranoid: false });