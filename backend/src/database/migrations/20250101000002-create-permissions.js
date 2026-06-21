'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('permissions', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: S.STRING(100), allowNull: false, unique: true },
      slug: { type: S.STRING(100), allowNull: false, unique: true },
      module: { type: S.STRING(50), allowNull: false },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });

    await qi.createTable('role_permissions', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      role_id: { type: S.INTEGER, allowNull: false, references: { model: 'roles', key: 'id' }, onDelete: 'CASCADE' },
      permission_id: { type: S.INTEGER, allowNull: false, references: { model: 'permissions', key: 'id' }, onDelete: 'CASCADE' },
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addConstraint('role_permissions', { fields: ['role_id', 'permission_id'], type: 'unique', name: 'uniq_role_perm' });
  },
  async down(qi) { await qi.dropTable('role_permissions'); await qi.dropTable('permissions'); },
};