console.log('🚀 Testing User Creation...');

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const testCreateUser = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create new user
    const user = new User({
      name: 'John Doe',
      email: 'john@example.com',
      password: '123456'
    });

    const savedUser = await user.save();
    console.log('✅ User created successfully:');
    console.log({
      id: savedUser._id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
      passwordHash: savedUser.password.substring(0, 20) + '...',
      createdAt: savedUser.createdAt
    });

    // Test password comparison
    const isCorrect = await savedUser.comparePassword('123456');
    console.log('✅ Password comparison test:', isCorrect ? 'PASSED' : 'FAILED');

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
  }
};

testCreateUser();