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

// Cookie helpers
const isProd = process.env.NODE_ENV === "production";
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "token";

function getCookieOptions() {
	// default 7 days
	const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
	return {
		httpOnly: true,
		secure: isProd, // must be true for SameSite=None on HTTPS
		sameSite: isProd ? "none" : "lax",
		maxAge: sevenDaysMs,
		path: "/",
	};
}

exports.register = asyncHandler(async (req, res) => {
	const { name, email, password, phone } = req.body;
	if (!email || !password)
		return res.status(400).json({ message: "Email & password required" });

	const existing = await User.findOne({ email });
	if (existing)
		return res.status(400).json({ message: "Email already registered" });

	const hash = await bcrypt.hash(password, SALT_ROUNDS);
	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();

	const user = await User.create({
		name,
		email,
		phone,
		password: hash,
		role: "user",
		isVerified: false,
		otp,
		otpExpiration,
	});

	let demoOtpForFallback = null;
	try {
		await sendOTPEmail(email, otp, "verification");
	} catch (err) {
		console.error("EMAIL GAGAL (ETIMEDOUT), pake fallback demoOtp.");
		demoOtpForFallback = otp;
	}

	res.json({
		message: "Registration initiated.",
		email: user.email,
		requiresOTP: true,
		demoOtp: demoOtpForFallback,
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

	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();

	await User.findByIdAndUpdate(user._id, {
		otp,
		otpExpiration,
	});

	let demoOtpForFallback = null;
	try {
		await sendOTPEmail(email, otp, "login");
	} catch (err) {
		console.error("EMAIL FAILED (ETIMEDOUT), pake fallback demoOtp.");
		demoOtpForFallback = otp;
	}

	res.json({
		message: "Login credentials verified.",
		email: user.email,
		requiresOTP: true,
		demoOtp: demoOtpForFallback,
	});
});

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

	await User.findByIdAndUpdate(user._id, {
		isVerified: true,
		otp: undefined,
		otpExpiration: undefined,
	});

	const token = signToken({
		id: user._id,
		email: user.email,
		role: user.role,
		authMethod: "local",
	});

	// set httpOnly cookie for auth
	res.cookie(COOKIE_NAME, token, getCookieOptions());

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

exports.verifyLoginOTP = asyncHandler(async (req, res) => {
	const { email, otp } = req.body;
	if (!email || !otp)
		return res.status(400).json({ message: "Email and OTP required" });

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	const otpValidation = validateOTP(user.otp, user.otpExpiration, otp);
	if (!otpValidation.isValid)
		return res.status(400).json({ message: otpValidation.message });

	await User.findByIdAndUpdate(user._id, {
		otp: undefined,
		otpExpiration: undefined,
	});

	const token = signToken({
		id: user._id,
		email: user.email,
		role: user.role,
		authMethod: "local",
	});

	// set httpOnly cookie for auth
	res.cookie(COOKIE_NAME, token, getCookieOptions());

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

exports.resendRegistrationOTP = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: "Email required" });
	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });
	if (user.isVerified)
		return res.status(400).json({ message: "User already verified" });

	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();
	await User.findByIdAndUpdate(user._id, { otp, otpExpiration });

	let demoOtpForFallback = null;
	try {
		await sendOTPEmail(email, otp, "verification");
	} catch (err) {
		console.error("EMAIL FAILED (ETIMEDOUT), fallback demoOtp.");
		demoOtpForFallback = otp;
	}

	res.json({
		message: "OTP 'resent' (DEMO MODE).",
		demoOtp: demoOtpForFallback,
	});
});

exports.resendLoginOTP = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: "Email required" });
	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();
	await User.findByIdAndUpdate(user._id, { otp, otpExpiration });

	let demoOtpForFallback = null;
	try {
		await sendOTPEmail(email, otp, "login");
	} catch (err) {
		console.error("EMAIL FAILED (ETIMEDOUT), fallback demoOtp.");
		demoOtpForFallback = otp;
	}

	res.json({
		message: "Login OTP 'resent' (DEMO MODE).",
		demoOtp: demoOtpForFallback,
	});
});

exports.googleCallbackSuccess = (req, res) => {
	if (!req.user) return res.status(500).send("No user data from Google OAuth");
	const token = req.user.token;
	// set httpOnly cookie for auth
	res.cookie(COOKIE_NAME, token, getCookieOptions());
	const redirectUrl = process.env.FRONTEND_SUCCESS_REDIRECT;
	if (redirectUrl) {
		// Keep token in query for backward-compatibility, but cookie is now primary
		return res.redirect(`${redirectUrl}?token=${token}`);
	}
	res.json({ token });
};

exports.logout = asyncHandler(async (req, res) => {
	// Clear cookie using same attributes
	res.clearCookie(COOKIE_NAME, getCookieOptions());
	res.json({ message: "Logged out" });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) return res.status(400).json({ message: "Email required" });

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	// Check if user has password (not Google OAuth user)
	if (!user.password) {
		return res.status(400).json({
			message: "This account uses Google login. Please use Google to sign in.",
		});
	}

	const otp = generateOTP();
	const otpExpiration = generateOTPExpiration();

	await User.findByIdAndUpdate(user._id, {
		otp,
		otpExpiration,
	});

	let demoOtpForFallback = null;
	try {
		await sendOTPEmail(email, otp, "reset-password");
	} catch (err) {
		console.error("EMAIL FAILED (ETIMEDOUT), fallback demoOtp.");
		demoOtpForFallback = otp;
	}

	res.json({
		message: "Password reset OTP sent to your email.",
		email: user.email,
		demoOtp: demoOtpForFallback,
	});
});

exports.resetPassword = asyncHandler(async (req, res) => {
	const { email, otp, newPassword } = req.body;

	if (!email || !otp || !newPassword) {
		return res.status(400).json({
			message: "Email, OTP, and new password are required",
		});
	}

	if (newPassword.length < 6) {
		return res.status(400).json({
			message: "Password must be at least 6 characters long",
		});
	}

	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ message: "User not found" });

	const otpValidation = validateOTP(user.otp, user.otpExpiration, otp);
	if (!otpValidation.isValid) {
		return res.status(400).json({ message: otpValidation.message });
	}

	// Hash new password
	const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

	// Update password and clear OTP
	await User.findByIdAndUpdate(user._id, {
		password: hash,
		otp: undefined,
		otpExpiration: undefined,
	});

	res.json({
		message:
			"Password has been reset successfully. You can now login with your new password.",
	});
});
