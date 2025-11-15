const crypto = require("crypto");
const { Resend } = require("resend");

// Generate 6-digit OTP
const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initialize Resend client
const getResendClient = () => {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) {
		throw new Error(
			"Missing RESEND_API_KEY. Set it in your environment to enable email sending via Resend."
		);
	}
	return new Resend(apiKey);
};

// Resolve FROM address for emails
const getFromAddress = () => {
	const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
	if (!from) {
		throw new Error(
			"Missing EMAIL_FROM (or EMAIL_USER). Set a verified sender for Resend."
		);
	}
	return from;
};

// Send OTP via email
const sendOTPEmail = async (email, otp, type = "verification") => {
	try {
		const resend = getResendClient();
		const from = getFromAddress();

		const subject =
			type === "login" ? "Login Verification Code" : "Email Verification Code";
		const message =
			type === "login"
				? `Your login verification code is: ${otp}. This code will expire in 10 minutes.`
				: `Your verification code is: ${otp}. This code will expire in 10 minutes.`;

		const html = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">Perpustakaan Naratama</h2>
					<p style="font-size: 16px;">${message}</p>
					<div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
						<h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
					</div>
					<p style="color: #666; font-size: 14px;">
						If you didn't request this code, please ignore this email.
					</p>
				</div>
			`;

		await resend.emails.send({
			from,
			to: email,
			subject,
			html,
		});
		console.log(`OTP sent to ${email}`);
		return true;
	} catch (error) {
		console.error("Error sending OTP email:", error);
		throw new Error("Failed to send OTP email");
	}
};

// Validate OTP (check if OTP matches and hasn't expired)
const validateOTP = (userOTP, userOTPExpiration, providedOTP) => {
	if (!userOTP || !userOTPExpiration) {
		return { isValid: false, message: "No OTP found" };
	}

	if (new Date() > userOTPExpiration) {
		return { isValid: false, message: "OTP has expired" };
	}

	if (userOTP !== providedOTP) {
		return { isValid: false, message: "Invalid OTP" };
	}

	return { isValid: true, message: "OTP is valid" };
};

// Generate OTP expiration time (10 minutes from now)
const generateOTPExpiration = () => {
	return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

module.exports = {
	generateOTP,
	sendOTPEmail,
	validateOTP,
	generateOTPExpiration,
};
