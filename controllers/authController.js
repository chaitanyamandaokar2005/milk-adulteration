const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { authCookieOptions, authCookieClearOptions, isProd } = require('../config/cookies');

function publicUser(user) {
  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    fullName: user.fullName || user.username
  };
}

function sessionPayload(message, token, user) {
  const body = { message, user: publicUser(user) };
  if (!isProd()) body.token = token;
  return body;
}

const register = async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Please provide username, email, and password.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();
    if (!/^[a-z0-9._-]{3,32}$/.test(cleanUsername)) {
      return res.status(400).json({ error: 'Username must be 3–32 characters: letters, numbers, dot, underscore, or hyphen.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    // Check existing
    const existingEmail = await UserModel.findOne({ email: cleanEmail });
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const existingUser = await UserModel.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(400).json({ error: 'This username is already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      fullName: fullName || username
    });

    const token = jwt.sign(
      { id: newUser._id.toString(), username: newUser.username },
      JWT_SECRET,
      { expiresIn: '3d' }
    );

    res.set('Cache-Control', 'no-store');
    res.cookie('token', token, authCookieOptions());

    return res.status(201).json(sessionPayload('Account registered successfully!', token, newUser));
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ error: 'An account with this email or username already exists.' });
    }
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter your username/email and password.' });
    }

    const cleanId = identifier.toLowerCase().trim();

    // Find by username or email
    let user = await UserModel.findOne({ email: cleanId });
    if (!user) {
      user = await UserModel.findOne({ username: cleanId });
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/username or password.' });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      JWT_SECRET,
      { expiresIn: '3d' }
    );

    res.set('Cache-Control', 'no-store');
    res.cookie('token', token, authCookieOptions());

    return res.json(sessionPayload('Login successful!', token, user));
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });
  }
};

const getMe = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    return res.json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user data.' });
  }
};

const logout = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.clearCookie('token', authCookieClearOptions());
  return res.json({ message: 'Logged out successfully.' });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
