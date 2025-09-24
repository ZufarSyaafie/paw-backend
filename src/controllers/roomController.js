const Room = require("../models/Room");
const Booking = require("../models/Booking");
const { isWeekend, parseISO, differenceInHours } = require("date-fns");
const {
	isWorkingDay,
	isWithinOperatingHours,
	calculateDurationHours,
	validatePhoneNumber,
	normalizePhoneNumber,
} = require("../utils/dateUtils");

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

exports.getBookings = async (req, res) => {
	try {
		const { roomId, date, userId } = req.query;
		let filter = {};

		// Filter berdasarkan ruangan
		if (roomId) filter.room = roomId;

		// Filter berdasarkan tanggal
		if (date) {
			const d = parseISO(date);
			filter.date = d;
		}

		// Filter berdasarkan user (untuk melihat booking sendiri)
		if (userId) filter.user = userId;

		// Hanya tampilkan booking yang tidak dibatalkan
		filter.status = { $ne: "cancelled" };

		const bookings = await Booking.find(filter)
			.populate("user", "name email")
			.populate("room", "name capacity")
			.sort({ date: 1, startTime: 1 });

		res.json(bookings);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};

exports.cancelBooking = async (req, res) => {
	try {
		const bookingId = req.params.bookingId;
		const booking = await Booking.findById(bookingId);

		if (!booking) {
			return res.status(404).json({ message: "Booking tidak ditemukan" });
		}

		// Cek apakah user berhak membatalkan (pemilik booking atau admin)
		if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
			return res.status(403).json({
				message: "Anda tidak memiliki izin untuk membatalkan booking ini",
			});
		}

		// Cek apakah booking masih bisa dibatalkan (minimal 2 jam sebelum waktu mulai)
		const bookingDateTime = new Date(booking.date);
		const [hours, minutes] = booking.startTime.split(":").map(Number);
		bookingDateTime.setHours(hours, minutes, 0, 0);

		const now = new Date();
		const hoursUntilBooking = (bookingDateTime - now) / (1000 * 60 * 60);

		if (hoursUntilBooking < 2 && req.user.role !== "admin") {
			return res.status(400).json({
				message:
					"Booking hanya dapat dibatalkan minimal 2 jam sebelum waktu mulai",
			});
		}

		booking.status = "cancelled";
		await booking.save();

		res.json({
			message: "Booking berhasil dibatalkan",
			booking,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};

exports.bookRoom = async (req, res) => {
	try {
		const { date, startTime, endTime, phone } = req.body;

		// Validasi input required
		if (!date || !startTime || !endTime || !phone) {
			return res.status(400).json({
				message: "date, startTime, endTime, dan phone wajib diisi",
			});
		}

		// Validasi format nomor telepon
		if (!validatePhoneNumber(phone)) {
			return res.status(400).json({
				message:
					"Format nomor telepon tidak valid. Gunakan format Indonesia (08xxxxxxxxx)",
			});
		}

		// Parse dan validasi tanggal
		const d = parseISO(date); // date in YYYY-MM-DD or ISO
		if (isNaN(d.getTime())) {
			return res.status(400).json({
				message: "Format tanggal tidak valid. Gunakan format YYYY-MM-DD",
			});
		}

		// Validasi tanggal tidak boleh di masa lalu
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (d < today) {
			return res.status(400).json({
				message: "Tidak dapat memesan ruangan untuk tanggal yang sudah lewat",
			});
		}

		// Validasi hanya hari kerja (Senin-Jumat)
		if (!isWorkingDay(d)) {
			return res.status(400).json({
				message:
					"Peminjaman ruangan hanya tersedia pada hari kerja (Senin-Jumat)",
			});
		}

		// Validasi format waktu
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
			return res.status(400).json({
				message: "Format waktu tidak valid. Gunakan format HH:MM (24 jam)",
			});
		}

		// Hitung durasi peminjaman
		const [sh, sm] = startTime.split(":").map(Number);
		const [eh, em] = endTime.split(":").map(Number);
		const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm);
		const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em);

		// Validasi waktu mulai tidak boleh lebih besar dari waktu selesai
		if (start >= end) {
			return res.status(400).json({
				message: "Waktu mulai harus lebih awal dari waktu selesai",
			});
		}

		const duration = calculateDurationHours(startTime, endTime);

		// Validasi durasi minimal 1 jam
		if (duration < 1) {
			return res.status(400).json({
				message: "Durasi peminjaman minimal 1 jam",
			});
		}

		// Validasi jam operasional
		if (!isWithinOperatingHours(startTime, endTime)) {
			return res.status(400).json({
				message: "Jam operasional ruangan: 08:00 - 17:00",
			});
		}

		// Cek konflik booking yang sudah ada
		const roomId = req.params.id;
		const existingBooking = await Booking.findOne({
			room: roomId,
			date: d,
			status: { $ne: "cancelled" }, // tidak termasuk yang dibatalkan
			$or: [
				// Case 1: booking baru dimulai saat ada booking lain
				{
					startTime: { $lte: startTime },
					endTime: { $gt: startTime },
				},
				// Case 2: booking baru berakhir saat ada booking lain
				{
					startTime: { $lt: endTime },
					endTime: { $gte: endTime },
				},
				// Case 3: booking baru mengcover booking lain
				{
					startTime: { $gte: startTime },
					endTime: { $lte: endTime },
				},
			],
		});

		if (existingBooking) {
			return res.status(400).json({
				message: `Ruangan sudah dipesan pada jam ${existingBooking.startTime} - ${existingBooking.endTime}`,
			});
		}

		// Validasi ruangan exists
		const room = await Room.findById(roomId);
		if (!room) {
			return res.status(404).json({ message: "Ruangan tidak ditemukan" });
		}

		// Buat booking baru
		const booking = await Booking.create({
			user: req.user.id,
			room: roomId,
			date: d,
			startTime,
			endTime,
			durationHours: duration,
			phone: normalizePhoneNumber(phone),
			status: "confirmed",
		});

		// Populate data untuk response
		const populatedBooking = await Booking.findById(booking._id)
			.populate("user", "name email")
			.populate("room", "name capacity");

		res.status(201).json({
			message: "Ruangan berhasil dipesan",
			booking: populatedBooking,
		});
	} catch (err) {
		console.error(err);
		if (err.name === "ValidationError") {
			return res.status(400).json({
				message: "Data tidak valid",
				errors: Object.values(err.errors).map((e) => e.message),
			});
		}
		res.status(500).json({ message: "Server error" });
	}
};
