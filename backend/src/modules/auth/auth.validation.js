const Joi = require('joi');

const register = Joi.object({
  first_name: Joi.string().min(2).max(100).required(),
  last_name: Joi.string().max(100).allow('', null),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/).allow('', null),
  password: Joi.string().min(8).max(64).pattern(/[A-Z]/, 'uppercase').pattern(/[0-9]/, 'digit').required(),
});

const login = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyEmail = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
});

const resendOtp = Joi.object({
  email: Joi.string().email().required(),
  purpose: Joi.string().valid('email_verify', 'password_reset').required(),
});

const forgotPassword = Joi.object({ email: Joi.string().email().required() });

const resetPassword = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).required(),
  password: Joi.string().min(8).max(64).required(),
});

const refresh = Joi.object({ refresh_token: Joi.string().required() });

module.exports = { register, login, verifyEmail, resendOtp, forgotPassword, resetPassword, refresh };