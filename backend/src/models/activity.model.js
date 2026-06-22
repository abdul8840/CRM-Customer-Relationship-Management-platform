// activity.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Activity', {
  id: { type: D.BIGINT, primaryKey: true, autoIncrement: true },
  user_id: D.INTEGER,
  related_to_type: D.STRING(50), related_to_id: D.INTEGER,
  type: { type: D.STRING(50), allowNull: false },
  title: { type: D.STRING(255), allowNull: false },
  description: D.TEXT, meta: D.JSON,
}, { tableName: 'activities', paranoid: false });