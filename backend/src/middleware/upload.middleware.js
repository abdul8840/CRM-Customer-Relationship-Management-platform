const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../services/cloudinary.service');
const path = require('path');

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
]);
const ALLOWED_EXTS = /\.(jpe?g|png|webp|gif|pdf|docx?|xlsx?|csv|txt)$/i;

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `crm/${(req.body.folder || 'general').replace(/[^a-z0-9_-]/gi, '')}`,
    resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    public_id: `${Date.now()}-${path.parse(file.originalname).name.replace(/[^a-z0-9_-]/gi, '').slice(0, 50)}`,
  }),
});

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const okMime = ALLOWED_MIMES.has(file.mimetype);
    const okExt = ALLOWED_EXTS.test(file.originalname);
    cb(okMime && okExt ? null : new Error('File type not allowed'), okMime && okExt);
  },
});