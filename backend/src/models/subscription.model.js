// subscription.model.js
const { DataTypes: D } = require('sequelize');
module.exports = (s) => s.define('Subscription', {
  id: { type: D.INTEGER, primaryKey: true, autoIncrement: true },
  uuid: { type: D.UUID, defaultValue: D.UUIDV4 },
  user_id: { type: D.INTEGER, allowNull: false },
  plan_id: { type: D.INTEGER, allowNull: false },
  status: { type: D.ENUM('trial', 'active', 'past_due', 'canceled', 'expired'), defaultValue: 'trial' },
  razorpay_subscription_id: D.STRING(100),
  razorpay_customer_id: D.STRING(100),
  current_period_start: D.DATE, current_period_end: D.DATE,
  trial_ends_at: D.DATE, canceled_at: D.DATE,
}, { tableName: 'subscriptions' });