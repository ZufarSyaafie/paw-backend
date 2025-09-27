const Announcement = require("../models/Announcement");
const {
	sendCustomAnnouncementToAllUsers,
} = require("../services/emailService");

exports.listAnnouncements = async (req, res) => {
	// Return newest first
	const list = await Announcement.find().sort({ createdAt: -1 }).limit(50);
	res.json(list);
};

exports.createAnnouncement = async (req, res) => {
	try {
		// admin only route (enforced by middleware)
		const { bookTitle, message } = req.body;

		if (!bookTitle || !message) {
			return res.status(400).json({
				message: "bookTitle and message are required",
			});
		}

		// create the announcement
		const announcement = await Announcement.create({
			bookTitle,
			message,
		});

		// Send announcement email to all registered users
		try {
			const emailResult = await sendCustomAnnouncementToAllUsers(
				bookTitle,
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
};

exports.sendAnnouncementEmails = async (req, res) => {
	try {
		// admin only route (enforced by middleware)
		const { id } = req.params;

		// Find the announcement
		const announcement = await Announcement.findById(id);
		if (!announcement) {
			return res.status(404).json({ message: "Announcement not found" });
		}

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
};
