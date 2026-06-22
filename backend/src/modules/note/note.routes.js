const router = require('express').Router();
const Joi = require('joi');
const { Note, User } = require('../../models');
const BaseService = require('../../core/BaseService');
const BaseController = require('../../core/BaseController');
const { authenticate } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');

const schema = Joi.object({
  title: Joi.string().max(200).allow('', null),
  content: Joi.string().required(),
  related_to_type: Joi.string().valid('lead', 'deal', 'contact', 'company').required(),
  related_to_id: Joi.number().integer().required(),
  pinned: Joi.boolean().default(false),
});

class NoteService extends BaseService {
  constructor() {
    super(Note, {
      searchFields: ['title', 'content'],
      allowedFilters: ['related_to_type', 'related_to_id', 'pinned'],
      ownerField: 'user_id',
      includes: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'avatar_url'] }],
    });
  }
}

const ctrl = new BaseController(new NoteService());
router.use(authenticate);
router.get('/', ctrl.list);
router.post('/', validate(schema), ctrl.create);
router.get('/:id', ctrl.get);
router.put('/:id', validate(schema.fork(Object.keys(schema.describe().keys), (s) => s.optional())), ctrl.update);
router.delete('/:id', ctrl.delete);
module.exports = router;