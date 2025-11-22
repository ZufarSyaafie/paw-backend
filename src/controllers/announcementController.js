const Announcement = require("../models/Announcement");
const asyncHandler = require("express-async-handler");
const {
	sendCustomAnnouncementToAllUsers,
} = require("../services/emailService");

exports.listAnnouncements = asyncHandler(async (req, res) => {
	// Return newest first
	const list = await Announcement.find().sort({ createdAt: -1 }).limit(50);
	res.json(list);
});

exports.createAnnouncement = asyncHandler(async (req, res) => {
	// (admin only route - enforced by middleware)
	const { title, message } = req.body;

	if (!title || !message) {
		return res.status(400).json({
			message: "title and message are required",
		});
	}

	// create the announcement
	const announcement = await Announcement.create({
		title, // Pake 'title'
		message,
	});

	// FALLBACK LOGIC
	let emailResultStatus = {};
	try {
		const emailResult = await sendCustomAnnouncementToAllUsers(
			title,
			message
		);
		console.log(
			`Custom announcement email sent to ${emailResult.sent} users`
		);
		emailResultStatus = {
			sent: emailResult.sent,
			failed: emailResult.failed,
			total: emailResult.total,
		};
	} catch (emailError) {
        // Silent Fail
		console.error("EMAIL FAILED (ETIMEDOUT): Failed to send custom announcement:", emailError.message);
		emailResultStatus = {
			sent: 0,
			failed: 0,
			total: 0,
			error: "Email service failed (ETIMEDOUT), announcement created without email.",
		};
	}

	res.status(201).json({
		announcement,
		emailResult: emailResultStatus, // Kirim status email (sukses atau gagal)
	});
});

exports.sendAnnouncementEmails = asyncHandler(async (req, res) => {
	// (admin only route - enforced by middleware)
	const { id } = req.params;

	// Find the announcement
	const announcement = await Announcement.findById(id);
	if (!announcement) {
		return res.status(404).json({ message: "Announcement not found" });
	}

    // FALLBACK BUAT JUDUL
	const emailTitle = announcement.title || announcement.bookTitle;
	const emailMessage = announcement.message;

	// FALLBACK LOGIC (Silent Fail)
	try {
		const emailResult = await sendCustomAnnouncementToAllUsers(
			emailTitle, 
			emailMessage
		);

		res.json({
			message: "Announcement emails sent successfully",
			emailResult: {
				sent: emailResult.sent,
				failed: emailResult.failed,
				total: emailResult.total,
			},
		});
	} catch (emailError) {
		console.error("EMAIL FAILED (ETIMEDOUT): Failed to resend announcement emails:", emailError.message);
        // Kalo gagal, kirim 500 tapi kasih tau emailnya
		res.status(500).json({
			message: "Failed to send announcement emails (Service Error)",
			error: emailError.message,
		});
	}
});