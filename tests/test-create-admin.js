const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perpustakaan_naratama');
    
    const admin = new User({
      name: 'Admin Naratama',
      email: 'admin@naratama.com',
      password: 'admin123',
      phoneNumber: '081234567999',
      role: 'admin',
      isMember: true
    });
    
    await admin.save();
    console.log('✅ Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();