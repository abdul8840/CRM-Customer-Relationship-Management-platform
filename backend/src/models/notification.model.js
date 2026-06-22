// notification.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Notification', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: { type: D.INTEGER, allowNull: false },
  type: { type: D.STRING(50), allowNull: false },
  title: { type: D.STRING(255), allowNull: false },
  message: D.TEXT, data: D.JSON, read_at: D.DATE,
}, { tableName: 'notifications', paranoid: false });