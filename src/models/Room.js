const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
	name: { type: String, required: true },
	capacity: Number,
	facilities: [String],
	price: Number,
	photos: [String],
	// bookings will be stored in Booking model; optionally can keep availability summary
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Room", roomSchema);
