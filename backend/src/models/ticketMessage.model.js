// ticketMessage.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('TicketMessage', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: D.INTEGER, allowNull: false },
  user_id: { type: D.INTEGER, allowNull: false },
  message: { type: D.TEXT, allowNull: false },
  attachments: D.JSON,
}, { tableName: 'ticket_messages', paranoid: false });