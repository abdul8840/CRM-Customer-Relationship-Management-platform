const router = require('express').Router();
const ctrl = require('./lead.controller');
const v = require('./lead.validation');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');

router.use(authenticate);
router.get('/stats', ctrl.stats);
router.get('/export', ctrl.export);
router.post('/import', ctrl.import);
router.get('/', ctrl.list);
router.post('/', validate(v.create), ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);
router.patch('/:id/assign', validate(v.assign), ctrl.assign);
router.post('/:id/convert', validate(v.convert), ctrl.convert);

module.exports = router;