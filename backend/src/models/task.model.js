const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Task', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  uuid: { type: D.UUID, defaultValue: D.UUIDV4 },
  owner_id: { type: D.INTEGER, allowNull: false },
  assigned_to: D.INTEGER,
  related_to_type: D.ENUM('lead', 'deal', 'contact', 'company'),
  related_to_id: D.INTEGER,
  title: { type: D.STRING(200), allowNull: false },
  description: D.TEXT,
  type: { type: D.ENUM('call', 'email', 'meeting', 'follow_up', 'other'), defaultValue: 'other' },
  status: { type: D.ENUM('pending', 'in_progress', 'completed', 'cancelled'), defaultValue: 'pending' },
  priority: { type: D.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  due_date: D.DATE, reminder_at: D.DATE, completed_at: D.DATE,
  is_recurring: { type: D.BOOLEAN, defaultValue: false },
  recurrence_pattern: D.STRING(50),
  reminder_sent: { type: D.BOOLEAN, defaultValue: false },
}, { tableName: 'tasks' });