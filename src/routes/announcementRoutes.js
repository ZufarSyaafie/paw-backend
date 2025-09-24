const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");

router.get("/", announcementController.listAnnouncements);

// Note: no POST route — announcements are created automatically when admin adds book.

module.exports = router;
