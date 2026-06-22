// announcement.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Announcement', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: D.STRING(255), allowNull: false },
  content: { type: D.TEXT, allowNull: false },
  type: { type: D.ENUM('info', 'success', 'warning', 'critical'), defaultValue: 'info' },
  audience: { type: D.ENUM('all', 'customers', 'admins'), defaultValue: 'all' },
  published_at: D.DATE, expires_at: D.DATE,
  is_active: { type: D.BOOLEAN, defaultValue: true },
}, { tableName: 'announcements' });