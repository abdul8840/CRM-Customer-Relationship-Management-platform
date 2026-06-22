const router = require('express').Router();
const { Setting } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

router.get('/public', asyncHandler(async (_req, res) =>
  res.json(new ApiResponse(200, await Setting.findAll({ where: { is_public: true } })))
));

router.use(authenticate, authorize('super_admin', 'admin'));
router.get('/', asyncHandler(async (_req, res) => res.json(new ApiResponse(200, await Setting.findAll()))));
router.put('/:key', asyncHandler(async (req, res) => {
  const [s] = await Setting.findOrCreate({ where: { key: req.params.key }, defaults: { value: req.body.value, description: req.body.description } });
  await s.update({ value: req.body.value, description: req.body.description ?? s.description, is_public: req.body.is_public ?? s.is_public });
  res.json(new ApiResponse(200, s));
}));

module.exports = router;