'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('otps', {
      id: { type: S.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      email: { type: S.STRING(150), allowNull: false },
      code: { type: S.STRING(10), allowNull: false },
      purpose: { type: S.ENUM('email_verify', 'password_reset', 'login_2fa'), allowNull: false },
      expires_at: { type: S.DATE, allowNull: false },
      consumed_at: S.DATE,
      attempts: { type: S.INTEGER, defaultValue: 0 },
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addIndex('otps', ['email', 'purpose']);
  },
  async down(qi) { await qi.dropTable('otps'); },
};