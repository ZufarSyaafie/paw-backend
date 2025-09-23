// routes/room.js
const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const RoomBooking = require('../models/RoomBooking');
const { authenticateToken } = require('../middleware/auth');

// hitung durasi (jam)
const calculateDuration = (start, end) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh + em / 60) - (sh + sm / 60);
};

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json({ success: true, data: { rooms } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Check room availability
router.get('/:id/availability', async (req, res) => {
  try {
    const { date } = req.query;
    const bookings = await RoomBooking.find({
      room: req.params.id,
      bookingDate: new Date(date),
      status: { $ne: 'Cancelled' },
    });

    res.json({
      success: true,
      data: {
        existingBookings: bookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Book a room
router.post('/:id/book', authenticateToken, async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan' });

    const duration = calculateDuration(startTime, endTime);
    if (duration <= 0) return res.status(400).json({ success: false, message: 'Durasi booking tidak valid' });

    const totalCost = duration * room.hourlyRate;

    const booking = new RoomBooking({
      room: room._id,
      user: req.user._id,
      bookingDate: new Date(date),
      startTime,
      endTime,
      duration,
      totalCost,
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: { booking },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cancel booking
router.delete('/:id/cancel/:bookingId', authenticateToken, async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking berhasil dibatalkan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
