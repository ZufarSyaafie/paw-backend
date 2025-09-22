// middleware/auth.js
const jwt = require('jsonwebtoken');
// NOTE: middleware/ berada sejajar dengan folder models/, jadi path ke User harus ../models/User
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    // Ambil header Authorization (berformat "Bearer <token>")
    const authHeader = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }

    // Support "Bearer TOKEN" atau langsung token
    const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token is required' });
    }

    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set — token verification may fail.');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // decoded expected to have userId
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('authenticateToken error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// requireAdmin middleware: gunakan role 'admin' dari user.role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admin required' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
