'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('deals', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: S.UUID, defaultValue: S.UUIDV4, unique: true },
      owner_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      assigned_to: { type: S.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      company_id: { type: S.INTEGER, references: { model: 'companies', key: 'id' }, onDelete: 'SET NULL' },
      contact_id: { type: S.INTEGER, references: { model: 'contacts', key: 'id' }, onDelete: 'SET NULL' },
      lead_id: { type: S.INTEGER, references: { model: 'leads', key: 'id' }, onDelete: 'SET NULL' },
      title: { type: S.STRING(200), allowNull: false },
      description: S.TEXT,
      value: { type: S.DECIMAL(15, 2), defaultValue: 0 },
      currency: { type: S.STRING(3), defaultValue: 'INR' },
      stage: { type: S.ENUM('lead', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'), defaultValue: 'lead' },
      stage_order: { type: S.INTEGER, defaultValue: 0 },
      probability: { type: S.INTEGER, defaultValue: 10 },
      expected_close_date: S.DATEONLY, actual_close_date: S.DATEONLY,
      lost_reason: S.STRING(255),
      tags: S.JSON,
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('deals', ['owner_id']);
    await qi.addIndex('deals', ['stage']);
    await qi.addIndex('deals', ['assigned_to']);
  },
  async down(qi) { await qi.dropTable('deals'); },
};