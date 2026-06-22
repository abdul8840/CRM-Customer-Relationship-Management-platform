'use strict';
module.exports = {
  async up(qi, S) {
    await qi.createTable('tasks', {
      id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
      uuid: { type: S.UUID, defaultValue: S.UUIDV4, unique: true },
      owner_id: { type: S.INTEGER, allowNull: false, references: { model: 'users', key: 'id' } },
      assigned_to: { type: S.INTEGER, references: { model: 'users', key: 'id' }, onDelete: 'SET NULL' },
      related_to_type: S.ENUM('lead', 'deal', 'contact', 'company'),
      related_to_id: S.INTEGER,
      title: { type: S.STRING(200), allowNull: false },
      description: S.TEXT,
      type: { type: S.ENUM('call', 'email', 'meeting', 'follow_up', 'other'), defaultValue: 'other' },
      status: { type: S.ENUM('pending', 'in_progress', 'completed', 'cancelled'), defaultValue: 'pending' },
      priority: { type: S.ENUM('low', 'medium', 'high', 'urgent'), defaultValue: 'medium' },
      due_date: S.DATE, reminder_at: S.DATE, completed_at: S.DATE,
      is_recurring: { type: S.BOOLEAN, defaultValue: false },
      recurrence_pattern: S.STRING(50),
      reminder_sent: { type: S.BOOLEAN, defaultValue: false },
      created_at: S.DATE, updated_at: S.DATE, deleted_at: S.DATE,
    });
    await qi.addIndex('tasks', ['owner_id']);
    await qi.addIndex('tasks', ['assigned_to']);
    await qi.addIndex('tasks', ['status']);
    await qi.addIndex('tasks', ['due_date']);
    await qi.addIndex('tasks', ['related_to_type', 'related_to_id']);
  },
  async down(qi) { await qi.dropTable('tasks'); },
};