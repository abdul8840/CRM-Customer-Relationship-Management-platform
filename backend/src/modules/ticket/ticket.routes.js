const router = require('express').Router();
const Joi = require('joi');
const { Op } = require('sequelize');
const { Ticket, TicketMessage, User } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const validate = require('../../middleware/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const qb = require('../../core/queryBuilder');

const ticketNumber = () => `TKT-${Date.now().toString().slice(-8)}`;
const create = Joi.object({
  subject: Joi.string().required(), description: Joi.string().required(),
  category: Joi.string().allow('', null),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
});

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const isAdmin = ['super_admin', 'admin', 'manager'].includes(req.user.role?.slug);
  const built = qb(req.query, { searchFields: ['subject', 'ticket_number'], allowedFilters: ['status', 'priority', 'category'] });
  const where = { ...built.where, ...(isAdmin ? {} : { user_id: req.user.id }) };
  const { rows, count } = await Ticket.findAndCountAll({
    where, limit: built.limit, offset: built.offset, order: built.order,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email', 'avatar_url'] }],
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));

router.post('/', validate(create), asyncHandler(async (req, res) => {
  const t = await Ticket.create({ ...req.body, ticket_number: ticketNumber(), user_id: req.user.id });
  res.status(201).json(new ApiResponse(201, t));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const t = await Ticket.findByPk(req.params.id, {
    include: [
      { model: User, as: 'user' },
      { model: TicketMessage, as: 'messages', include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }] },
    ],
  });
  if (!t) throw new ApiError(404, 'Ticket not found');
  const isAdmin = ['super_admin', 'admin', 'manager'].includes(req.user.role?.slug);
  if (!isAdmin && t.user_id !== req.user.id) throw new ApiError(403, 'Forbidden');
  res.json(new ApiResponse(200, t));
}));

router.post('/:id/messages', validate(Joi.object({ message: Joi.string().required(), attachments: Joi.array().items(Joi.object()).default([]) })),
  asyncHandler(async (req, res) => {
    const t = await Ticket.findByPk(req.params.id);
    if (!t) throw new ApiError(404, 'Ticket not found');
    const m = await TicketMessage.create({ ticket_id: t.id, user_id: req.user.id, message: req.body.message, attachments: req.body.attachments });
    res.status(201).json(new ApiResponse(201, m));
  })
);

router.patch('/:id/status', authorize('super_admin', 'admin', 'manager'),
  validate(Joi.object({ status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').required() })),
  asyncHandler(async (req, res) => {
    const t = await Ticket.findByPk(req.params.id);
    if (!t) throw new ApiError(404, 'Ticket not found');
    await t.update({ status: req.body.status, closed_at: req.body.status === 'closed' ? new Date() : null });
    res.json(new ApiResponse(200, t));
  })
);

module.exports = router;