'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('refresh_tokens', {
      id: { type: S.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      token: { type: S.STRING(512), allowNull: false, unique: true },
      expires_at: { type: S.DATE, allowNull: false },
      revoked_at: S.DATE,
      ip_address: S.STRING(45),
      user_agent: S.STRING(500),
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addIndex('refresh_tokens', ['user_id']);
  },
  async down(qi) { await qi.dropTable('refresh_tokens'); },
};