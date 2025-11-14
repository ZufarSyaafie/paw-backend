const bcrypt = require("bcrypt");
const User = require("../models/User");
const { signToken } = require("../config/jwt");
const {
	generateOTP,
	sendOTPEmail,
	validateOTP,
	generateOTPExpiration,
} = require("../utils/otpService");

const SALT_ROUNDS = 10;
const asyncHandler = require("express-async-handler");

exports.register = asyncHandler(async (req, res) => {
	const { name, email, password } = req.body;
	if (!email || !password)
		return res.status(400).json({ message: "Email & password required" });

	const existing = await User.findOne({ email });
	if (existing)
		return res.status(400).json({ message: "Email already registered" });

	const hash = await bcrypt.hash(password, SALT_ROUNDS);
	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();

	// Create user but keep unverified
	const user = await User.create({
		name,
		email,
		password: hash,
		role: "user",
		isVerified: false,
		otp,
		otpExpiration,
	});

	// Send OTP email (Jika ini gagal, asyncHandler akan menangkapnya)
	await sendOTPEmail(email, otp, "verification");

	res.json({
		message:
			"Registration initiated. Please check your email for OTP verification.",
		email: user.email,
		requiresOTP: true,
	});
});

exports.login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password)
		return res.status(400).json({ message: "Email & password required" });

	const user = await User.findOne({ email });
	if (!user || !user.password)
		return res.status(401).json({ message: "Invalid credentials" });

	const ok = await bcrypt.compare(password, user.password);
	if (!ok) return res.status(401).json({ message: "Invalid credentials" });

	// Generate and send OTP for login
	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();

	// Update user with new OTP
	await User.findByIdAndUpdate(user._id, {
		otp,
		otpExpiration,
	});

	// Send OTP email
	await sendOTPEmail(email, otp, "login");

	res.json({
		message:
			"Login credentials verified. Please check your email for OTP to complete login.",
		email: user.email,
		requiresOTP: true,
	});
});

// Verify OTP for registration and auto-login
exports.verifyRegistrationOTP = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;
	if (!email || !otp)
		return res.status(400).json({ message: "Email and OTP required" });

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	if (user.isVerified)
		return res.status(400).json({ message: "User already verified" });

	const otpValidation = validateOTP(user.otp, user.otpExpiration, otp);
	if (!otpValidation.isValid)
		return res.status(400).json({ message: otpValidation.message });

	// Mark user as verified and clear OTP
	await User.findByIdAndUpdate(user._id, {
		isVerified: true,
		otp: undefined,
		otpExpiration: undefined,
	});

	// Auto-login: generate token
	const token = signToken({
		id: user._id,
		email: user.email,
		role: user.role,
	});

	res.json({
		message: "Registration completed successfully. You are now logged in.",
		token,
		user: {
			id: user._id,
			email: user.email,
			role: user.role,
			name: user.name,
		},
	});
});

// Verify OTP for login
exports.verifyLoginOTP = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;
	if (!email || !otp)
		return res.status(400).json({ message: "Email and OTP required" });

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	const otpValidation = validateOTP(user.otp, user.otpExpiration, otp);
	if (!otpValidation.isValid)
		return res.status(400).json({ message: otpValidation.message });

	// Clear OTP after successful verification
	await User.findByIdAndUpdate(user._id, {
		otp: undefined,
		otpExpiration: undefined,
	});

	// Generate token for login
	const token = signToken({
		id: user._id,
		email: user.email,
		role: user.role,
	});

	res.json({
		message: "Login successful",
		token,
		user: {
			id: user._id,
			email: user.email,
			role: user.role,
			name: user.name,
		},
	});
});

// Resend OTP for registration
exports.resendRegistrationOTP = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: "Email required" });

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	if (user.isVerified)
		return res.status(400).json({ message: "User already verified" });

	// Generate new OTP
	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();

	// Update user with new OTP
	await User.findByIdAndUpdate(user._id, {
		otp,
		otpExpiration,
	});

	// Send new OTP email
	await sendOTPEmail(email, otp, "verification");

	res.json({
		message: "OTP resent successfully. Please check your email.",
	});
});

// Resend OTP for login
exports.resendLoginOTP = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: "Email required" });

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	// Generate new OTP
	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();

	// Update user with new OTP
	await User.findByIdAndUpdate(user._id, {
		otp,
		otpExpiration,
	});

	// Send new OTP email
	await sendOTPEmail(email, otp, "login");

	res.json({
		message: "Login OTP resent successfully. Please check your email.",
	});
});

// OAuth success handler - used by /auth/google/callback route to redirect
exports.googleCallbackSuccess = (req, res) => {
	// passport strategy attached token and user to req.user
	if (!req.user) return res.status(500).send("No user data from Google OAuth");
	const token = req.user.token;
	// If requests come from browser, redirect to frontend with token
	const redirectUrl = process.env.FRONTEND_SUCCESS_REDIRECT;
	if (redirectUrl) {
		// redirect with token in query param
		return res.redirect(`${redirectUrl}?token=${token}`);
	}
	// fallback: send JSON
	res.json({ token });
};
