'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('notes', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      related_to_type: { type: S.ENUM('lead', 'deal', 'contact', 'company'), allowNull: false },
      related_to_id: { type: S.INTEGER, allowNull: false },
      title: S.STRING(200), content: { type: S.TEXT, allowNull: false },
      pinned: { type: S.BOOLEAN, defaultValue: false },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('notes', ['related_to_type', 'related_to_id']);

    await qi.createTable('activities', {
      id: { type: S.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      related_to_type: S.STRING(50), related_to_id: S.INTEGER,
      type: { type: S.STRING(50), allowNull: false },
      title: { type: S.STRING(255), allowNull: false },
      description: S.TEXT, meta: S.JSON,
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addIndex('activities', ['related_to_type', 'related_to_id']);
    await qi.addIndex('activities', ['user_id']);

    await qi.createTable('attachments', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      related_to_type: { type: S.STRING(50) }, related_to_id: S.INTEGER,
      file_name: { type: S.STRING(255), allowNull: false },
      file_url: { type: S.STRING(500), allowNull: false },
      file_type: S.STRING(100), file_size: S.INTEGER,
      cloudinary_public_id: S.STRING(255),
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('attachments', ['related_to_type', 'related_to_id']);
  },
  async down(qi) {
    await qi.dropTable('attachments');
    await qi.dropTable('activities');
    await qi.dropTable('notes');
  },
};