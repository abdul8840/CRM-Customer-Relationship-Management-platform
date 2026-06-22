'use strict';
module.exports = {
  async up(qi) {
    const now = new Date();
    await qi.bulkInsert('settings', [
      { key: 'company.name', value: JSON.stringify('CRM Platform'), is_public: true, created_at: now, updated_at: now },
      { key: 'company.email', value: JSON.stringify('hello@crm.local'), is_public: true, created_at: now, updated_at: now },
      { key: 'company.address', value: JSON.stringify(''), is_public: false, created_at: now, updated_at: now },
      { key: 'branding.primary_color', value: JSON.stringify('#1d4ed8'), is_public: true, created_at: now, updated_at: now },
      { key: 'branding.logo_url', value: JSON.stringify(''), is_public: true, created_at: now, updated_at: now },
      { key: 'crm.currency', value: JSON.stringify('INR'), is_public: true, created_at: now, updated_at: now },
      { key: 'crm.timezone', value: JSON.stringify('Asia/Kolkata'), is_public: true, created_at: now, updated_at: now },
    ]);
  },
  async down(qi) { await qi.bulkDelete('settings', null, {}); },
};