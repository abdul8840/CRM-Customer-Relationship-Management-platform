const router = require('express').Router();
const Joi = require('joi');
const { Faq } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const validate = require('../../middleware/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

router.get('/', asyncHandler(async (_req, res) =>
  res.json(new ApiResponse(200, await Faq.findAll({ where: { is_published: true }, order: [['sort_order', 'ASC']] })))
));

router.use(authenticate, authorize('super_admin', 'admin'));

const schema = Joi.object({
  category: Joi.string().allow('', null),
  question: Joi.string().required(), answer: Joi.string().required(),
  sort_order: Joi.number().integer().default(0),
  is_published: Joi.boolean().default(true),
});

router.post('/', validate(schema), asyncHandler(async (req, res) => res.status(201).json(new ApiResponse(201, await Faq.create(req.body)))));
router.put('/:id', validate(schema), asyncHandler(async (req, res) => {
  const f = await Faq.findByPk(req.params.id);
  await f.update(req.body);
  res.json(new ApiResponse(200, f));
}));
router.delete('/:id', asyncHandler(async (req, res) => { await Faq.destroy({ where: { id: req.params.id } }); res.json(new ApiResponse(200, null, 'Deleted')); }));

module.exports = router;