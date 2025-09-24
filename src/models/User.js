const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
	name: String,
	email: { type: String, unique: true, required: true },
	password: { type: String }, // optional for Google users
	role: { type: String, enum: ["admin", "user"], default: "user" },
	isVerified: { type: Boolean, default: false },
	otp: { type: String },
	otpExpiration: { type: Date },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
