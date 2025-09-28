// // scripts/promoteAdmin.js
// require('dotenv').config();
// const mongoose = require('mongoose');
// const User = require('../src/models/User');

// async function run(email) {
//   if (!email) {
//     console.error('usage: node scripts/promoteAdmin.js user@email.com');
//     process.exit(1);
//   }
//   await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//   const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { new: true });
//   if (!user) console.log('user not found');
//   else console.log('promoted:', user.email, '-> role:', user.role);
//   await mongoose.disconnect();
//   process.exit(0);
// }

// run(process.argv[2]);

// // node scripts/promoteAdmin.js test@mail.com
// scripts/seedAdmin.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../src/models/User");
const bcrypt = require("bcrypt");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const email = "admin@mail.test";
  const existing = await User.findOne({ email });
  if (existing) return console.log("admin exists");
  const hash = await bcrypt.hash("admin123", 10);
  const u = await User.create({ name: "admin", email, password: hash, role: "admin", isVerified: true });
  console.log("admin created:", u._id);
  process.exit(0);
}
seed().catch(e=>{console.error(e);process.exit(1);});
