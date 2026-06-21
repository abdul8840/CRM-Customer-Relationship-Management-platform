const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Permission', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  module: { type: DataTypes.STRING(50), allowNull: false },
}, { tableName: 'permissions' });