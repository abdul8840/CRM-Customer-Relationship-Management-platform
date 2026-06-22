'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('notifications', {
      id: { type: S.BIGINT, primaryKey: true, autoIncrement: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type: { type: S.STRING(50), allowNull: false },
      title: { type: S.STRING(255), allowNull: false },
      message: S.TEXT, data: S.JSON,
      read_at: S.DATE,
      created_at: S.DATE, updated_at: S.DATE,
    });
    await qi.addIndex('notifications', ['user_id', 'read_at']);

    await qi.createTable('tickets', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      ticket_number: { type: S.STRING(20), allowNull: false, unique: true },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      assigned_to: { type: S.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      subject: { type: S.STRING(255), allowNull: false },
      description: { type: S.TEXT, allowNull: false },
      category: S.STRING(50),
      priority: { type: S.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
      status: { type: S.ENUM('open', 'in_progress', 'resolved', 'closed'), defaultValue: 'open' },
      closed_at: S.DATE,
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });

    await qi.createTable('ticket_messages', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      ticket_id: { type: S.INTEGER, allowNull: false, references: { model: 'tickets', key: 'id' }, onDelete: 'CASCADE' },
      user_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      message: { type: S.TEXT, allowNull: false },
      attachments: S.JSON,
      created_at: S.DATE, updated_at: S.DATE,
    });

    await qi.createTable('faqs', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      category: S.STRING(100),
      question: { type: S.STRING(500), allowNull: false },
      answer: { type: S.TEXT, allowNull: false },
      sort_order: { type: S.INTEGER, defaultValue: 0 },
      is_published: { type: S.BOOLEAN, defaultValue: true },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });

    await qi.createTable('announcements', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: S.STRING(255), allowNull: false },
      content: { type: S.TEXT, allowNull: false },
      type: { type: S.ENUM('info', 'success', 'warning', 'critical'), defaultValue: 'info' },
      audience: { type: S.ENUM('all', 'customers', 'admins'), defaultValue: 'all' },
      published_at: S.DATE, expires_at: S.DATE,
      is_active: { type: S.BOOLEAN, defaultValue: true },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });

    await qi.createTable('settings', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      key: { type: S.STRING(100), allowNull: false, unique: true },
      value: S.JSON,
      description: S.STRING(255),
      is_public: { type: S.BOOLEAN, defaultValue: false },
      created_at: S.DATE, updated_at: S.DATE,
    });
  },
  async down(qi) {
    await qi.dropTable('settings');
    await qi.dropTable('announcements');
    await qi.dropTable('faqs');
    await qi.dropTable('ticket_messages');
    await qi.dropTable('tickets');
    await qi.dropTable('notifications');
  },
};