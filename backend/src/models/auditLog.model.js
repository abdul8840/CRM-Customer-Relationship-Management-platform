const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('AuditLog', {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: DataTypes.INTEGER,
  action: { type: DataTypes.STRING(100), allowNull: false },
  entity: DataTypes.STRING(100),
  entity_id: DataTypes.STRING(50),
  meta: DataTypes.JSON,
  ip_address: DataTypes.STRING(45),
}, { tableName: 'audit_logs', paranoid: false });