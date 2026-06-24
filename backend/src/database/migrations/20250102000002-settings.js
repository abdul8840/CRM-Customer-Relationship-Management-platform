await qi.bulkInsert('settings', [
  { setting_key: 'company.name', value: JSON.stringify('CRM Platform'), is_public: true, created_at: now, updated_at: now },
  { setting_key: 'company.email', value: JSON.stringify('hello@crm.local'), is_public: true, created_at: now, updated_at: now },
  { setting_key: 'company.address', value: JSON.stringify(''), is_public: false, created_at: now, updated_at: now },
  { setting_key: 'branding.primary_color', value: JSON.stringify('#1d4ed8'), is_public: true, created_at: now, updated_at: now },
  { setting_key: 'branding.logo_url', value: JSON.stringify(''), is_public: true, created_at: now, updated_at: now },
  { setting_key: 'crm.currency', value: JSON.stringify('INR'), is_public: true, created_at: now, updated_at: now },
  { setting_key: 'crm.timezone', value: JSON.stringify('Asia/Kolkata'), is_public: true, created_at: now, updated_at: now },
]);