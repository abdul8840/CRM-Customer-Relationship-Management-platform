'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('contacts', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: S.UUID, defaultValue: S.UUIDV4, unique: true },
      owner_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      company_id: { type: S.INTEGER, references: { model: 'companies', key: 'id' }, onDelete: 'SET NULL' },
      first_name: { type: S.STRING(100), allowNull: false },
      last_name: S.STRING(100),
      email: S.STRING(150), phone: S.STRING(20), mobile: S.STRING(20),
      job_title: S.STRING(100), department: S.STRING(100),
      address: S.STRING(255), city: S.STRING(100), state: S.STRING(100),
      country: S.STRING(100), zip: S.STRING(20),
      avatar_url: S.STRING(500), avatar_public_id: S.STRING(255),
      source: S.STRING(50), tags: S.JSON, notes: S.TEXT,
      status: { type: S.ENUM('active', 'inactive'), defaultValue: 'active' },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('contacts', ['owner_id']);
    await qi.addIndex('contacts', ['company_id']);
    await qi.addIndex('contacts', ['email']);
  },
  async down(qi) { await qi.dropTable('contacts'); },
};