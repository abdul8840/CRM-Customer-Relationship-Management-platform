import api from './axios';

export const authApi = {
  login: (d) => api.post('/auth/login', d).then((r) => r.data.data),
  refresh: (d) => api.post('/auth/refresh', d).then((r) => r.data.data),
  logout: (d) => api.post('/auth/logout', d).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
};

const list = (path) => (params) => api.get(path, { params }).then((r) => r.data.data);
const crud = (base) => ({
  list: list(base),
  get: (id) => api.get(`${base}/${id}`).then((r) => r.data.data),
  create: (d) => api.post(base, d).then((r) => r.data.data),
  update: (id, d) => api.put(`${base}/${id}`, d).then((r) => r.data.data),
  remove: (id) => api.delete(`${base}/${id}`).then((r) => r.data.data),
});

export const adminApi = {
  dashboard: () => api.get('/admin/dashboard').then((r) => r.data.data),
  signups: (days) => api.get('/admin/dashboard/signups', { params: { days } }).then((r) => r.data.data),
  revenue: (months) => api.get('/admin/dashboard/revenue', { params: { months } }).then((r) => r.data.data),
  planDist: () => api.get('/admin/dashboard/plan-distribution').then((r) => r.data.data),
  health: () => api.get('/admin/system/health').then((r) => r.data.data),
};
export const usersApi = {
  ...crud('/users'),
  setStatus: (id, status) => api.patch(`/users/${id}/status`, { status }).then((r) => r.data.data),
};
export const rolesApi = {
  list: () => api.get('/roles').then((r) => r.data.data),
  permissions: () => api.get('/roles/permissions').then((r) => r.data.data),
  create: (d) => api.post('/roles', d).then((r) => r.data.data),
  update: (id, d) => api.put(`/roles/${id}`, d).then((r) => r.data.data),
  remove: (id) => api.delete(`/roles/${id}`).then((r) => r.data.data),
};
export const plansApi = crud('/admin/plans');
export const subscriptionsApi = { list: list('/admin/subscriptions') };
export const paymentsApi = { list: list('/admin/payments') };
export const invoicesApi = { list: list('/admin/invoices') };
export const auditApi = { list: list('/admin/audit-logs') };
export const loginHistoryApi = { list: list('/admin/login-history') };
export const ticketsApi = {
  list: list('/tickets'),
  get: (id) => api.get(`/tickets/${id}`).then((r) => r.data.data),
  reply: (id, message) => api.post(`/tickets/${id}/messages`, { message }).then((r) => r.data.data),
  setStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status }).then((r) => r.data.data),
};
export const faqsApi = {
  list: list('/faqs'),
  create: (d) => api.post('/faqs', d).then((r) => r.data.data),
  update: (id, d) => api.put(`/faqs/${id}`, d).then((r) => r.data.data),
  remove: (id) => api.delete(`/faqs/${id}`).then((r) => r.data.data),
};
export const announcementsApi = {
  list: () => api.get('/announcements').then((r) => r.data.data),
  create: (d) => api.post('/announcements', d).then((r) => r.data.data),
  update: (id, d) => api.put(`/announcements/${id}`, d).then((r) => r.data.data),
  remove: (id) => api.delete(`/announcements/${id}`).then((r) => r.data.data),
};
export const settingsApi = {
  list: () => api.get('/settings').then((r) => r.data.data),
  update: (key, value) => api.put(`/settings/${key}`, { value }).then((r) => r.data.data),
};