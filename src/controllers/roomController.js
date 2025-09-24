const Room = require("../models/Room");
const Booking = require("../models/Booking");
const { isWeekend, parseISO, differenceInHours } = require("date-fns");

exports.listRooms = async (req, res) => {
	const rooms = await Room.find();
	res.json(rooms);
};

exports.getRoom = async (req, res) => {
	const room = await Room.findById(req.params.id);
	if (!room) return res.status(404).json({ message: "Room not found" });
	res.json(room);
};

exports.createRoom = async (req, res) => {
	const room = await Room.create(req.body);
	res.status(201).json(room);
};

exports.updateRoom = async (req, res) => {
	const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});
	res.json(room);
};

exports.bookRoom = async (req, res) => {
	try {
		// validation: only Monday-Friday
		const { date, startTime, endTime, phone } = req.body;
		if (!date || !startTime || !endTime)
			return res
				.status(400)
				.json({ message: "date, startTime, endTime required" });

		const d = parseISO(date); // date in YYYY-MM-DD or ISO
		if (isWeekend(d)) {
			return res
				.status(400)
				.json({ message: "Peminjaman hanya tersedia Senin–Jumat" });
		}

		// compute duration hours
		// create Date objects for start & end combining date + time
		const [sh, sm] = startTime.split(":").map(Number);
		const [eh, em] = endTime.split(":").map(Number);
		const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm);
		const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em);

		const duration = (end - start) / (1000 * 60 * 60);
		if (duration < 1)
			return res.status(400).json({ message: "Durasi minimal 1 jam" });
		if (duration % 0.5 !== 0 && duration % 1 !== 0) {
			// allow half hour? spec said minimal 1 hour — we simply check >=1
		}

		// check overlapping bookings for same room
		const roomId = req.params.id;
		const existing = await Booking.findOne({
			room: roomId,
			date: d,
			$or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
		});
		if (existing)
			return res.status(400).json({ message: "Slot sudah dipesan" });

		const booking = await Booking.create({
			user: req.user.id,
			room: roomId,
			date: d,
			startTime,
			endTime,
			durationHours: duration,
			phone,
			status: "confirmed",
		});

		res.status(201).json(booking);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};
