// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');

// defensive require for auth middleware
let authMod = {};
try { authMod = require('../middleware/auth'); } catch (e) { authMod = {}; }

const authFn = (typeof authMod === 'function') ? authMod : (authMod.authenticateToken || authMod.authenticate || authMod.auth || null);
const adminFn = (authMod && (authMod.adminOnly || authMod.requireAdmin || authMod.requireAdminMiddleware || authMod.isAdmin)) || null;

// wrapper that ensures middleware is a function (otherwise returns 500 error)
const requireAuth = (req, res, next) => {
  if (typeof authFn === 'function') return authFn(req, res, next);
  return res.status(500).json({ success: false, message: 'Auth middleware not available. Check middleware/auth.js' });
};
const requireAdmin = (req, res, next) => {
  if (typeof adminFn === 'function') return adminFn(req, res, next);
  // fallback check using req.user
  if (!req.user || !req.user.isAdmin) return res.status(403).json({ success: false, message: 'Admin only' });
  return next();
};

// optional mailer
let sendEmail = null;
try {
  const mailer = require('../utils/notificationsMailer');
  sendEmail = mailer && (mailer.sendEmail || mailer.default || null);
} catch (e) {
  sendEmail = null;
}

// GET /api/notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Notification.countDocuments({ user: req.user._id });
    res.json({ success: true, data: notifs, meta: { page, limit, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if (!n) return res.status(404).json({ success: false, message: 'Not found' });
    if (n.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
    n.read = true;
    await n.save();
    res.json({ success: true, message: 'Marked read', data: n });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notifications (admin)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId, title, body, sendEmail: wantEmail } = req.body;
    if (!userId || !title || !body) return res.status(400).json({ success: false, message: 'userId, title, body required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const notif = new Notification({ user: userId, title, body, meta: req.body.meta || {} });
    await notif.save();

    if (wantEmail && user.email && sendEmail) {
      const text = `${title}\n\n${body}`;
      sendEmail(user.email, title, text).catch(e => console.error('Email send failed', e));
    }

    res.json({ success: true, message: 'Notification created', data: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
