const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema({
	bookTitle: { type: String, required: true },
	message: { type: String },
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Announcement", announcementSchema);
