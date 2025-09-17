const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perpustakaan_naratama');
    
    const user = await User.findOneAndUpdate(
      { email: 'admin@naratama.com' },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log('✅ User updated to admin:', user.name, '- Role:', user.role);
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();