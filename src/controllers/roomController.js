const Room = require("../models/Room");
const Booking = require("../models/Booking");
const { snap } = require("../services/midtrans");
const { isWeekend, parseISO, differenceInHours } = require("date-fns");
const {
	isWorkingDay,
	isWithinOperatingHours,
	calculateDurationHours,
	validatePhoneNumber,
	normalizePhoneNumber,
} = require("../utils/dateUtils");
const asyncHandler = require("express-async-handler");

const timeToMinutes = (time) => {
	const [h, m] = time.split(':').map(Number);
	return h * 60 + m;
};

exports.listRooms = asyncHandler(async (req, res) => {
    const rooms = await Room.find().lean();
    
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); 

    const confirmedBookingsToday = await Booking.find({
        status: "confirmed",
        date: todayStart,
    });
    const activeRoomIds = new Set();
    const bufferMinutes = 30; 

    confirmedBookingsToday.forEach(booking => {
        const [startH, startM] = booking.startTime.split(':').map(Number);
        const bookingStartDateTime = new Date(booking.date);
        bookingStartDateTime.setHours(startH, startM, 0, 0);

        const [endH, endM] = booking.endTime.split(':').map(Number);
        const bookingEndDateTime = new Date(booking.date);
        bookingEndDateTime.setHours(endH, endM, 0, 0);
        
        const bookingEndWithBuffer = bookingEndDateTime.getTime() + (bufferMinutes * 60 * 1000); 

        if (now.getTime() >= bookingStartDateTime.getTime() && now.getTime() < bookingEndWithBuffer) {
             activeRoomIds.add(booking.room.toString()); 
        }
    });

    const roomsWithStatus = rooms.map(room => {
        if (room.status === 'maintenance') {
            return { ...room, status: 'maintenance' };
        }
        
        const isCurrentlyBooked = activeRoomIds.has(room._id.toString());
        return {
            ...room,
            status: isCurrentlyBooked ? "booked" : "available" 
        };
    });
    res.json(roomsWithStatus);
});

exports.getRoom = asyncHandler(async (req, res) => {
	if (!req.params.id || req.params.id === 'undefined') {
		return res.status(400).json({ message: "Room ID is required" });
	}
	const room = await Room.findById(req.params.id);
	if (!room) return res.status(404).json({ message: "Book not found" });
	res.json(room);
});

exports.createRoom = asyncHandler(async (req, res) => {
	const room = await Room.create(req.body);
	res.status(201).json(room);
});

exports.updateRoom = asyncHandler(async (req, res) => {
	const room = await Room.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});
	res.json(room);
});

exports.getBookings = asyncHandler(async (req, res) => {
    const { roomId, date } = req.query;
    let filter = {};

    if (req.user.role === 'admin') {
        if (req.query.userId) filter.user = req.query.userId;
    } else {
        filter.user = req.user.id;
    }

    if (roomId) filter.room = roomId;
    if (date) {
        const d = parseISO(date);
        filter.date = d;
    }

    const bookings = await Booking.find(filter)
        .populate("user", "name email")
        .populate("room", "name capacity")
        .sort({ date: 1, startTime: 1 });

    res.json(bookings);
});

exports.cancelBooking = asyncHandler(async (req, res) => {
    const bookingId = req.params.bookingId;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
        return res.status(404).json({ message: "Booking tidak ditemukan" });
    }

    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
            message: "Anda tidak memiliki izin untuk membatalkan booking ini",
        });
    }

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
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({
        message: "Booking berhasil dibatalkan",
        booking,
    });
});

exports.bookRoom = asyncHandler(async (req, res) => {
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
    
    const [startMin] = startTime.split(":").map(Number).slice(-1);
    const [endMin] = endTime.split(":").map(Number).slice(-1);
    if (startMin % 30 !== 0 || endMin % 30 !== 0) {
      return res.status(400).json({
        message: "Waktu peminjaman harus dalam kelipatan 30 menit.",
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

    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    if (!room) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
    }
    
    if (room.status === 'maintenance') {
      return res.status(400).json({
        message: "Ruangan ini tidak tersedia karena sedang dalam perbaikan/maintenance.",
      });
    }
    
    const existingBookings = await Booking.find({
        room: roomId,
        date: d,
        status: { $in: ["pending_payment", "confirmed"] },
    });
    
    const newStartMinutes = timeToMinutes(startTime);
    const newEndMinutes = timeToMinutes(endTime);
    const bufferMinutes = 30;
    
    let isConflict = false;
    existingBookings.some(existing => {
        const existingStartMinutes = timeToMinutes(existing.startTime);
        const existingEndMinutes = timeToMinutes(existing.endTime);
        const existingEndWithBuffer = existingEndMinutes + bufferMinutes;
        const overlap = 
            (newStartMinutes < existingEndWithBuffer) && 
            (newEndMinutes > existingStartMinutes);
        
        if (overlap) {
            isConflict = true; 
        }
        return overlap;
    });

    if (isConflict) {
        return res.status(400).json({
            message: `Konflik jadwal. Ruangan sudah dipesan, termasuk waktu buffer ${bufferMinutes} menit untuk pembersihan.`,
        });
    }

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
            status: "pending_payment", 
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
        const booking = await Booking.create({
            user: req.user.id,
            room: roomId,
            date: d, 
            startTime, 
            endTime, 
            durationHours: duration, 
            phone: normalizePhoneNumber(phone),
            totalPrice: 0, 
            paymentStatus: "paid",
            status: "confirmed",
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
});
