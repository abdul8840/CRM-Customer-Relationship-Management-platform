const router = require('express').Router();
const service = require('./deal.service');
const v = require('./deal.validation');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const BaseController = require('../../core/BaseController');

const ctrl = new BaseController(service);
router.use(authenticate);

router.get('/kanban', asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.kanban(req.user, req.query)))));
router.get('/pipeline-stats', asyncHandler(async (req, res) => res.json(new ApiResponse(200, await service.pipelineStats(req.user)))));
router.patch('/:id/stage', validate(v.moveStage), asyncHandler(async (req, res) =>
  res.json(new ApiResponse(200, await service.moveStage(req.user, req.params.id, req.body.stage, req.body.stage_order)))
));

router.get('/', ctrl.list);
router.post('/', validate(v.create), ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;