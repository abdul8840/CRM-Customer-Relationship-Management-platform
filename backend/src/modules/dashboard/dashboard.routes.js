const router = require('express').Router();
const { Op, fn, col } = require('sequelize');
const { Lead, Deal, Task, Invoice, sequelize } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

router.use(authenticate);

const scopeFor = (user, ownerField = 'owner_id') => {
  const role = user.role?.slug;
  if (['super_admin', 'admin', 'manager'].includes(role)) return {};
  return { [ownerField]: user.id };
};

router.get('/overview', asyncHandler(async (req, res) => {
  const scope = scopeFor(req.user);
  const monthAgo = new Date(Date.now() - 30 * 86400000);

  const [totalLeads, activeDeals, wonDeals, lostDeals, pendingTasks, monthRevenue, conversion] = await Promise.all([
    Lead.count({ where: scope }),
    Deal.count({ where: { ...scope, stage: { [Op.notIn]: ['won', 'lost'] } } }),
    Deal.count({ where: { ...scope, stage: 'won' } }),
    Deal.count({ where: { ...scope, stage: 'lost' } }),
    Task.count({ where: { ...scope, status: { [Op.in]: ['pending', 'in_progress'] } } }),
    Deal.sum('value', { where: { ...scope, stage: 'won', updated_at: { [Op.gte]: monthAgo } } }),
    (async () => {
      const total = await Lead.count({ where: scope });
      const converted = await Lead.count({ where: { ...scope, status: 'converted' } });
      return total ? +((converted / total) * 100).toFixed(2) : 0;
    })(),
  ]);

  res.json(new ApiResponse(200, {
    totalLeads, activeDeals, wonDeals, lostDeals, pendingTasks,
    monthRevenue: monthRevenue || 0, conversionRate: conversion,
  }));
}));

router.get('/sales-chart', asyncHandler(async (req, res) => {
  const scope = scopeFor(req.user);
  const months = +req.query.months || 6;
  const start = new Date(); start.setMonth(start.getMonth() - months);
  const data = await Deal.findAll({
    where: { ...scope, stage: 'won', updated_at: { [Op.gte]: start } },
    attributes: [
      [fn('DATE_FORMAT', col('updated_at'), '%Y-%m'), 'month'],
      [fn('SUM', col('value')), 'revenue'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE_FORMAT', col('updated_at'), '%Y-%m')],
    order: [[fn('DATE_FORMAT', col('updated_at'), '%Y-%m'), 'ASC']],
    raw: true,
  });
  res.json(new ApiResponse(200, data));
}));

router.get('/lead-sources', asyncHandler(async (req, res) => {
  const data = await Lead.findAll({
    where: scopeFor(req.user),
    attributes: ['source', [fn('COUNT', col('id')), 'count']],
    group: ['source'], raw: true,
  });
  res.json(new ApiResponse(200, data));
}));

router.get('/recent-activities', asyncHandler(async (req, res) => {
  const { Activity, User } = require('../../models');
  const items = await Activity.findAll({
    order: [['created_at', 'DESC']], limit: 20,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }],
  });
  res.json(new ApiResponse(200, items));
}));

module.exports = router;