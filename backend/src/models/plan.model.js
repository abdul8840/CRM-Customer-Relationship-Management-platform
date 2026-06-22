// plan.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Plan', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: D.STRING(100), allowNull: false },
  slug: { type: D.STRING(100), allowNull: false, unique: true },
  description: D.TEXT,
  price: { type: D.DECIMAL(10, 2), defaultValue: 0 },
  currency: { type: D.STRING(3), defaultValue: 'INR' },
  interval: { type: D.ENUM('month', 'year'), defaultValue: 'month' },
  trial_days: { type: D.INTEGER, defaultValue: 0 },
  features: D.JSON, limits: D.JSON,
  razorpay_plan_id: D.STRING(100),
  is_active: { type: D.BOOLEAN, defaultValue: true },
  sort_order: { type: D.INTEGER, defaultValue: 0 },
}, { tableName: 'subscription_plans' });