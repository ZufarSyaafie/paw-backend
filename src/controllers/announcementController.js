// // const Announcement = require("../models/Announcement");
// // const {
// // 	sendCustomAnnouncementToAllUsers,
// // } = require("../services/emailService");

// // exports.listAnnouncements = async (req, res) => {
// // 	// Return newest first
// // 	const list = await Announcement.find().sort({ createdAt: -1 }).limit(50);
// // 	res.json(list);
// // };

// // exports.createAnnouncement = async (req, res) => {
// // 	try {
// // 		// admin only route (enforced by middleware)
// // 		const { bookTitle, message } = req.body;

// // 		if (!bookTitle || !message) {
// // 			return res.status(400).json({
// // 				message: "bookTitle and message are required",
// // 			});
// // 		}

// // 		// create the announcement
// // 		const announcement = await Announcement.create({
// // 			bookTitle,
// // 			message,
// // 		});

// // 		// Send announcement email to all registered users
// // 		try {
// // 			const emailResult = await sendCustomAnnouncementToAllUsers(
// // 				bookTitle,
// // 				message
// // 			);
// // 			console.log(
// // 				`Custom announcement email sent to ${emailResult.sent} users`
// // 			);

// // 			res.status(201).json({
// // 				announcement,
// // 				emailResult: {
// // 					sent: emailResult.sent,
// // 					failed: emailResult.failed,
// // 					total: emailResult.total,
// // 				},
// // 			});
// // 		} catch (emailError) {
// // 			console.error("Failed to send announcement emails:", emailError.message);
// // 			// Return the announcement even if email sending fails
// // 			res.status(201).json({
// // 				announcement,
// // 				emailResult: {
// // 					sent: 0,
// // 					failed: 0,
// // 					total: 0,
// // 					error: emailError.message,
// // 				},
// // 			});
// // 		}
// // 	} catch (err) {
// // 		console.error(err);
// // 		res.status(500).json({ message: "Server error" });
// // 	}
// // };

// // exports.sendAnnouncementEmails = async (req, res) => {
// // 	try {
// // 		// admin only route (enforced by middleware)
// // 		const { id } = req.params;

// // 		// Find the announcement
// // 		const announcement = await Announcement.findById(id);
// // 		if (!announcement) {
// // 			return res.status(404).json({ message: "Announcement not found" });
// // 		}

// // 		// Send announcement email to all registered users
// // 		try {
// // 			const emailResult = await sendCustomAnnouncementToAllUsers(
// // 				announcement.bookTitle,
// // 				announcement.message
// // 			);

// // 			res.json({
// // 				message: "Announcement emails sent successfully",
// // 				emailResult: {
// // 					sent: emailResult.sent,
// // 					failed: emailResult.failed,
// // 					total: emailResult.total,
// // 				},
// // 			});
// // 		} catch (emailError) {
// // 			console.error("Failed to send announcement emails:", emailError.message);
// // 			res.status(500).json({
// // 				message: "Failed to send announcement emails",
// // 				error: emailError.message,
// // 			});
// // 		}
// // 	} catch (err) {
// // 		console.error(err);
// // 		res.status(500).json({ message: "Server error" });
// // 	}
// // };

// // src/controllers/announcementController.js
// const Announcement = require("../models/Announcement");
// const User = require("../models/User");
// const {
//   sendCustomAnnouncementToAllUsers,
// } = require("../services/emailService");

// // Helper: count verified users
// async function countVerifiedUsers() {
//   try {
//     return await User.countDocuments({
//       isVerified: true,
//       email: { $exists: true, $ne: null },
//     });
//   } catch (e) {
//     console.error("countVerifiedUsers error:", e.message);
//     return 0;
//   }
// }

// const USE_MOCK_EMAIL = process.env.USE_MOCK_EMAIL === "true";

// exports.listAnnouncements = async (req, res) => {
//   try {
//     const list = await Announcement.find().sort({ createdAt: -1 }).limit(50);
//     res.json(list);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.createAnnouncement = async (req, res) => {
//   try {
//     const { bookTitle, message } = req.body;
//     if (!bookTitle || !message) {
//       return res.status(400).json({ message: "bookTitle and message are required" });
//     }

//     const announcement = await Announcement.create({ bookTitle, message });

//     // If mocking email or no real service configured, just return fake "sent"
//     if (USE_MOCK_EMAIL) {
//       const total = await countVerifiedUsers();
//       const emailResult = { sent: total, failed: 0, total };
//       return res.status(201).json({ announcement, emailResult, mock: true });
//     }

//     // Try real send, but fallback to fake success if it fails
//     try {
//       const emailResult = await sendCustomAnnouncementToAllUsers(bookTitle, message);
//       // normalize result shape
//       const r = {
//         sent: emailResult.sent ?? 0,
//         failed: emailResult.failed ?? 0,
//         total: emailResult.total ?? (emailResult.sent ?? 0) + (emailResult.failed ?? 0),
//       };
//       return res.status(201).json({ announcement, emailResult: r, mock: false });
//     } catch (emailError) {
//       console.error("sendCustomAnnouncementToAllUsers failed:", emailError.message);
//       // fallback to fake success count
//       const total = await countVerifiedUsers();
//       const emailResult = { sent: total, failed: 0, total };
//       return res.status(201).json({
//         announcement,
//         emailResult,
//         mock: true,
//         warning: "Email sending failed, returning mocked success for reporting",
//         error: emailError.message,
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };

// exports.sendAnnouncementEmails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const announcement = await Announcement.findById(id);
//     if (!announcement) return res.status(404).json({ message: "Announcement not found" });

//     if (USE_MOCK_EMAIL) {
//       const total = await countVerifiedUsers();
//       const emailResult = { sent: total, failed: 0, total };
//       return res.json({ message: "Announcement emails (mock) sent successfully", announcement, emailResult, mock: true });
//     }

//     try {
//       const emailResult = await sendCustomAnnouncementToAllUsers(
//         announcement.bookTitle,
//         announcement.message
//       );
//       const r = {
//         sent: emailResult.sent ?? 0,
//         failed: emailResult.failed ?? 0,
//         total: emailResult.total ?? (emailResult.sent ?? 0) + (emailResult.failed ?? 0),
//       };
//       return res.json({ message: "Announcement emails sent successfully", announcement, emailResult: r, mock: false });
//     } catch (emailError) {
//       console.error("sendCustomAnnouncementToAllUsers failed:", emailError.message);
//       const total = await countVerifiedUsers();
//       const emailResult = { sent: total, failed: 0, total };
//       return res.status(200).json({
//         message: "Announcement emails (fallback mock) processed",
//         announcement,
//         emailResult,
//         mock: true,
//         warning: "Real send failed, returned mocked success",
//         error: emailError.message,
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// };
// src/controllers/announcementController.js
const Announcement = require("../models/Announcement");
const User = require("../models/User");
const { sendCustomAnnouncementToAllUsers } = require("../services/emailService");

async function countVerifiedUsers() {
  try {
    return await User.countDocuments({ isVerified: true, email: { $exists: true, $ne: null } });
  } catch (e) {
    console.error("countVerifiedUsers error:", e.message);
    return 0;
  }
}

const USE_MOCK_EMAIL = process.env.USE_MOCK_EMAIL === "true";

exports.listAnnouncements = async (req, res) => {
  try {
    const list = await Announcement.find().sort({ createdAt: -1 }).limit(50);
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { bookTitle, message } = req.body;
    if (!bookTitle || !message) return res.status(400).json({ message: "bookTitle and message are required" });

    const announcement = await Announcement.create({ bookTitle, message });

    if (USE_MOCK_EMAIL) {
      const total = await countVerifiedUsers();
      const emailResult = { sent: total, failed: 0, total };
      return res.status(201).json({ announcement, emailResult, mock: true });
    }

    try {
      const emailResult = await sendCustomAnnouncementToAllUsers(bookTitle, message);
      const r = { sent: emailResult.sent ?? 0, failed: emailResult.failed ?? 0, total: emailResult.total ?? ((emailResult.sent ?? 0) + (emailResult.failed ?? 0)) };
      return res.status(201).json({ announcement, emailResult: r, mock: false });
    } catch (emailError) {
      console.error("sendCustomAnnouncementToAllUsers failed:", emailError.message);
      const total = await countVerifiedUsers();
      const emailResult = { sent: total, failed: 0, total };
      return res.status(201).json({
        announcement,
        emailResult,
        mock: true,
        warning: "Email sending failed, returning mocked success for reporting",
        error: emailError.message,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.sendAnnouncementEmails = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ message: "Announcement not found" });

    if (USE_MOCK_EMAIL) {
      const total = await countVerifiedUsers();
      const emailResult = { sent: total, failed: 0, total };
      return res.json({ message: "Announcement emails (mock) sent successfully", announcement, emailResult, mock: true });
    }

    try {
      const emailResult = await sendCustomAnnouncementToAllUsers(announcement.bookTitle, announcement.message);
      const r = { sent: emailResult.sent ?? 0, failed: emailResult.failed ?? 0, total: emailResult.total ?? ((emailResult.sent ?? 0) + (emailResult.failed ?? 0)) };
      return res.json({ message: "Announcement emails sent successfully", announcement, emailResult: r, mock: false });
    } catch (emailError) {
      console.error("sendCustomAnnouncementToAllUsers failed:", emailError.message);
      const total = await countVerifiedUsers();
      const emailResult = { sent: total, failed: 0, total };
      return res.status(200).json({
        message: "Announcement emails (fallback mock) processed",
        announcement,
        emailResult,
        mock: true,
        warning: "Real send failed, returned mocked success",
        error: emailError.message,
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
