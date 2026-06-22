const router = require('express').Router();
const Joi = require('joi');
const svc = require('./subscription.service');
const { authenticate } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

const checkout = Joi.object({ plan_id: Joi.number().integer().required() });
const verify = Joi.object({
  order_id: Joi.string().required(),
  payment_id: Joi.string().required(),
  signature: Joi.string().required(),
  plan_id: Joi.number().integer().required(),
});

router.get('/plans', asyncHandler(async (_req, res) => res.json(new ApiResponse(200, await svc.listPlans()))));

router.use(authenticate);
router.get('/me', asyncHandler(async (req, res) => res.json(new ApiResponse(200, await svc.getMine(req.user)))));
router.post('/checkout', validate(checkout), asyncHandler(async (req, res) =>
  res.json(new ApiResponse(200, await svc.startCheckout(req.user, req.body.plan_id)))));
router.post('/verify', validate(verify), asyncHandler(async (req, res) =>
  res.json(new ApiResponse(200, await svc.verifyAndActivate(req.user, req.body)))));
router.post('/cancel', asyncHandler(async (req, res) =>
  res.json(new ApiResponse(200, await svc.cancel(req.user)))));
router.get('/invoices', asyncHandler(async (req, res) => res.json(new ApiResponse(200, await svc.invoices(req.user)))));
router.get('/payments', asyncHandler(async (req, res) => res.json(new ApiResponse(200, await svc.payments(req.user)))));

module.exports = router;