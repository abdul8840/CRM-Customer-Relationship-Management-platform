'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(qi) {
    const [rows] = await qi.sequelize.query("SELECT id FROM roles WHERE slug='super_admin' LIMIT 1");
    if (!rows[0]) return;
    const password = await bcrypt.hash('Admin@12345', 12);
    const now = new Date();
    await qi.bulkInsert('users', [{
      uuid: uuidv4(),
      first_name: 'Super', last_name: 'Admin',
      email: 'superadmin@crm.com',
      password, role_id: rows[0].id, status: 'active',
      email_verified_at: now, created_at: now, updated_at: now,
    }]);
  },
  async down(qi) { await qi.bulkDelete('users', { email: 'superadmin@crm.com' }, {}); },
};