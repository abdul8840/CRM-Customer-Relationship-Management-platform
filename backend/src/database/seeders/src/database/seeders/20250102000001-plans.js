'use strict';
module.exports = {
  async up(qi) {
    const now = new Date();
    await qi.bulkInsert('subscription_plans', [
      { name: 'Free', slug: 'free', description: 'Free forever', price: 0, currency: 'INR', interval: 'month', trial_days: 0,
        features: JSON.stringify(['100 leads', '50 contacts', '20 deals', 'Email support']),
        limits: JSON.stringify({ leads: 100, contacts: 50, deals: 20, users: 1 }),
        is_active: true, sort_order: 1, created_at: now, updated_at: now },
      { name: 'Starter', slug: 'starter', description: 'For small teams', price: 999, currency: 'INR', interval: 'month', trial_days: 7,
        features: JSON.stringify(['1,000 leads', '500 contacts', 'Unlimited deals', 'Email + chat support']),
        limits: JSON.stringify({ leads: 1000, contacts: 500, deals: -1, users: 5 }),
        is_active: true, sort_order: 2, created_at: now, updated_at: now },
      { name: 'Professional', slug: 'professional', description: 'For growing businesses', price: 2999, currency: 'INR', interval: 'month', trial_days: 14,
        features: JSON.stringify(['Unlimited everything', 'Advanced analytics', 'API access', 'Priority support']),
        limits: JSON.stringify({ leads: -1, contacts: -1, deals: -1, users: 25 }),
        is_active: true, sort_order: 3, created_at: now, updated_at: now },
      { name: 'Enterprise', slug: 'enterprise', description: 'Custom enterprise plan', price: 9999, currency: 'INR', interval: 'month', trial_days: 30,
        features: JSON.stringify(['Everything in Professional', 'SSO/SAML', 'Dedicated CSM', 'Custom integrations']),
        limits: JSON.stringify({ leads: -1, contacts: -1, deals: -1, users: -1 }),
        is_active: true, sort_order: 4, created_at: now, updated_at: now },
    ]);
  },
  async down(qi) { await qi.bulkDelete('subscription_plans', null, {}); },
};