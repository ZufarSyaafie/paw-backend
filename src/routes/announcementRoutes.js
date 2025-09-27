const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

router.get("/", announcementController.listAnnouncements);

// Admin routes for creating announcements and sending emails
router.post(
	"/",
	verifyToken,
	requireAdmin,
	announcementController.createAnnouncement
);
router.post(
	"/:id/send-emails",
	verifyToken,
	requireAdmin,
	announcementController.sendAnnouncementEmails
);

module.exports = router;
