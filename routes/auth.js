// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const generateToken = (user, expires = '7d') => {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: expires });
};

// Register (member)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, membershipType } = req.body;
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Nama, email, password, dan nomor telepon wajib diisi' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });

    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) return res.status(400).json({ success: false, message: 'Nomor telepon sudah terdaftar' });

    const user = new User({ name, email, password, phoneNumber, isMember: true, membershipType: membershipType || 'Regular' });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Pendaftaran member berhasil',
      data: { user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role, isMember: user.isMember, membershipDate: user.membershipDate }, token }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ success: false, message: 'Email atau password salah' });

    const token = generateToken(user);
    res.json({ success: true, message: 'Login berhasil', data: { user: { id: user._id, name: user.name, email: user.email, phoneNumber: user.phoneNumber, role: user.role, isMember: user.isMember }, token } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Guest login (non-member)
router.post('/guest-login', async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;
    if (!phoneNumber || !name) return res.status(400).json({ success: false, message: 'Nomor telepon dan nama wajib diisi' });

    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    if (!phoneRegex.test(phoneNumber)) return res.status(400).json({ success: false, message: 'Format nomor telepon tidak valid' });

    let user = await User.findOne({ phoneNumber });
    if (!user) {
      user = new User({ name, email: `${phoneNumber}@guest.naratama.com`, password: `guest-${Date.now()}`, phoneNumber, isMember: false, role: 'user' });
      await user.save();
    } else if (user.name !== name) {
      user.name = name;
      await user.save();
    }

    const token = generateToken(user, '1d');
    res.json({ success: true, message: 'Login guest berhasil', data: { user: { id: user._id, name: user.name, phoneNumber: user.phoneNumber, isMember: user.isMember }, token } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Profile
router.get('/profile', authenticateToken, async (req, res) => {
  const u = req.user;
  res.json({ success: true, message: 'Profile berhasil diambil', data: { user: { id: u._id, name: u.name, email: u.email, phoneNumber: u.phoneNumber, role: u.role, isMember: u.isMember, membershipDate: u.membershipDate } } });
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    if (phoneNumber && phoneNumber !== req.user.phoneNumber) {
      const existing = await User.findOne({ phoneNumber, _id: { $ne: req.user._id } });
      if (existing) return res.status(400).json({ success: false, message: 'Nomor telepon sudah digunakan' });
    }
    const updated = await User.findByIdAndUpdate(req.user._id, { name, phoneNumber }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, message: 'Profile berhasil diupdate', data: { user: updated } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Upgrade membership
router.post('/upgrade-membership', authenticateToken, async (req, res) => {
  try {
    const { email, password, membershipType } = req.body;
    if (req.user.isMember) return res.status(400).json({ success: false, message: 'Anda sudah menjadi member' });
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib diisi untuk upgrade membership' });

    const existing = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existing) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });

    const updated = await User.findByIdAndUpdate(req.user._id, { email, password, isMember: true, membershipDate: new Date(), membershipType: membershipType || 'Regular' }, { new: true, runValidators: true }).select('-password');
    res.json({ success: true, message: 'Upgrade ke membership berhasil', data: { user: updated } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
