// note.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Note', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: D.INTEGER, allowNull: false },
  related_to_type: { type: D.ENUM('lead', 'deal', 'contact', 'company'), allowNull: false },
  related_to_id: { type: D.INTEGER, allowNull: false },
  title: D.STRING(200), content: { type: D.TEXT, allowNull: false },
  pinned: { type: D.BOOLEAN, defaultValue: false },
}, { tableName: 'notes' });