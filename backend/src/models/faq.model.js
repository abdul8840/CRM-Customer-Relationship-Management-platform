// faq.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Faq', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  category: D.STRING(100),
  question: { type: D.STRING(500), allowNull: false },
  answer: { type: D.TEXT, allowNull: false },
  sort_order: { type: D.INTEGER, defaultValue: 0 },
  is_published: { type: D.BOOLEAN, defaultValue: true },
}, { tableName: 'faqs' });