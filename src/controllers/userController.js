// src/controllers/userController.js
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const User = require("../models/User");
const SALT_ROUNDS = 10;

// list users (admin only) - hide sensitive fields
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-password -otp -otpExpiration -__v").lean();
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// create user (public/dev). if password provided -> hash it
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};
    if (!email) return res.status(400).json({ message: "email required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "email already registered" });

    let hash;
    if (password) hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password: hash,
      role: role || "user",
      isVerified: process.env.DEV_SKIP_OTP === "true" ? true : false,
    });

    const out = user.toObject();
    delete out.password;
    delete out.otp;
    delete out.otpExpiration;
    delete out.__v;

    return res.status(201).json(out);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// get single user by id (admin)
exports.getUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ message: "invalid id format" });

    const user = await User.findById(id, "-password -otp -otpExpiration -__v").lean();
    if (!user) return res.status(404).json({ message: "user not found" });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// src/controllers/userController.js

// delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "invalid id format" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "user not found" });

    return res.json({ message: "user deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

