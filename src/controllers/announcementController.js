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
	try {
		// admin only route (enforced by middleware)
		const { title, message } = req.body;

		if (!title || !message) {
			return res.status(400).json({
				message: "title and message are required",
			});
		}

		// create the announcement
		const announcement = await Announcement.create({
			title,
			message,
		});

		// Send announcement email to all registered users
		try {
			const emailResult = await sendCustomAnnouncementToAllUsers(
				title,
				message
			);
			console.log(
				`Custom announcement email sent to ${emailResult.sent} users`
			);

			res.status(201).json({
				announcement,
				emailResult: {
					sent: emailResult.sent,
					failed: emailResult.failed,
					total: emailResult.total,
				},
			});
		} catch (emailError) {
			console.error("Failed to send announcement emails:", emailError.message);
			// Return the announcement even if email sending fails
			res.status(201).json({
				announcement,
				emailResult: {
					sent: 0,
					failed: 0,
					total: 0,
					error: emailError.message,
				},
			});
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
});

exports.sendAnnouncementEmails = asyncHandler(async (req, res) => {
	try {
		// admin only route (enforced by middleware)
		const { id } = req.params;

		// Find the announcement
		const announcement = await Announcement.findById(id);
		if (!announcement) {
			return res.status(404).json({ message: "Announcement not found" });
		}

		const emailTitle = announcement.title || `Announcement: ${announcement.bookTitle}`;
		const emailMessage = announcement.message;

		// Send announcement email to all registered users
		try {
			const emailResult = await sendCustomAnnouncementToAllUsers(
				announcement.bookTitle,
				announcement.message
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
			console.error("Failed to send announcement emails:", emailError.message);
			res.status(500).json({
				message: "Failed to send announcement emails",
				error: emailError.message,
			});
		}
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
});
