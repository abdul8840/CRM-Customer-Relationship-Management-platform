'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('login_history', {
      id: { type: S.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      ip_address: S.STRING(45),
      user_agent: S.STRING(500),
      status: { type: S.ENUM('success', 'failed'), allowNull: false },
      reason: S.STRING(255),
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addIndex('login_history', ['user_id']);
  },
  async down(qi) { await qi.dropTable('login_history'); },
};