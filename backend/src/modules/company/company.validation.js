const Joi = require('joi');
exports.create = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  website: Joi.string().uri().allow('', null),
  industry: Joi.string().max(100).allow('', null),
  size: Joi.string().valid('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+').allow(null),
  annual_revenue: Joi.number().min(0).allow(null),
  phone: Joi.string().max(20).allow('', null),
  email: Joi.string().email().allow('', null),
  address: Joi.string().allow('', null), city: Joi.string().allow('', null),
  state: Joi.string().allow('', null), country: Joi.string().allow('', null),
  zip: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  tags: Joi.array().items(Joi.string()).default([]),
  status: Joi.string().valid('active', 'inactive').default('active'),
});
exports.update = exports.create.fork(Object.keys(exports.create.describe().keys), (s) => s.optional());