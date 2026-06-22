const router = require('express').Router();
const { Contact, Company } = require('../../models');
const BaseService = require('../../core/BaseService');
const BaseController = require('../../core/BaseController');
const { authenticate } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const v = require('./contact.validation');

const service = new BaseService(Contact, {
  searchFields: ['first_name', 'last_name', 'email', 'phone'],
  allowedFilters: ['status', 'company_id', 'source'],
  includes: [{ model: Company, as: 'company', attributes: ['id', 'name', 'logo_url'] }],
});
const ctrl = new BaseController(service);

router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', validate(v.create), ctrl.create);
router.post('/bulk-delete', ctrl.bulkDelete);
router.get('/:id', ctrl.get);
router.put('/:id', validate(v.update), ctrl.update);
router.delete('/:id', ctrl.delete);

module.exports = router;