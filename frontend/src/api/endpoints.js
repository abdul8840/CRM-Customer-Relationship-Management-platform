import api from './axios';

const crud = (base) => ({
  list: (params) => api.get(base, { params }).then((r) => r.data.data),
  get: (id) => api.get(`${base}/${id}`).then((r) => r.data.data),
  create: (data) => api.post(base, data).then((r) => r.data.data),
  update: (id, data) => api.put(`${base}/${id}`, data).then((r) => r.data.data),
  remove: (id) => api.delete(`${base}/${id}`).then((r) => r.data.data),
});

export const authApi = {
  register: (d) => api.post('/auth/register', d).then((r) => r.data.data),
  login: (d) => api.post('/auth/login', d).then((r) => r.data.data),
  verifyEmail: (d) => api.post('/auth/verify-email', d).then((r) => r.data.data),
  resendOtp: (d) => api.post('/auth/resend-otp', d).then((r) => r.data.data),
  forgotPassword: (d) => api.post('/auth/forgot-password', d).then((r) => r.data.data),
  resetPassword: (d) => api.post('/auth/reset-password', d).then((r) => r.data.data),
  refresh: (d) => api.post('/auth/refresh', d).then((r) => r.data.data),
  logout: (d) => api.post('/auth/logout', d).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data.user),
};

export const usersApi = {
  ...crud('/users'),
  me: () => api.get('/users/me').then((r) => r.data.data),
  updateMe: (d) => api.put('/users/me', d).then((r) => r.data.data),
  changePassword: (d) => api.put('/users/me/password', d).then((r) => r.data.data),
  uploadAvatar: (file) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
  },
};

export const companiesApi = crud('/companies');
export const contactsApi = crud('/contacts');
export const tasksApi = crud('/tasks');
export const notesApi = crud('/notes');

export const leadsApi = {
  ...crud('/leads'),
  stats: () => api.get('/leads/stats').then((r) => r.data.data),
  assign: (id, assigned_to) => api.patch(`/leads/${id}/assign`, { assigned_to }).then((r) => r.data.data),
  convert: (id, d) => api.post(`/leads/${id}/convert`, d).then((r) => r.data.data),
  importRows: (rows) => api.post('/leads/import', { rows }).then((r) => r.data.data),
  exportUrl: () => `${import.meta.env.VITE_API_URL}/leads/export`,
};

export const dealsApi = {
  ...crud('/deals'),
  kanban: (params) => api.get('/deals/kanban', { params }).then((r) => r.data.data),
  moveStage: (id, stage, stage_order) => api.patch(`/deals/${id}/stage`, { stage, stage_order }).then((r) => r.data.data),
  pipelineStats: () => api.get('/deals/pipeline-stats').then((r) => r.data.data),
};

export const dashboardApi = {
  overview: () => api.get('/dashboard/overview').then((r) => r.data.data),
  salesChart: (months = 6) => api.get('/dashboard/sales-chart', { params: { months } }).then((r) => r.data.data),
  leadSources: () => api.get('/dashboard/lead-sources').then((r) => r.data.data),
  recent: () => api.get('/dashboard/recent-activities').then((r) => r.data.data),
};

export const subscriptionApi = {
  plans: () => api.get('/subscriptions/plans').then((r) => r.data.data),
  me: () => api.get('/subscriptions/me').then((r) => r.data.data),
  checkout: (plan_id) => api.post('/subscriptions/checkout', { plan_id }).then((r) => r.data.data),
  verify: (d) => api.post('/subscriptions/verify', d).then((r) => r.data.data),
  cancel: () => api.post('/subscriptions/cancel').then((r) => r.data.data),
  invoices: () => api.get('/subscriptions/invoices').then((r) => r.data.data),
  payments: () => api.get('/subscriptions/payments').then((r) => r.data.data),
};

export const notificationsApi = {
  list: (params) => api.get('/notifications', { params }).then((r) => r.data.data),
  markRead: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data.data),
  remove: (id) => api.delete(`/notifications/${id}`).then((r) => r.data.data),
};

export const ticketsApi = {
  list: (params) => api.get('/tickets', { params }).then((r) => r.data.data),
  get: (id) => api.get(`/tickets/${id}`).then((r) => r.data.data),
  create: (d) => api.post('/tickets', d).then((r) => r.data.data),
  reply: (id, message) => api.post(`/tickets/${id}/messages`, { message }).then((r) => r.data.data),
};

export const faqsApi = { list: () => api.get('/faqs').then((r) => r.data.data) };
export const announcementsApi = { active: () => api.get('/announcements/active').then((r) => r.data.data) };