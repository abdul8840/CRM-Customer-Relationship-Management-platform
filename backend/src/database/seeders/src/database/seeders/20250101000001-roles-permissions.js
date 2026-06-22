'use strict';
module.exports = {
  async up(qi) {
    const now = new Date();
    const roles = [
      { name: 'Super Admin', slug: 'super_admin', description: 'Full system access', is_system: true, created_at: now, updated_at: now },
      { name: 'Admin', slug: 'admin', description: 'Tenant admin', is_system: true, created_at: now, updated_at: now },
      { name: 'Manager', slug: 'manager', description: 'Team manager', is_system: true, created_at: now, updated_at: now },
      { name: 'Sales Executive', slug: 'sales_executive', description: 'Sales rep', is_system: true, created_at: now, updated_at: now },
      { name: 'Customer', slug: 'customer', description: 'End customer', is_system: true, created_at: now, updated_at: now },
    ];
    await qi.bulkInsert('roles', roles);

    const modules = ['users', 'leads', 'contacts', 'companies', 'deals', 'tasks', 'notes', 'subscriptions', 'invoices', 'reports', 'settings'];
    const actions = ['view', 'create', 'update', 'delete', 'export'];
    const perms = [];
    for (const m of modules) for (const a of actions)
      perms.push({ name: `${a} ${m}`, slug: `${m}.${a}`, module: m, created_at: now, updated_at: now });
    await qi.bulkInsert('permissions', perms);

    const [allRoles] = await qi.sequelize.query('SELECT id, slug FROM roles');
    const [allPerms] = await qi.sequelize.query('SELECT id, slug FROM permissions');
    const rolePerms = [];
    const map = {
      super_admin: () => true,
      admin: () => true,
      manager: (s) => !s.startsWith('settings.') && !s.endsWith('.delete'),
      sales_executive: (s) => ['leads', 'contacts', 'companies', 'deals', 'tasks', 'notes'].some((m) => s.startsWith(m + '.')) && !s.endsWith('.delete'),
      customer: (s) => ['subscriptions.view', 'invoices.view'].includes(s),
    };
    for (const r of allRoles) for (const p of allPerms)
      if (map[r.slug]?.(p.slug)) rolePerms.push({ role_id: r.id, permission_id: p.id, created_at: now, updated_at: now });
    await qi.bulkInsert('role_permissions', rolePerms);
  },
  async down(qi) {
    await qi.bulkDelete('role_permissions', null, {});
    await qi.bulkDelete('permissions', null, {});
    await qi.bulkDelete('roles', null, {});
  },
};