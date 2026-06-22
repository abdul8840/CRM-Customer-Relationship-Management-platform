const Joi = require('joi');
exports.create = Joi.object({
  title: Joi.string().min(2).max(200).required(),
  description: Joi.string().allow('', null),
  value: Joi.number().min(0).default(0),
  currency: Joi.string().length(3).default('INR'),
  stage: Joi.string().valid('lead', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost').default('lead'),
  probability: Joi.number().integer().min(0).max(100),
  expected_close_date: Joi.date().allow(null),
  company_id: Joi.number().integer().allow(null),
  contact_id: Joi.number().integer().allow(null),
  assigned_to: Joi.number().integer().allow(null),
  tags: Joi.array().items(Joi.string()).default([]),
});
exports.update = exports.create.fork(Object.keys(exports.create.describe().keys), (s) => s.optional());
exports.moveStage = Joi.object({
  stage: Joi.string().valid('lead', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost').required(),
  stage_order: Joi.number().integer().min(0).optional(),
});