'use strict';
module.exports = {
  async up(qi, S) {
    await qi.addConstraint('users', {
      fields: ['created_by'], type: 'foreign key', name: 'fk_users_created_by',
      references: { table: 'users', field: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE',
    });
  },
  async down(qi) { await qi.removeConstraint('users', 'fk_users_created_by'); },
};