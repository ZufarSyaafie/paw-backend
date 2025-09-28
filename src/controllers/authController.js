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

// exports.register = async (req, res) => {
// 	try {
// 		const { name, email, password } = req.body;
// 		if (!email || !password)
// 			return res.status(400).json({ message: "Email & password required" });

// 		const existing = await User.findOne({ email });
// 		if (existing)
// 			return res.status(400).json({ message: "Email already registered" });

// 		const hash = await bcrypt.hash(password, SALT_ROUNDS);
// 		const otp = generateOTP();
// 		const otpExpiration = generateOTPExpiration();

// 		// Create user but keep unverified
// 		const user = await User.create({
// 			name,
// 			email,
// 			password: hash,
// 			role: "user",
// 			isVerified: false,
// 			otp,
// 			otpExpiration,
// 		});

// 		// Send OTP email
// 		await sendOTPEmail(email, otp, "verification");

// 		res.json({
// 			message:
// 				"Registration initiated. Please check your email for OTP verification.",
// 			email: user.email,
// 			requiresOTP: true,
// 		});
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({ message: "Server error" });
// 	}
// };
// register (fixed: return otp in response only when flag aktif)
// register (safe: handle missing req.body and catch email errors)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered" });

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

    // try send otp but don't crash app if email fails
    try {
      await sendOTPEmail(email, otp, "verification");
    } catch (emailErr) {
      console.error("Error sending OTP email:", emailErr);
      // continue flow even if email failed
    }

    if (process.env.RETURN_OTP_IN_RESPONSE === "true") {
      return res.json({
        message: "Registration initiated. please check your email for otp verification (dev).",
        email: user.email,
        requiresOTP: true,
        otp, // dev only
      });
    }

    return res.json({
      message: "Registration initiated. please check your email for otp verification.",
      email: user.email,
      requiresOTP: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


// exports.login = async (req, res) => {
// 	try {
// 		const { email, password } = req.body;
// 		if (!email || !password)
// 			return res.status(400).json({ message: "Email & password required" });

// 		const user = await User.findOne({ email });
// 		if (!user || !user.password)
// 			return res.status(401).json({ message: "Invalid credentials" });

// 		const ok = await bcrypt.compare(password, user.password);
// 		if (!ok) return res.status(401).json({ message: "Invalid credentials" });
		
// 		// Generate and send OTP for login
// 		const otp = generateOTP();
// 		const otpExpiration = generateOTPExpiration();

// 		// Update user with new OTP
// 		await User.findByIdAndUpdate(user._id, {
// 			otp,
// 			otpExpiration,
// 		});

// 		// Send OTP email
// 		await sendOTPEmail(email, otp, "login");

// 		res.json({
// 			message:
// 				"Login credentials verified. Please check your email for OTP to complete login.",
// 			email: user.email,
// 			requiresOTP: true,
// 		});
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({ message: "Server error" });
// 	}
// };
// login (fixed: generate otp before possibly returning it; dev-skip option)
// login (safe: handle missing req.body, dev skip otp, catch email errors)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user || !user.password)
      return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // dev shortcut: skip OTP and return token directly
    if (process.env.DEV_SKIP_OTP === "true") {
      const token = signToken({ id: user._id, email: user.email, role: user.role });
      return res.json({
        message: "login successful (dev skip otp)",
        token,
        user: { id: user._id, email: user.email, role: user.role, name: user.name },
      });
    }

    // normal otp flow: generate, store, try send but don't crash if send fails
    const otp = generateOTP();
    const otpExpiration = generateOTPExpiration();

    await User.findByIdAndUpdate(user._id, { otp, otpExpiration });

    try {
      await sendOTPEmail(email, otp, "login");
    } catch (emailErr) {
      console.error("Error sending OTP email:", emailErr);
      // continue: we still tell client requiresOTP (otp might be returned if dev flag)
    }

    if (process.env.RETURN_OTP_IN_RESPONSE === "true") {
      return res.json({
        message: "Login credentials verified. please check your email for otp (dev).",
        email: user.email,
        requiresOTP: true,
        otp, // dev only
      });
    }

    return res.json({
      message: "Login credentials verified. please check your email for otp to complete login.",
      email: user.email,
      requiresOTP: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP for registration and auto-login
exports.verifyRegistrationOTP = async (req, res) => {
	try {
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
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};

// Verify OTP for login
exports.verifyLoginOTP = async (req, res) => {
	try {
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
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};

// // Resend OTP for registration
// exports.resendRegistrationOTP = async (req, res) => {
// 	try {
// 		const { email } = req.body;
// 		if (!email) return res.status(400).json({ message: "Email required" });

// 		const user = await User.findOne({ email });
// 		if (!user) return res.status(404).json({ message: "User not found" });

// 		if (user.isVerified)
// 			return res.status(400).json({ message: "User already verified" });

// 		// Generate new OTP
// 		const otp = generateOTP();
// 		const otpExpiration = generateOTPExpiration();

// 		// Update user with new OTP
// 		await User.findByIdAndUpdate(user._id, {
// 			otp,
// 			otpExpiration,
// 		});

// 		// Send new OTP email
// 		await sendOTPEmail(email, otp, "verification");

// 		res.json({
// 			message: "OTP resent successfully. Please check your email.",
// 		});
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({ message: "Server error" });
// 	}
// };

// // Resend OTP for login
// exports.resendLoginOTP = async (req, res) => {
// 	try {
// 		const { email } = req.body;
// 		if (!email) return res.status(400).json({ message: "Email required" });

// 		const user = await User.findOne({ email });
// 		if (!user) return res.status(404).json({ message: "User not found" });

// 		// Generate new OTP
// 		const otp = generateOTP();
// 		const otpExpiration = generateOTPExpiration();

// 		// Update user with new OTP
// 		await User.findByIdAndUpdate(user._id, {
// 			otp,
// 			otpExpiration,
// 		});

// 		// Send new OTP email
// 		await sendOTPEmail(email, otp, "login");

// 		res.json({
// 			message: "Login OTP resent successfully. Please check your email.",
// 		});
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).json({ message: "Server error" });
// 	}
// };
// resend registration OTP
exports.resendRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body || {};
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

    // Try to send but don't crash the endpoint if email fails
    try {
      await sendOTPEmail(email, otp, "verification");
    } catch (emailErr) {
      console.error("Error sending OTP email:", emailErr.message);
      // If not using mock and email actually failed, still return 200 but indicate warning
      if (process.env.USE_MOCK_EMAIL !== "true" && process.env.RETURN_OTP_IN_RESPONSE !== "true") {
        return res.status(200).json({
          message: "OTP generated but failed to send email. Check email config.",
          error: emailErr.message,
        });
      }
      // else continue to return success (we're in dev/mock mode)
    }

    const resp = { message: "OTP resent successfully. Please check your email." };
    if (process.env.RETURN_OTP_IN_RESPONSE === "true") resp.otp = otp;
    return res.json(resp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// resend login OTP
exports.resendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body || {};
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

    // Try send, but don't crash if it fails
    try {
      await sendOTPEmail(email, otp, "login");
    } catch (emailErr) {
      console.error("Error sending Login OTP email:", emailErr.message);
      if (process.env.USE_MOCK_EMAIL !== "true" && process.env.RETURN_OTP_IN_RESPONSE !== "true") {
        return res.status(200).json({
          message: "OTP generated but failed to send email. Check email config.",
          error: emailErr.message,
        });
      }
    }

    const resp = { message: "Login OTP resent successfully. Please check your email." };
    if (process.env.RETURN_OTP_IN_RESPONSE === "true") resp.otp = otp;
    return res.json(resp);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

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
