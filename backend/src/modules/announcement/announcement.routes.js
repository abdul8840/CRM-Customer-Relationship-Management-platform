const router = require('express').Router();
const Joi = require('joi');
const { Op } = require('sequelize');
const { Announcement } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const validate = require('../../middleware/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

router.get('/active', authenticate, asyncHandler(async (req, res) => {
  const now = new Date();
  const audience = ['super_admin', 'admin', 'manager'].includes(req.user.role?.slug) ? ['all', 'admins'] : ['all', 'customers'];
  const items = await Announcement.findAll({
    where: {
      is_active: true,
      audience: { [Op.in]: audience },
      published_at: { [Op.lte]: now },
      [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: now } }],
    }, order: [['published_at', 'DESC']],
  });
  res.json(new ApiResponse(200, items));
}));

router.use(authenticate, authorize('super_admin', 'admin'));
const schema = Joi.object({
  title: Joi.string().required(), content: Joi.string().required(),
  type: Joi.string().valid('info', 'success', 'warning', 'critical').default('info'),
  audience: Joi.string().valid('all', 'customers', 'admins').default('all'),
  published_at: Joi.date().default(() => new Date()),
  expires_at: Joi.date().allow(null),
  is_active: Joi.boolean().default(true),
});

router.get('/', asyncHandler(async (_req, res) => res.json(new ApiResponse(200, await Announcement.findAll({ order: [['created_at', 'DESC']] })))));
router.post('/', validate(schema), asyncHandler(async (req, res) => res.status(201).json(new ApiResponse(201, await Announcement.create(req.body)))));
router.put('/:id', validate(schema), asyncHandler(async (req, res) => {
  const a = await Announcement.findByPk(req.params.id);
  await a.update(req.body);
  res.json(new ApiResponse(200, a));
}));
router.delete('/:id', asyncHandler(async (req, res) => { await Announcement.destroy({ where: { id: req.params.id } }); res.json(new ApiResponse(200, null, 'Deleted')); }));

module.exports = router;