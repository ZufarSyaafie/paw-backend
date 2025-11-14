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

	const user = await User.create({
		name,
		email,
		password: hash,
		role: "user",
		isVerified: false,
		otp,
		otpExpiration,
	});

    let demoOtpForFallback = null;
	try {
        // 1. Dia nyoba kirim email
	    await sendOTPEmail(email, otp, "verification");
    } catch (err) {
        // 2. Kalo GAGAL (pasti ETIMEDOUT), dia gak crash
        console.error("EMAIL GAGAL (ETIMEDOUT), pake fallback demoOtp.");
        demoOtpForFallback = otp; // 3. Simpen OTP-nya buat dibocorin
    }

	res.json({
		message: "Registration initiated.",
		email: user.email,
		requiresOTP: true,
        demoOtp: demoOtpForFallback // 4. Kirim OTP-nya (atau null kalo email sukses)
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
        console.error("EMAIL GAGAL (ETIMEDOUT), pake fallback demoOtp.");
        demoOtpForFallback = otp;
    }

	res.json({
		message: "Login credentials verified.",
		email: user.email,
		requiresOTP: true,
        demoOtp: demoOtpForFallback
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
        console.error("EMAIL GAGAL (ETIMEDOUT), pake fallback demoOtp.");
        demoOtpForFallback = otp;
    }

	res.json({
		message: "OTP 'resent' (DEMO MODE).",
        demoOtp: demoOtpForFallback
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
        console.error("EMAIL GAGAL (ETIMEDOUT), pake fallback demoOtp.");
        demoOtpForFallback = otp;
    }

	res.json({
		message: "Login OTP 'resent' (DEMO MODE).",
        demoOtp: demoOtpForFallback
	});
});

exports.googleCallbackSuccess = (req, res) => {
	if (!req.user) return res.status(500).send("No user data from Google OAuth");
	const token = req.user.token;
	const redirectUrl = process.env.FRONTEND_SUCCESS_REDIRECT;
	if (redirectUrl) {
		return res.redirect(`${redirectUrl}?token=${token}`);
	}
	res.json({ token });
};