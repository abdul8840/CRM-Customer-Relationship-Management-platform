const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Deal', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  uuid: { type: D.UUID, defaultValue: D.UUIDV4 },
  owner_id: { type: D.INTEGER, allowNull: false },
  assigned_to: D.INTEGER, company_id: D.INTEGER, contact_id: D.INTEGER, lead_id: D.INTEGER,
  title: { type: D.STRING(200), allowNull: false },
  description: D.TEXT,
  value: { type: D.DECIMAL(15, 2), defaultValue: 0 },
  currency: { type: D.STRING(3), defaultValue: 'INR' },
  stage: { type: D.ENUM('lead', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'), defaultValue: 'lead' },
  stage_order: { type: D.INTEGER, defaultValue: 0 },
  probability: { type: D.INTEGER, defaultValue: 10 },
  expected_close_date: D.DATEONLY, actual_close_date: D.DATEONLY,
  lost_reason: D.STRING(255), tags: D.JSON,
}, { tableName: 'deals' });