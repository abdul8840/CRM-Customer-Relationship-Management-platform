'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('leads', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: S.UUID, defaultValue: S.UUIDV4, unique: true },
      owner_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      assigned_to: { type: S.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      first_name: { type: S.STRING(100), allowNull: false },
      last_name: S.STRING(100),
      email: S.STRING(150), phone: S.STRING(20),
      company_name: S.STRING(200), job_title: S.STRING(100),
      source: { type: S.ENUM('website', 'referral', 'social', 'email', 'cold_call', 'event', 'ads', 'other'), defaultValue: 'other' },
      status: { type: S.ENUM('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'), defaultValue: 'new' },
      priority: { type: S.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
      estimated_value: S.DECIMAL(15, 2),
      score: { type: S.INTEGER, defaultValue: 0 },
      tags: S.JSON, notes: S.TEXT,
      converted_at: S.DATE, converted_deal_id: S.INTEGER,
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('leads', ['owner_id']);
    await qi.addIndex('leads', ['assigned_to']);
    await qi.addIndex('leads', ['status']);
    await qi.addIndex('leads', ['source']);
  },
  async down(qi) { await qi.dropTable('leads'); },
};