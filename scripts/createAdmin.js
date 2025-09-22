// scripts/createAdmin.js (overwrite)
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../config/db'); // pastikan path sesuai
const User = require('../models/User');

async function run() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/pawdb');
  const email = process.env.INIT_ADMIN_EMAIL || 'admin@example.com';
  const username = process.env.INIT_ADMIN_USERNAME || 'admin';
  const password = process.env.INIT_ADMIN_PASSWORD || 'Admin123!';

  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = new User({
    name: username,
    email,
    password: hash, // user model expects password field (pre-save will hash again if plain — but here we store hashed)
    role: 'admin',
    isMember: true,
    membershipDate: new Date()
  });
  await user.save();
  console.log('Admin created:', email, 'password:', password);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
