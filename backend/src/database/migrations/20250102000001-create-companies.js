'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('companies', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: S.UUID, defaultValue: S.UUIDV4, unique: true },
      owner_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name: { type: S.STRING(200), allowNull: false },
      website: S.STRING(255),
      industry: S.STRING(100),
      size: S.ENUM('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'),
      annual_revenue: S.DECIMAL(15, 2),
      phone: S.STRING(20),
      email: S.STRING(150),
      address: S.STRING(255), city: S.STRING(100), state: S.STRING(100),
      country: S.STRING(100), zip: S.STRING(20),
      logo_url: S.STRING(500), logo_public_id: S.STRING(255),
      description: S.TEXT, tags: S.JSON,
      status: { type: S.ENUM('active', 'inactive'), defaultValue: 'active' },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('companies', ['owner_id']);
    await qi.addIndex('companies', ['name']);
  },
  async down(qi) { await qi.dropTable('companies'); },
};