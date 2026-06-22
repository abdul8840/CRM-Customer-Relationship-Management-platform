const router = require('express').Router();
const { Activity, User } = require('../../models');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const qb = require('../../core/queryBuilder');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => {
  const built = qb(req.query, { allowedFilters: ['related_to_type', 'related_to_id', 'type', 'user_id'], defaultSort: '-created_at' });
  const { rows, count } = await Activity.findAndCountAll({
    where: built.where, limit: built.limit, offset: built.offset, order: built.order,
    include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }],
  });
  res.json(new ApiResponse(200, { items: rows, meta: qb.paginate(count, built.page, built.limit) }));
}));
module.exports = router;