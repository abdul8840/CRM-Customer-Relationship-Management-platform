const router = require('express').Router();
const Joi = require('joi');
const { User, Role } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const upload = require('../../middleware/upload.middleware');
const cloudinary = require('../../services/cloudinary.service');
const validate = require('../../middleware/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const qb = require('../../core/queryBuilder');

router.use(authenticate);

// === Self ===
router.get('/me', asyncHandler(async (req, res) => res.json(new ApiResponse(200, await User.findByPk(req.user.id, { include: [{ model: Role, as: 'role' }] })))));
router.put('/me', validate(Joi.object({
  first_name: Joi.string().max(100), last_name: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
})), asyncHandler(async (req, res) => {
  const u = await User.findByPk(req.user.id);
  await u.update(req.body);
  res.json(new ApiResponse(200, u));
}));

router.post('/me/avatar', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const u = await User.findByPk(req.user.id);
  if (u.avatar_public_id) { try { await cloudinary.uploader.destroy(u.avatar_public_id); } catch {} }
  await u.update({ avatar_url: req.file.path, avatar_public_id: req.file.filename });
  res.json(new ApiResponse(200, u));
}));

router.put('/me/password', validate(Joi.object({
  current: Joi.string().required(), next: Joi.string().min(8).max(64).required(),
})), asyncHandler(async (req, res) => {
  const u = await User.scope('withPassword').findByPk(req.user.id);
  if (!(await u.comparePassword(req.body.current))) throw new ApiError(401, 'Wrong current password');
  u.password = req.body.next;
  await u.save();
  res.json(new ApiResponse(200, null, 'Password updated'));
}));

// === Admin ===
router.use(authorize('super_admin', 'admin'));

router.get('/', asyncHandler(async (req, res) => {
  const built = qb(req.query, { searchFields: ['first_name', 'last_name', 'email'], allowedFilters: ['status', 'role_id'] });
  const { rows, count } = await User.findAndCountAll({
    where: built.where, include: [{ model: Role, as: 'role' }],
    limit: built.limit, offset: built.offset, order: built.order, distinct: true,
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));

router.post('/', validate(Joi.object({
  first_name: Joi.string().required(), last_name: Joi.string().allow('', null),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().allow('', null),
  role_id: Joi.number().integer().required(),
  status: Joi.string().valid('active', 'inactive', 'pending').default('active'),
})), asyncHandler(async (req, res) => {
  const u = await User.create({ ...req.body, created_by: req.user.id });
  res.status(201).json(new ApiResponse(201, u));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const u = await User.findByPk(req.params.id, { include: [{ model: Role, as: 'role' }] });
  if (!u) throw new ApiError(404, 'User not found');
  res.json(new ApiResponse(200, u));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const u = await User.findByPk(req.params.id);
  if (!u) throw new ApiError(404, 'User not found');
  await u.update(req.body);
  res.json(new ApiResponse(200, u));
}));

router.patch('/:id/status', validate(Joi.object({ status: Joi.string().valid('active', 'inactive', 'suspended').required() })),
  asyncHandler(async (req, res) => {
    const u = await User.findByPk(req.params.id);
    if (!u) throw new ApiError(404, 'User not found');
    await u.update({ status: req.body.status });
    res.json(new ApiResponse(200, u));
  })
);

router.delete('/:id', asyncHandler(async (req, res) => {
  if (+req.params.id === req.user.id) throw new ApiError(400, 'Cannot delete yourself');
  await User.destroy({ where: { id: req.params.id } });
  res.json(new ApiResponse(200, null, 'Deleted'));
}));

module.exports = router;