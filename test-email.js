// Test script untuk menguji pengiriman email announcement
// Jalankan dengan: node test-email.js

require("dotenv").config();
const mongoose = require("mongoose");
const {
	sendCustomAnnouncementToAllUsers,
} = require("./src/services/emailService");

async function testEmail() {
	try {
		// Connect to database
		await mongoose.connect(
			process.env.MONGODB_URI || "mongodb://localhost:27017/paw-library"
		);
		console.log("Connected to database");

		// Test sending announcement
		const result = await sendCustomAnnouncementToAllUsers(
			"Test Pengumuman",
			"Ini adalah test pengumuman untuk memastikan sistem email berfungsi dengan baik."
		);

		console.log("Email test result:", result);
		console.log(`Successfully sent to ${result.sent} users`);
		console.log(`Failed to send to ${result.failed} users`);
		console.log(`Total eligible users: ${result.total}`);

		process.exit(0);
	} catch (error) {
		console.error("Test failed:", error.message);
		process.exit(1);
	}
}

// Cek environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
	console.error("ERROR: EMAIL_USER and EMAIL_PASS must be set in .env file");
	console.log("Please check EMAIL_SETUP.md for configuration instructions");
	process.exit(1);
}

testEmail();
