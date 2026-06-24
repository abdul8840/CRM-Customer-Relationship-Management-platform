await qi.createTable('settings', {
  id: { type: S.INTEGER, primaryKey: true, autoIncrement: true },
  setting_key: { type: S.STRING(100), allowNull: false, unique: true },
  value: S.JSON,
  description: S.STRING(255),
  is_public: { type: S.BOOLEAN, defaultValue: false },
  created_at: S.DATE, updated_at: S.DATE,
});
await qi.addIndex('settings', ['setting_key']);