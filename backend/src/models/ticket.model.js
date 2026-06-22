// ticket.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Ticket', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_number: { type: D.STRING(20), allowNull: false, unique: true },
  user_id: { type: D.INTEGER, allowNull: false },
  assigned_to: D.INTEGER,
  subject: { type: D.STRING(255), allowNull: false },
  description: { type: D.TEXT, allowNull: false },
  category: D.STRING(50),
  priority: { type: D.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  status: { type: D.ENUM('open', 'in_progress', 'resolved', 'closed'), defaultValue: 'open' },
  closed_at: D.DATE,
}, { tableName: 'tickets' });