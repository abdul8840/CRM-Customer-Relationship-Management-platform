'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('users', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: S.UUID, allowNull: false, unique: true, defaultValue: S.UUIDV4 },
      first_name: { type: S.STRING(100), allowNull: false },
      last_name: { type: S.STRING(100) },
      email: { type: S.STRING(150), allowNull: false, unique: true },
      phone: { type: S.STRING(20) },
      password: { type: S.STRING(255), allowNull: false },
      avatar_url: { type: S.STRING(500) },
      role_id: { type: S.INTEGER, allowNull: false, references: { model: 'roles', key: 'id' } },
      status: { type: S.ENUM('active', 'inactive', 'suspended', 'pending'), defaultValue: 'pending' },
      email_verified_at: S.DATE,
      last_login_at: S.DATE,
      created_by: { type: S.INTEGER, references: { model: 'users', key: 'id' } },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('users', ['email']);
    await qi.addIndex('users', ['role_id']);
    await qi.addIndex('users', ['status']);
  },
  async down(qi) { await qi.dropTable('users'); },
};