const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Register endpoint (untuk membership)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Validasi input required
    if (!name || !email || !password || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, password, dan nomor telepon wajib diisi'
      });
    }

    // Cek apakah email sudah ada
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email sudah terdaftar' 
      });
    }

    // Cek apakah nomor telepon sudah ada
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nomor telepon sudah terdaftar' 
      });
    }

    // Buat user baru (member)
    const user = new User({ 
      name, 
      email, 
      password, 
      phoneNumber,
      isMember: true // otomatis jadi member kalau register
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Pendaftaran member berhasil',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isMember: user.isMember,
          membershipDate: user.membershipDate
        },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Login endpoint (untuk member)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi'
      });
    }

    // Cari user berdasarkan email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Cek password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role,
          isMember: user.isMember,
          membershipDate: user.membershipDate
        },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Endpoint untuk non-member (menggunakan nomor telepon saja)
router.post('/guest-login', async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;

    if (!phoneNumber || !name) {
      return res.status(400).json({
        success: false,
        message: 'Nomor telepon dan nama wajib diisi'
      });
    }

    // Validasi format nomor telepon Indonesia
    const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Format nomor telepon tidak valid'
      });
    }

    // Cari atau buat user non-member
    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      // Buat user baru untuk non-member
      user = new User({
        name: name,
        email: `${phoneNumber}@guest.naratama.com`, // email dummy untuk non-member
        password: 'guest-password-' + Date.now(), // password dummy
        phoneNumber: phoneNumber,
        isMember: false,
        role: 'user'
      });
      await user.save();
    } else {
      // Update nama jika berbeda
      if (user.name !== name) {
        user.name = name;
        await user.save();
      }
    }

    // Generate JWT token untuk guest
    const token = jwt.sign(
      { userId: user._id, isGuest: true }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1d' } // token guest lebih pendek
    );

    res.json({
      success: true,
      message: 'Login guest berhasil',
      data: {
        user: {
          id: user._id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          isMember: user.isMember,
          isGuest: true
        },
        token
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Protected route - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Profile berhasil diambil',
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phoneNumber: req.user.phoneNumber,
        role: req.user.role,
        isMember: req.user.isMember,
        membershipDate: req.user.membershipDate,
        createdAt: req.user.createdAt
      }
    }
  });
});

// Protected route - Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber } = req.body;
    
    // Cek jika nomor telepon sudah dipakai user lain
    if (phoneNumber && phoneNumber !== req.user.phoneNumber) {
      const existingPhone = await User.findOne({ 
        phoneNumber, 
        _id: { $ne: req.user._id } 
      });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: 'Nomor telepon sudah digunakan'
        });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, phoneNumber },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile berhasil diupdate',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role,
          isMember: updatedUser.isMember
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Upgrade dari guest ke member
router.post('/upgrade-membership', authenticateToken, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (req.user.isMember) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah menjadi member'
      });
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password wajib diisi untuk upgrade membership'
      });
    }

    // Cek apakah email sudah dipakai
    const existingEmail = await User.findOne({ 
      email, 
      _id: { $ne: req.user._id } 
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    // Update user menjadi member
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        email,
        password, // akan di-hash otomatis oleh pre-save hook
        isMember: true,
        membershipDate: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Upgrade ke membership berhasil',
      data: {
        user: {
          id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          phoneNumber: updatedUser.phoneNumber,
          role: updatedUser.role,
          isMember: updatedUser.isMember,
          membershipDate: updatedUser.membershipDate
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// CONTOH PENGGUNAAN YANG BENAR
// Gunakan 'authenticateToken', bukan 'requireAuth' atau nama lain
router.get('/profile', authenticateToken, (req, res) => {
  // logika untuk mendapatkan profil user
});

router.get('/admin-data', authenticateToken, requireAdmin, (req, res) => {
  // logika untuk mendapatkan data khusus admin
});

module.exports = router;