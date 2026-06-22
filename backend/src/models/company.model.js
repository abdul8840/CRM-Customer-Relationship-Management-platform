const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Company', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  uuid: { type: D.UUID, defaultValue: D.UUIDV4 },
  owner_id: { type: D.INTEGER, allowNull: false },
  name: { type: D.STRING(200), allowNull: false },
  website: D.STRING(255), industry: D.STRING(100),
  size: D.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
  annual_revenue: D.DECIMAL(15, 2),
  phone: D.STRING(20), email: D.STRING(150),
  address: D.STRING(255), city: D.STRING(100), state: D.STRING(100),
  country: D.STRING(100), zip: D.STRING(20),
  logo_url: D.STRING(500), logo_public_id: D.STRING(255),
  description: D.TEXT, tags: D.JSON,
  status: { type: D.ENUM('active', 'inactive'), defaultValue: 'active' },
}, { tableName: 'companies' });