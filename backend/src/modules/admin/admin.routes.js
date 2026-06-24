const router = require('express').Router();
const { Op, fn, col, literal } = require('sequelize');
const Joi = require('joi');
const {
  sequelize, User, Role, Plan, Subscription, Invoice, Payment,
  Lead, Deal, AuditLog, LoginHistory,
} = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const validate = require('../../middleware/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const qb = require('../../core/queryBuilder');

router.use(authenticate, authorize('super_admin', 'admin'));

/* === Dashboard === */
router.get('/dashboard', asyncHandler(async (_req, res) => {
  const monthAgo = new Date(Date.now() - 30 * 86400000);
  const [
    totalUsers, activeUsers, newUsers30, totalLeads, totalDeals, wonDeals,
    activeSubs, mrr, revenue30, ticketsOpen,
  ] = await Promise.all([
    User.count(),
    User.count({ where: { status: 'active' } }),
    User.count({ where: { created_at: { [Op.gte]: monthAgo } } }),
    Lead.count(),
    Deal.count(),
    Deal.count({ where: { stage: 'won' } }),
    Subscription.count({ where: { status: 'active' } }),
    Subscription.findAll({
      where: { status: 'active' }, include: [{ model: Plan, as: 'plan' }],
    }).then((subs) => subs.reduce((s, x) => s + Number(x.plan?.price || 0), 0)),
    Payment.sum('amount', { where: { status: 'captured', created_at: { [Op.gte]: monthAgo } } }),
    require('../../models').Ticket.count({ where: { status: { [Op.in]: ['open', 'in_progress'] } } }),
  ]);
  res.json(new ApiResponse(200, {
    totalUsers, activeUsers, newUsers30, totalLeads, totalDeals, wonDeals,
    activeSubs, mrr, revenue30: revenue30 || 0, ticketsOpen,
  }));
}));

router.get('/dashboard/signups', asyncHandler(async (req, res) => {
  const days = +req.query.days || 30;
  const start = new Date(Date.now() - days * 86400000);
  const data = await User.findAll({
    where: { created_at: { [Op.gte]: start } },
    attributes: [
      [fn('DATE', col('created_at')), 'date'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('created_at'))],
    order: [[fn('DATE', col('created_at')), 'ASC']],
    raw: true,
  });
  res.json(new ApiResponse(200, data));
}));

router.get('/dashboard/revenue', asyncHandler(async (req, res) => {
  const months = +req.query.months || 12;
  const start = new Date(); start.setMonth(start.getMonth() - months);
  const data = await Payment.findAll({
    where: { status: 'captured', created_at: { [Op.gte]: start } },
    attributes: [
      [fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'month'],
      [fn('SUM', col('amount')), 'revenue'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE_FORMAT', col('created_at'), '%Y-%m')],
    order: [[fn('DATE_FORMAT', col('created_at'), '%Y-%m'), 'ASC']],
    raw: true,
  });
  res.json(new ApiResponse(200, data));
}));

router.get('/dashboard/plan-distribution', asyncHandler(async (_req, res) => {
  const data = await Subscription.findAll({
    where: { status: 'active' },
    include: [{ model: Plan, as: 'plan', attributes: ['name'] }],
    attributes: ['plan_id', [fn('COUNT', col('Subscription.id')), 'count']],
    group: ['plan_id', 'plan.id'], raw: true, nest: true,
  });
  res.json(new ApiResponse(200, data));
}));

/* === Plans CRUD === */
const planSchema = Joi.object({
  name: Joi.string().required(), slug: Joi.string().required(),
  description: Joi.string().allow('', null),
  price: Joi.number().min(0).default(0),
  currency: Joi.string().length(3).default('INR'),
  interval: Joi.string().valid('month', 'year').default('month'),
  trial_days: Joi.number().integer().min(0).default(0),
  features: Joi.array().items(Joi.string()).default([]),
  limits: Joi.object().default({}),
  is_active: Joi.boolean().default(true),
  sort_order: Joi.number().integer().default(0),
});
router.get('/plans', asyncHandler(async (_req, res) =>
  res.json(new ApiResponse(200, await Plan.findAll({ order: [['sort_order', 'ASC']] })))));
router.post('/plans', validate(planSchema), asyncHandler(async (req, res) =>
  res.status(201).json(new ApiResponse(201, await Plan.create(req.body)))));
router.put('/plans/:id', validate(planSchema.fork(Object.keys(planSchema.describe().keys), (s) => s.optional())),
  asyncHandler(async (req, res) => {
    const p = await Plan.findByPk(req.params.id);
    if (!p) throw new ApiError(404, 'Plan not found');
    await p.update(req.body);
    res.json(new ApiResponse(200, p));
  }));
router.delete('/plans/:id', asyncHandler(async (req, res) => {
  await Plan.destroy({ where: { id: req.params.id } });
  res.json(new ApiResponse(200, null, 'Deleted'));
}));

/* === All subscriptions === */
router.get('/subscriptions', asyncHandler(async (req, res) => {
  const built = qb(req.query, { allowedFilters: ['status', 'plan_id'] });
  const { rows, count } = await Subscription.findAndCountAll({
    where: built.where, limit: built.limit, offset: built.offset, order: built.order,
    include: [
      { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'] },
      { model: Plan, as: 'plan' },
    ],
    distinct: true,
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));

/* === Payments & Invoices (all) === */
router.get('/payments', asyncHandler(async (req, res) => {
  const built = qb(req.query, { allowedFilters: ['status', 'user_id'] });
  const { rows, count } = await Payment.findAndCountAll({
    where: built.where, limit: built.limit, offset: built.offset, order: built.order,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    distinct: true,
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));

router.get('/invoices', asyncHandler(async (req, res) => {
  const built = qb(req.query, { allowedFilters: ['status', 'user_id'] });
  const { rows, count } = await Invoice.findAndCountAll({
    where: built.where, limit: built.limit, offset: built.offset, order: built.order,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    distinct: true,
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));

/* === Audit Logs === */
router.get('/audit-logs', asyncHandler(async (req, res) => {
  const built = qb(req.query, { searchFields: ['action', 'entity'], allowedFilters: ['user_id', 'entity'] });
  const { rows, count } = await AuditLog.findAndCountAll({
    where: built.where, limit: built.limit, offset: built.offset, order: built.order,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    distinct: true,
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));

/* === Login History === */
router.get('/login-history', asyncHandler(async (req, res) => {
  const built = qb(req.query, { allowedFilters: ['status', 'user_id'] });
  const { rows, count } = await LoginHistory.findAndCountAll({
    where: built.where, limit: built.limit, offset: built.offset, order: built.order,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
    distinct: true,
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));

/* === System health === */
router.get('/system/health', asyncHandler(async (_req, res) => {
  const dbOk = await sequelize.authenticate().then(() => true).catch(() => false);
  res.json(new ApiResponse(200, {
    db: dbOk ? 'ok' : 'down',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version,
    env: process.env.NODE_ENV,
  }));
}));

module.exports = router;