const router = require('express').Router();
const Joi = require('joi');
const { Task, User } = require('../../models');
const BaseService = require('../../core/BaseService');
const BaseController = require('../../core/BaseController');
const { authenticate } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');

const create = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('', null),
  type: Joi.string().valid('call', 'email', 'meeting', 'follow_up', 'other').default('other'),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').default('pending'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  due_date: Joi.date().allow(null),
  reminder_at: Joi.date().allow(null),
  assigned_to: Joi.number().integer().allow(null),
  related_to_type: Joi.string().valid('lead', 'deal', 'contact', 'company').allow(null),
  related_to_id: Joi.number().integer().allow(null),
  is_recurring: Joi.boolean().default(false),
  recurrence_pattern: Joi.string().allow('', null),
});
const update = create.fork(Object.keys(create.describe().keys), (s) => s.optional()).keys({
  completed_at: Joi.date().allow(null),
});

const service = new BaseService(Task, {
  searchFields: ['title'],
  allowedFilters: ['status', 'priority', 'type', 'assigned_to', 'related_to_type', 'related_to_id'],
  includes: [{ model: User, as: 'assignee', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }],
});
const ctrl = new BaseController(service);

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', validate(create), ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', validate(update), ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;