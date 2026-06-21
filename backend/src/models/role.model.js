const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  description: DataTypes.STRING(255),
  is_system: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'roles' });