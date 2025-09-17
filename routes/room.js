const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const RoomBooking = require('../models/RoomBooking');
const { authenticateToken } = require('../middleware/auth');
const { validateBookingTime } = require('../middleware/roomBooking');

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Check room availability
router.get('/check-availability', async (req, res) => {
  try {
    const { date, roomId } = req.query;
    const bookings = await RoomBooking.find({
      room: roomId,
      bookingDate: new Date(date),
      status: { $ne: 'Cancelled' }
    });

    const availableSlots = getAvailableTimeSlots(bookings);
    res.json({
      success: true,
      data: {
        availableSlots,
        existingBookings: bookings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Book a room
router.post('/book', authenticateToken, validateBookingTime, async (req, res) => {
  try {
    const { roomId, date, startTime, endTime } = req.body;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    const duration = calculateDuration(startTime, endTime);
    const totalCost = duration * room.hourlyRate;

    const booking = new RoomBooking({
      room: roomId,
      user: req.user._id,
      bookingDate: date,
      startTime,
      endTime,
      duration,
      totalCost
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;