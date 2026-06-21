'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('audit_logs', {
      id: { type: S.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      action: { type: S.STRING(100), allowNull: false },
      entity: { type: S.STRING(100) },
      entity_id: { type: S.STRING(50) },
      meta: { type: S.JSON },
      ip_address: S.STRING(45),
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addIndex('audit_logs', ['user_id']);
    await qi.addIndex('audit_logs', ['entity', 'entity_id']);
  },
  async down(qi) { await qi.dropTable('audit_logs'); },
};