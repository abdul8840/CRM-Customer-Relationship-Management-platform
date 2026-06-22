const router = require('express').Router();
const svc = require('./notification.service');
const { authenticate } = require('../../middleware/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');

router.use(authenticate);
router.get('/', asyncHandler(async (req, res) => res.json(new ApiResponse(200, await svc.list(req.user, req.query)))));
router.patch('/read-all', asyncHandler(async (req, res) => { await svc.markAllRead(req.user); res.json(new ApiResponse(200, null, 'All read')); }));
router.patch('/:id/read', asyncHandler(async (req, res) => { await svc.markRead(req.user, req.params.id); res.json(new ApiResponse(200, null, 'Read')); }));
router.delete('/:id', asyncHandler(async (req, res) => { await svc.remove(req.user, req.params.id); res.json(new ApiResponse(200, null, 'Deleted')); }));
module.exports = router;