// invoice.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Invoice', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  invoice_number: { type: D.STRING(50), allowNull: false, unique: true },
  user_id: { type: D.INTEGER, allowNull: false },
  subscription_id: D.INTEGER,
  amount: { type: D.DECIMAL(10, 2), allowNull: false },
  tax: { type: D.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: D.DECIMAL(10, 2), allowNull: false },
  currency: { type: D.STRING(3), defaultValue: 'INR' },
  status: { type: D.ENUM('draft', 'pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
  due_date: D.DATEONLY, paid_at: D.DATE,
  razorpay_invoice_id: D.STRING(100), pdf_url: D.STRING(500),
}, { tableName: 'invoices' });