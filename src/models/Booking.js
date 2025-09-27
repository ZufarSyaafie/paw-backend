const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
	date: { type: Date, required: true },
	startTime: { type: String, required: true }, // e.g. "13:00"
	endTime: { type: String, required: true }, // e.g. "15:00"
	durationHours: { type: Number, required: true },
	phone: { type: String, required: true }, // Nomor telepon wajib diisi
	status: {
		type: String,
		enum: ["pending", "confirmed", "cancelled"],
		default: "pending",
	},
	createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
