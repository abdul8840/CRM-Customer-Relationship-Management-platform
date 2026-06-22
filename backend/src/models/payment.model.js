// payment.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Payment', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: D.INTEGER, allowNull: false },
  invoice_id: D.INTEGER, subscription_id: D.INTEGER,
  razorpay_payment_id: D.STRING(100),
  razorpay_order_id: D.STRING(100),
  razorpay_signature: D.STRING(255),
  amount: { type: D.DECIMAL(10, 2), allowNull: false },
  currency: { type: D.STRING(3), defaultValue: 'INR' },
  status: { type: D.ENUM('created', 'authorized', 'captured', 'failed', 'refunded'), defaultValue: 'created' },
  method: D.STRING(50), meta: D.JSON,
}, { tableName: 'payments', paranoid: false });