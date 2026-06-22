const Joi = require('joi');
exports.create = Joi.object({
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().max(100).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(20).allow('', null),
  mobile: Joi.string().max(20).allow('', null),
  company_id: Joi.number().integer().allow(null),
  job_title: Joi.string().allow('', null), department: Joi.string().allow('', null),
  address: Joi.string().allow('', null), city: Joi.string().allow('', null),
  state: Joi.string().allow('', null), country: Joi.string().allow('', null),
  zip: Joi.string().allow('', null),
  source: Joi.string().allow('', null),
  tags: Joi.array().items(Joi.string()).default([]),
  notes: Joi.string().allow('', null),
  status: Joi.string().valid('active', 'inactive').default('active'),
});
exports.update = exports.create.fork(Object.keys(exports.create.describe().keys), (s) => s.optional());