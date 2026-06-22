const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Lead', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  uuid: { type: D.UUID, defaultValue: D.UUIDV4 },
  owner_id: { type: D.INTEGER, allowNull: false },
  assigned_to: D.INTEGER,
  first_name: { type: D.STRING(100), allowNull: false },
  last_name: D.STRING(100),
  email: D.STRING(150), phone: D.STRING(20),
  company_name: D.STRING(200), job_title: D.STRING(100),
  source: { type: D.ENUM('website', 'referral', 'social', 'email', 'cold_call', 'event', 'ads', 'other'), defaultValue: 'other' },
  status: { type: D.ENUM('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'), defaultValue: 'new' },
  priority: { type: D.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
  estimated_value: D.DECIMAL(15, 2),
  score: { type: D.INTEGER, defaultValue: 0 },
  tags: D.JSON, notes: D.TEXT,
  converted_at: D.DATE, converted_deal_id: D.INTEGER,
}, { tableName: 'leads' });