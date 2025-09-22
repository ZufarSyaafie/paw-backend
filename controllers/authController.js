// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Register (if you separate register logic into controller)
const register = async (req, res) => {
  try {
    const { name, email, password, role, phoneNumber } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });

    const user = new User({ name, email, password, role: role || 'user', phoneNumber });
    await user.save(); // pre-save hook di User akan hash password

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email atau password' });

    // PENTING: gunakan comparePassword (sesuai User model)
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email atau password' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { register, login, generateToken };
