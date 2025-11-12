const Room = require("../models/Room");
const Booking = require("../models/Booking"); // Ini udah lu import
const snap = require("../services/midtrans");
const { isWeekend, parseISO, differenceInHours } = require("date-fns");
const {
	isWorkingDay,
	isWithinOperatingHours,
	calculateDurationHours,
	validatePhoneNumber,
	normalizePhoneNumber,
} = require("../utils/dateUtils");

exports.listRooms = async (req, res) => {
	try {
		const rooms = await Room.find().lean();

		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const upcomingBookings = await Booking.find({
			status: "confirmed",
			date: { $gte: today } 
		}).select("room");

		const bookedRoomIds = new Set(
			upcomingBookings.map(b => b.room.toString())
		);

		const roomsWithStatus = rooms.map(room => {
			const isBooked = bookedRoomIds.has(room._id.toString());
			
			return {
				...room,
				status: isBooked ? "booked" : "available" // Tambahin field status!
			};
		});

		res.json(roomsWithStatus);

	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error while listing rooms" });
	}
};

exports.getRoom = async (req, res) => {
	if (!req.params.id || req.params.id === 'undefined') {
		return res.status(400).json({ message: "Room ID is required" });
	}
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
		if (roomId) filter.room = roomId;
		if (date) {
			const d = parseISO(date);
			filter.date = d;
		}
		if (userId) filter.user = userId;
		
		filter.status = { $ne: "cancelled" }; // Jangan tampilkan yg batal

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

		// Cek hak akses (pemilik atau admin)
		if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
			return res.status(403).json({
				message: "Anda tidak memiliki izin untuk membatalkan booking ini",
			});
		}

		// Cek aturan 2 jam (hanya berlaku untuk user)
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
		if (!date || !startTime || !endTime || !phone) {
			return res.status(400).json({
				message: "date, startTime, endTime, dan phone wajib diisi",
			});
		}
		if (!validatePhoneNumber(phone)) {
			return res.status(400).json({
				message:
					"Format nomor telepon tidak valid. Gunakan format Indonesia (08xxxxxxxxx)",
			});
		}
		const d = parseISO(date);
		if (isNaN(d.getTime())) {
			return res.status(400).json({
				message: "Format tanggal tidak valid. Gunakan format YYYY-MM-DD",
			});
		}
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		if (d < today) {
			return res.status(400).json({
				message: "Tidak dapat memesan ruangan untuk tanggal yang sudah lewat",
			});
		}
		if (!isWorkingDay(d)) {
			return res.status(400).json({
				message:
					"Peminjaman ruangan hanya tersedia pada hari kerja (Senin-Jumat)",
			});
		}
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
		if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
			return res.status(400).json({
				message: "Format waktu tidak valid. Gunakan format HH:MM (24 jam)",
			});
		}
		const duration = calculateDurationHours(startTime, endTime);
		if (duration < 1) {
			return res.status(400).json({
				message: "Durasi peminjaman minimal 1 jam",
			});
		}
		if (!isWithinOperatingHours(startTime, endTime)) {
			return res.status(400).json({
				message: "Jam operasional ruangan: 08:00 - 17:00",
			});
		}

		// CEK KONFLIK
		const roomId = req.params.id;
		const existingBooking = await Booking.findOne({
			room: roomId,
			date: d,
			status: { $ne: "cancelled" }, 
			$or: [
				{ startTime: { $lte: startTime }, endTime: { $gt: startTime } },
				{ startTime: { $lt: endTime }, endTime: { $gte: endTime } },
				{ startTime: { $gte: startTime }, endTime: { $lte: endTime } },
			],
		});
		if (existingBooking) {
			return res.status(400).json({
				message: `Ruangan sudah dipesan pada jam ${existingBooking.startTime} - ${existingBooking.endTime}`,
			});
		}

		// VALIDASI RUANGAN
		const room = await Room.findById(roomId);
		if (!room) {
			return res.status(404).json({ message: "Ruangan tidak ditemukan" });
		}

		// Cek apakah ruangan berbayar atau gratis
		if (room.price && room.price > 0) {
			
			const totalPrice = room.price * duration;
			const booking = await Booking.create({
				user: req.user.id,
				room: roomId,
				date: d,
				startTime,
				endTime,
				durationHours: duration,
				phone: normalizePhoneNumber(phone),
				totalPrice: totalPrice,
				paymentStatus: "unpaid",
				status: "pending_payment", // Status awal
			});

			const orderId = `booking-${booking._id}`; 
			booking.midtransOrderId = orderId;
			await booking.save();

			const parameter = {
				transaction_details: {
					order_id: orderId,
					gross_amount: totalPrice,
				},
				customer_details: { email: req.user.email },
				item_details: [{
					id: room._id, 
					price: room.price,
					quantity: duration,
					name: `Booking ${room.name} (${duration} jam)`,
				}]
			};
			const transaction = await snap.createTransaction(parameter);
			
			res.status(201).json({
				message: "Ruangan berhasil dipesan, silakan lanjutkan ke pembayaran",
				booking, 
				payment_url: transaction.redirect_url, 
			});
		} else {
			// Ruangan gratis
			const booking = await Booking.create({
				user: req.user.id,
				room: roomId,
				date: d, 
				startTime, 
				endTime, 
				durationHours: duration, 
				phone: normalizePhoneNumber(phone),
				totalPrice: 0, 
				paymentStatus: "paid", // Langsung lunas (gratis)
				status: "confirmed", // Langsung konfirm
			});
			
			const populatedBooking = await Booking.findById(booking._id)
				.populate("user", "name email")
				.populate("room", "name capacity");

			res.status(201).json({
				message: "Ruangan berhasil dipesan (gratis)",
				booking: populatedBooking,
				payment_url: null,
			});
		}
		
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