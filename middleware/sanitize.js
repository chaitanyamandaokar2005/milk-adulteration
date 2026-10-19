function stripDangerousKeys(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(stripDangerousKeys);
  }
  const clean = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) continue;
    clean[key] = stripDangerousKeys(nested);
  }
  return clean;
}

function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object') req.body = stripDangerousKeys(req.body);
  if (req.params && typeof req.params === 'object') req.params = stripDangerousKeys(req.params);
  next();
}

module.exports = { sanitizeRequest };
