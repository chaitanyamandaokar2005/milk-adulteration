const cloudinary = require('cloudinary').v2;

function looksConfigured(value) {
  if (!value) return false;
  const v = String(value).trim();
  if (!v) return false;
  if (/^your[_-]/i.test(v) || /change-me/i.test(v) || /placeholder/i.test(v)) return false;
  return true;
}

function isCloudinaryEnabled() {
  return (
    looksConfigured(process.env.CLOUDINARY_CLOUD_NAME) &&
    looksConfigured(process.env.CLOUDINARY_API_KEY) &&
    looksConfigured(process.env.CLOUDINARY_API_SECRET)
  );
}

function configureCloudinary() {
  if (!isCloudinaryEnabled()) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

async function persistStripImage(file) {
  if (!file) return null;

  if (isCloudinaryEnabled()) {
    configureCloudinary();
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'milkwise/strips', resource_type: 'image' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(file.buffer);
    });
    return uploaded.secure_url;
  }

  return `/uploads/${file.filename}`;
}

module.exports = {
  isCloudinaryEnabled,
  persistStripImage
};
