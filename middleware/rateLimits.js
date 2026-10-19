const rateLimit = require('express-rate-limit');

const windowMs = 15 * 60 * 1000;

const authLimiter = rateLimit({
  windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Wait 15 minutes and try again.' }
});

const uploadLimiter = rateLimit({
  windowMs,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many analyses from this network. Wait a few minutes and try again.' }
});

const apiLimiter = rateLimit({
  windowMs,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Slow down and try again.' }
});

module.exports = { authLimiter, uploadLimiter, apiLimiter };
