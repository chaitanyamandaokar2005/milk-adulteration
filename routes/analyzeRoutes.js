const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { analyzeStrip, getTestHistory, getUserDashboardStats, deleteTest } = require('../controllers/analyzeController');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimits');
const { sanitizeRequest } = require('../middleware/sanitize');
const { persistStripImage } = require('../services/imageStore');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  const allowedExt = !ext || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(ext);
  const allowedMime = !mime || mime.startsWith('image/');
  if (allowedExt && allowedMime) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WebP) are allowed.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

async function attachPublicUrl(req, res, next) {
  try {
    if (req.file) {
      req.file.publicUrl = await persistStripImage(req.file);
    }
    next();
  } catch (err) {
    console.error('Image store error:', err && err.message ? err.message : err);
    return res.status(500).json({
      error: 'Could not save the strip photo. Use a JPG or PNG under 10MB and try again.'
    });
  }
}

function handleUpload(req, res, next) {
  upload.single('stripImage')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Image must be 10MB or smaller.' });
    }
    return res.status(400).json({ error: err.message || 'Invalid image upload.' });
  });
}

router.post('/upload', requireAuth, uploadLimiter, handleUpload, sanitizeRequest, attachPublicUrl, analyzeStrip);
router.get('/history', requireAuth, getTestHistory);
router.get('/dashboard', requireAuth, getUserDashboardStats);
router.delete('/:id', requireAuth, deleteTest);

module.exports = router;
