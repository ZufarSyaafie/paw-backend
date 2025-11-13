const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: { type: String },
	capacity: Number,
	facilities: [String],
	price: Number,
	photos: [String],
	status: {
		type: String,
		enum: ["available", "maintenance"],
		default: "available",
	},
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
