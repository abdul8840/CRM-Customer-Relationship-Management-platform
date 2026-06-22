'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('subscription_plans', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: S.STRING(100), allowNull: false },
      slug: { type: S.STRING(100), allowNull: false, unique: true },
      description: S.TEXT,
      price: { type: S.DECIMAL(10, 2), defaultValue: 0 },
      currency: { type: S.STRING(3), defaultValue: 'INR' },
      interval: { type: S.ENUM('month', 'year'), defaultValue: 'month' },
      trial_days: { type: S.INTEGER, defaultValue: 0 },
      features: S.JSON, limits: S.JSON,
      razorpay_plan_id: S.STRING(100),
      is_active: { type: S.BOOLEAN, defaultValue: true },
      sort_order: { type: S.INTEGER, defaultValue: 0 },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });

    await qi.createTable('subscriptions', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: S.UUID, defaultValue: S.UUIDV4, unique: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      plan_id: { type: S.INTEGER, allowNull: false, references: { model: 'subscription_plans', key: 'id' } },
      status: { type: S.ENUM('trial', 'active', 'past_due', 'canceled', 'expired'), defaultValue: 'trial' },
      razorpay_subscription_id: S.STRING(100),
      razorpay_customer_id: S.STRING(100),
      current_period_start: S.DATE, current_period_end: S.DATE,
      trial_ends_at: S.DATE, canceled_at: S.DATE,
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('subscriptions', ['user_id']);

    await qi.createTable('invoices', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      invoice_number: { type: S.STRING(50), allowNull: false, unique: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      subscription_id: { type: S.INTEGER, references: { model: 'subscriptions', key: 'id' }, onDelete: 'SET NULL' },
      amount: { type: S.DECIMAL(10, 2), allowNull: false },
      tax: { type: S.DECIMAL(10, 2), defaultValue: 0 },
      total: { type: S.DECIMAL(10, 2), allowNull: false },
      currency: { type: S.STRING(3), defaultValue: 'INR' },
      status: { type: S.ENUM('draft', 'pending', 'paid', 'failed', 'refunded'), defaultValue: 'pending' },
      due_date: S.DATEONLY, paid_at: S.DATE,
      razorpay_invoice_id: S.STRING(100),
      pdf_url: S.STRING(500),
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('invoices', ['user_id']);

    await qi.createTable('payments', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      invoice_id: { type: S.INTEGER, references: { model: 'invoices', key: 'id' }, onDelete: 'SET NULL' },
      subscription_id: { type: S.INTEGER, references: { model: 'subscriptions', key: 'id' }, onDelete: 'SET NULL' },
      razorpay_payment_id: S.STRING(100),
      razorpay_order_id: S.STRING(100),
      razorpay_signature: S.STRING(255),
      amount: { type: S.DECIMAL(10, 2), allowNull: false },
      currency: { type: S.STRING(3), defaultValue: 'INR' },
      status: { type: S.ENUM('created', 'authorized', 'captured', 'failed', 'refunded'), defaultValue: 'created' },
      method: S.STRING(50), meta: S.JSON,
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addIndex('payments', ['user_id']);
  },
  async down(qi) {
    await qi.dropTable('payments');
    await qi.dropTable('invoices');
    await qi.dropTable('subscriptions');
    await qi.dropTable('subscription_plans');
  },
};