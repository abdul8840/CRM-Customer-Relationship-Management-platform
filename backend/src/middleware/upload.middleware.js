const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../services/cloudinary.service');

const storage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `crm/${req.body.folder || 'general'}`,
    resource_type: file.mimetype.startsWith('image/') ? 'image' : 'raw',
    public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
  }),
});

module.exports = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /image\/(jpeg|png|jpg|webp|gif)|application\/(pdf|msword|vnd.openxmlformats|vnd.ms-excel)/.test(file.mimetype);
    cb(ok ? null : new Error('File type not allowed'), ok);
  },
});