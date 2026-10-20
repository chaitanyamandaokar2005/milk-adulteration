const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

function isCloudinaryEnabled() {
  return false;
}

function extFromFile(file) {
  const fromName = path.extname((file && file.originalname) || '').toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const mime = ((file && file.mimetype) || '').toLowerCase();
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  return '.jpg';
}

function getBuffer(file) {
  if (file && file.buffer && file.buffer.length) return file.buffer;
  if (file && file.path && fs.existsSync(file.path)) return fs.readFileSync(file.path);
  return null;
}

function saveToDisk(file, buffer) {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `strip-${Date.now()}-${Math.round(Math.random() * 1e9)}${extFromFile(file)}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

async function persistStripImage(file) {
  if (!file) return '';
  try {
    const buffer = getBuffer(file);
    if (!buffer || !buffer.length) return '';
    return saveToDisk(file, buffer);
  } catch (err) {
    console.error('Local image save skipped:', err && err.message ? err.message : err);
    return '';
  }
}

module.exports = {
  isCloudinaryEnabled,
  persistStripImage
};
