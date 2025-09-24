const Announcement = require("../models/Announcement");

exports.listAnnouncements = async (req, res) => {
	// Return newest first
	const list = await Announcement.find().sort({ createdAt: -1 }).limit(50);
	res.json(list);
};
