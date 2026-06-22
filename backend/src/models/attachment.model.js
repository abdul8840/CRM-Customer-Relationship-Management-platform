// attachment.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Attachment', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: D.INTEGER, allowNull: false },
  related_to_type: D.STRING(50), related_to_id: D.INTEGER,
  file_name: { type: D.STRING(255), allowNull: false },
  file_url: { type: D.STRING(500), allowNull: false },
  file_type: D.STRING(100), file_size: D.INTEGER,
  cloudinary_public_id: D.STRING(255),
}, { tableName: 'attachments' });