const router = require('express').Router();
const { Attachment } = require('../../models');
const upload = require('../../middleware/upload.middleware');
const cloudinary = require('../../services/cloudinary.service');
const { authenticate } = require('../../middleware/auth.middleware');
const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

router.use(authenticate);

router.post('/', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');
  const att = await Attachment.create({
    user_id: req.user.id,
    related_to_type: req.body.related_to_type,
    related_to_id: req.body.related_to_id,
    file_name: req.file.originalname,
    file_url: req.file.path,
    file_type: req.file.mimetype,
    file_size: req.file.size,
    cloudinary_public_id: req.file.filename,
  });
  res.status(201).json(new ApiResponse(201, att));
}));

router.get('/', asyncHandler(async (req, res) => {
  const where = { user_id: req.user.id };
  if (req.query.related_to_type) where.related_to_type = req.query.related_to_type;
  if (req.query.related_to_id) where.related_to_id = req.query.related_to_id;
  const items = await Attachment.findAll({ where, order: [['created_at', 'DESC']] });
  res.json(new ApiResponse(200, { items }));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const att = await Attachment.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!att) throw new ApiError(404, 'Attachment not found');
  if (att.cloudinary_public_id) {
    try { await cloudinary.uploader.destroy(att.cloudinary_public_id); } catch (_) {}
  }
  await att.destroy();
  res.json(new ApiResponse(200, null, 'Deleted'));
}));

module.exports = router;