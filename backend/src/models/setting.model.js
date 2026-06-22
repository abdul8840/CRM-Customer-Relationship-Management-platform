// setting.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Setting', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: D.STRING(100), allowNull: false, unique: true, field: 'key' },
  value: D.JSON,
  description: D.STRING(255),
  is_public: { type: D.BOOLEAN, defaultValue: false },
}, { tableName: 'settings', paranoid: false });