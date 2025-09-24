const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Generate 6-digit OTP
const generateOTP = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create transporter for sending emails
const createTransporter = () => {
	return nodemailer.createTransport({
		service: "gmail", // or your preferred email service
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS, // Use App Password for Gmail
		},
	});
};

// Send OTP via email
const sendOTPEmail = async (email, otp, type = "verification") => {
	try {
		const transporter = createTransporter();

		const subject =
			type === "login" ? "Login Verification Code" : "Email Verification Code";
		const message =
			type === "login"
				? `Your login verification code is: ${otp}. This code will expire in 10 minutes.`
				: `Your verification code is: ${otp}. This code will expire in 10 minutes.`;

		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: email,
			subject: subject,
			html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #333;">PAW Library System</h2>
					<p style="font-size: 16px;">${message}</p>
					<div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
						<h1 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
					</div>
					<p style="color: #666; font-size: 14px;">
						If you didn't request this code, please ignore this email.
					</p>
				</div>
			`,
		};

		await transporter.sendMail(mailOptions);
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
