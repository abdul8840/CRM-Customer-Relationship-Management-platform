const router = require('express').Router();
const Joi = require('joi');
const { Role, Permission } = require('../../models');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const validate = require('../../middleware/validate.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

router.use(authenticate, authorize('super_admin', 'admin'));

router.get('/', asyncHandler(async (_req, res) => {
  const roles = await Role.findAll({ include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }] });
  res.json(new ApiResponse(200, roles));
}));

router.get('/permissions', asyncHandler(async (_req, res) => res.json(new ApiResponse(200, await Permission.findAll({ order: [['module', 'ASC']] })))));

router.post('/', validate(Joi.object({
  name: Joi.string().required(), slug: Joi.string().required(),
  description: Joi.string().allow('', null),
  permission_ids: Joi.array().items(Joi.number().integer()).default([]),
})), asyncHandler(async (req, res) => {
  const { permission_ids, ...rest } = req.body;
  const role = await Role.create(rest);
  if (permission_ids.length) await role.setPermissions(permission_ids);
  res.status(201).json(new ApiResponse(201, role));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.is_system) throw new ApiError(400, 'Cannot modify system role');
  const { permission_ids, ...rest } = req.body;
  await role.update(rest);
  if (Array.isArray(permission_ids)) await role.setPermissions(permission_ids);
  res.json(new ApiResponse(200, role));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const role = await Role.findByPk(req.params.id);
  if (!role) throw new ApiError(404, 'Role not found');
  if (role.is_system) throw new ApiError(400, 'Cannot delete system role');
  await role.destroy();
  res.json(new ApiResponse(200, null, 'Deleted'));
}));

module.exports = router;