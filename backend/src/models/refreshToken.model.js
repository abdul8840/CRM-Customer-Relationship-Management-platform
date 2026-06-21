const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('RefreshToken', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  token: { type: DataTypes.STRING(512), allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked_at: DataTypes.DATE,
  ip_address: DataTypes.STRING(45),
  user_agent: DataTypes.STRING(500),
}, { tableName: 'refresh_tokens', paranoid: false });