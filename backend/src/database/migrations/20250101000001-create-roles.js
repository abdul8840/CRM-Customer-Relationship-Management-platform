'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('roles', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: S.STRING(50), allowNull: false, unique: true },
      slug: { type: S.STRING(50), allowNull: false, unique: true },
      description: { type: S.STRING(255) },
      is_system: { type: S.BOOLEAN, defaultValue: false },
      created_at: { type: S.DATE, allowNull: false },
      updated_at: { type: S.DATE, allowNull: false },
      deleted_at: { type: S.DATE },
    });
    await qi.addIndex('roles', ['slug']);
  },
  async down(qi) { await qi.dropTable('roles'); },
};