const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Contact', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  uuid: { type: D.UUID, defaultValue: D.UUIDV4 },
  owner_id: { type: D.INTEGER, allowNull: false },
  company_id: D.INTEGER,
  first_name: { type: D.STRING(100), allowNull: false },
  last_name: D.STRING(100),
  email: D.STRING(150), phone: D.STRING(20), mobile: D.STRING(20),
  job_title: D.STRING(100), department: D.STRING(100),
  address: D.STRING(255), city: D.STRING(100), state: D.STRING(100),
  country: D.STRING(100), zip: D.STRING(20),
  avatar_url: D.STRING(500), avatar_public_id: D.STRING(255),
  source: D.STRING(50), tags: D.JSON, notes: D.TEXT,
  status: { type: D.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'contacts' });