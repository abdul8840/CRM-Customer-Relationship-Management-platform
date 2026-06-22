const Joi = require('joi');
exports.create = Joi.object({
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().max(100).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  company_name: Joi.string().max(200).allow('', null),
  job_title: Joi.string().max(100).allow('', null),
  source: Joi.string().valid('website', 'referral', 'social', 'email', 'cold_call', 'event', 'ads', 'other').default('other'),
  status: Joi.string().valid('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost').default('new'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  estimated_value: Joi.number().min(0).allow(null),
  assigned_to: Joi.number().integer().allow(null),
  tags: Joi.array().items(Joi.string()).default([]),
  notes: Joi.string().allow('', null),
});
exports.update = exports.create.fork(Object.keys(exports.create.describe().keys), (s) => s.optional());
exports.assign = Joi.object({ assigned_to: Joi.number().integer().required() });
exports.convert = Joi.object({
  create_company: Joi.boolean().default(true),
  create_contact: Joi.boolean().default(true),
  deal_title: Joi.string().required(),
  deal_value: Joi.number().min(0).default(0),
});