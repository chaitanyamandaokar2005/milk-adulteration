const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

function env(name) {
  const v = process.env[name];
  return v ? String(v).trim() : '';
}

function looksConfigured(value) {
  if (!value) return false;
  if (/^your[_-]/i.test(value) || /change-me/i.test(value) || /placeholder/i.test(value)) return false;
  return true;
}

function isCloudinaryEnabled() {
  return (
    looksConfigured(env('CLOUDINARY_CLOUD_NAME')) &&
    looksConfigured(env('CLOUDINARY_API_KEY')) &&
    looksConfigured(env('CLOUDINARY_API_SECRET'))
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: env('CLOUDINARY_CLOUD_NAME'),
    api_key: env('CLOUDINARY_API_KEY'),
    api_secret: env('CLOUDINARY_API_SECRET'),
    secure: true
  });
}

function extFromFile(file) {
  const fromName = path.extname(file.originalname || '').toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const mime = (file.mimetype || '').toLowerCase();
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  return '.jpg';
}

function saveToDisk(file, buffer) {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `strip-${Date.now()}-${Math.round(Math.random() * 1e9)}${extFromFile(file)}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

function getBuffer(file) {
  if (file.buffer && file.buffer.length) return file.buffer;
  if (file.path && fs.existsSync(file.path)) return fs.readFileSync(file.path);
  return null;
}

async function uploadToCloudinary(buffer) {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'milkwise',
        resource_type: 'image',
        timeout: 60000
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.on('error', reject);
    stream.end(buffer);
  });
}

async function persistStripImage(file) {
  if (!file) return null;
  const buffer = getBuffer(file);
  if (!buffer || !buffer.length) {
    throw new Error('No image data received.');
  }

  if (isCloudinaryEnabled()) {
    try {
      const uploaded = await uploadToCloudinary(buffer);
      if (uploaded && uploaded.secure_url) return uploaded.secure_url;
    } catch (err) {
      console.error('Cloudinary upload failed:', err && err.message ? err.message : err);
    }
  }

  return saveToDisk(file, buffer);
}

module.exports = {
  isCloudinaryEnabled,
  persistStripImage
};
