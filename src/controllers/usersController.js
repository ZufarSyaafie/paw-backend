const User = require("../models/User");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = 10;

// list users (no sensitive fields)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -otpExpiration");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role = "user", password } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    // if password provided hash it, else create without password (for admin quick create)
    let hash;
    if (password) hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      role,
      password: hash,
      isVerified: true, // admin-created => verified
    });

    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id).select("-password -otp -otpExpiration");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const id = req.user.id;
    const { username, bio, email } = req.body; // Ambil data baru

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};

    if (username !== undefined) {
      updateData.name = username;
    }

    if (bio !== undefined) {
      updateData.bio = bio;
    }

    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ email: email });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ message: "Email already taken" });
      }
      
      updateData.email = email;
      updateData.isVerified = false; 
    }

    if (profilePicture !== undefined) {
      updateData.profilePicture = profilePicture;
    }

    if (Object.keys(updateData).length === 0) {
        return res.status(200).json(user); // Balikin data lama aja
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true } 
    ).select("-password -otp -otpExpiration");

    res.json(updatedUser);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otp -otpExpiration");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "user deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
