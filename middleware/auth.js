const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'milk_safety_detector_secret_key_2026_xyz';

const requireAuth = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in or sign up.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }
    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      fullName: user.fullName || user.username
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

const optionalAuth = async (req, res, next) => {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserModel.findById(decoded.id);
      if (user) {
        req.user = {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          fullName: user.fullName || user.username
        };
      }
    } catch (err) {
      // Ignore invalid token for optional auth
    }
  }

  if (!req.user) {
    req.user = {
      id: 'guest',
      username: 'Guest User',
      email: 'guest@milkanalysis.local',
      fullName: 'Guest Tester'
    };
  }

  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  JWT_SECRET
};
