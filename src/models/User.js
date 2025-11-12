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
	profilePicture: {
		type: String,
		default: "https://api.dicebear.com/7.x/avataaars/svg?seed=user_default",
	},
	bio: { type: String},
});

module.exports = mongoose.model("User", userSchema);
