const express = require('express');
const Room = require('../models/Room');
const RoomBooking = require('../models/RoomBooking');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateBooking } = require('../middleware/bookingvalidation');

// Middleware untuk validasi hari kerja
const validateWorkDay = (req, res, next) => {
  const today = new Date().getDay(); // 0 = Sunday
  const isWorkDay = today >= 1 && today <= 5; // Monday-Friday
  
  if (!isWorkDay) {
    return res.status(400).json({
      success: false,
      message: 'Peminjaman ruangan hanya tersedia di hari kerja (Senin-Jumat)'
    });
  }
  next();
};

const router = express.Router();

// ===== PUBLIC ENDPOINTS =====

// GET /api/room - Lihat semua ruangan (Public)
router.get('/', async (req, res) => {
  try {
    const {
      type,
      available,
      minCapacity,
      maxCapacity
    } = req.query;

    // Build filter
    const filter = {};
    
    if (type) filter.type = type;
    if (available === 'true') filter.isAvailable = true;
    if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };
    if (maxCapacity) filter.capacity = { ...filter.capacity, $lte: parseInt(maxCapacity) };

    const rooms = await Room.find(filter)
      .sort({ name: 1 });

    res.json({
      success: true,
      message: 'Daftar ruangan berhasil diambil',
      data: { rooms }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/room/available - Cek ruangan yang tersedia pada waktu tertentu
router.get('/available', async (req, res) => {
  try {
    const { date, startTime, endTime, type, minCapacity } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Date, startTime, dan endTime wajib diisi'
      });
    }

    // Validasi waktu
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endMinute = parseInt(endTime.split(':')[1]);

    if (startHour * 60 + startMinute >= endHour * 60 + endMinute) {
      return res.status(400).json({
        success: false,
        message: 'Waktu mulai harus sebelum waktu selesai'
      });
    }

    // Cari booking yang bentrok
    const conflictingBookings = await RoomBooking.find({
      bookingDate: new Date(date),
      status: { $in: ['Pending', 'Confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    }).select('room');

    const bookedRoomIds = conflictingBookings.map(b => b.room);

    // Filter ruangan yang tersedia
    const filter = {
      _id: { $nin: bookedRoomIds },
      isAvailable: true
    };

    if (type) filter.type = type;
    if (minCapacity) filter.capacity = { $gte: parseInt(minCapacity) };

    const availableRooms = await Room.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      message: 'Ruangan tersedia berhasil diambil',
      data: {
        availableRooms,
        requestedTime: {
          date,
          startTime,
          endTime
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/room/:id - Detail ruangan (Public)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    // Query booking aktif terpisah
    const activeBookings = await RoomBooking.find({
      room: req.params.id,
      status: { $in: ['Pending', 'Confirmed'] },
      bookingDate: { $gte: new Date() }
    })
    .populate('user', 'name email phoneNumber')
    .sort({ bookingDate: 1, startTime: 1 });

    res.json({
      success: true,
      message: 'Detail ruangan berhasil diambil',
      data: { 
        room,
        activeBookings 
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ===== AUTHENTICATED ENDPOINTS =====

// POST /api/room/book - Booking ruangan (Auth Required)
router.post('/book', 
  authenticateToken, 
  validateWorkDay,
  async (req, res) => {
  try {
    const {
      roomId,
      date,
      startTime,
      endTime,
      purpose,
      numberOfAttendees,
      additionalRequests
    } = req.body;

    // Cek apakah ruangan exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    // Cek kapasitas
    if (numberOfAttendees > room.capacity) {
      return res.status(400).json({
        success: false,
        message: `Jumlah peserta melebihi kapasitas ruangan (max: ${room.capacity})`
      });
    }

    // Cek konflik booking
    const conflictingBooking = await RoomBooking.findOne({
      room: roomId,
      bookingDate: new Date(date),
      status: { $in: ['Pending', 'Confirmed'] },
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        message: 'Ruangan sudah dibooking pada waktu tersebut'
      });
    }

    // Hitung durasi dan total cost
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const startMinute = parseInt(startTime.split(':')[1]);
    const endMinute = parseInt(endTime.split(':')[1]);
    
    const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    const durationHours = Math.ceil(durationMinutes / 60);
    
    const totalCost = room.hourlyRate * durationHours;

    // Buat booking baru sesuai model RoomBooking
    const booking = new RoomBooking({
      room: roomId,
      user: req.user._id,
      bookingDate: new Date(date),
      startTime: startTime,
      endTime: endTime,
      duration: durationHours,
      totalCost: totalCost,
      status: 'Pending',
      notes: `${purpose} - ${numberOfAttendees} peserta. ${additionalRequests || ''}`
    });

    await booking.save();

    // Populate untuk response
    await booking.populate([
      { path: 'room', select: 'name type capacity hourlyRate' },
      { path: 'user', select: 'name email phoneNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking berhasil dibuat',
      data: { booking }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/room/bookings/my - Lihat booking saya (Auth Required)
router.get('/bookings/my', authenticateToken, async (req, res) => {
  try {
    const { status, upcoming } = req.query;
    
    const filter = { user: req.user._id };
    
    if (status) filter.status = status;
    if (upcoming === 'true') {
      filter.bookingDate = { $gte: new Date() };
    }

    const bookings = await RoomBooking.find(filter)
      .populate('room', 'name type capacity hourlyRate')
      .sort({ bookingDate: -1, startTime: -1 });

    res.json({
      success: true,
      message: 'Daftar booking berhasil diambil',
      data: { bookings }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/room/bookings/:id/cancel - Cancel booking (Auth Required)
router.put('/bookings/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    // Cek ownership
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk membatalkan booking ini'
      });
    }

    // Cek apakah sudah bisa dibatalkan
    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking sudah dibatalkan'
      });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Booking yang sudah selesai tidak dapat dibatalkan'
      });
    }

    // Update status
    booking.status = 'Cancelled';
    
    if (req.body.cancellationReason) {
      booking.notes = (booking.notes || '') + ` | CANCELLED: ${req.body.cancellationReason}`;
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking berhasil dibatalkan',
      data: { booking }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ===== ADMIN ENDPOINTS =====

// POST /api/room - Tambah ruangan baru (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const roomData = req.body;

    // Cek apakah nama ruangan sudah ada
    const existingRoom = await Room.findOne({ name: roomData.name });
    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: 'Nama ruangan sudah terdaftar'
      });
    }

    const room = new Room(roomData);
    await room.save();

    res.status(201).json({
      success: true,
      message: 'Ruangan berhasil ditambahkan',
      data: { room }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/room/:id - Update ruangan (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Ruangan berhasil diupdate',
      data: { room }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/room/:id - Hapus ruangan (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Ruangan tidak ditemukan'
      });
    }

    // Cek apakah ada booking aktif
    const activeBookings = await RoomBooking.find({
      room: req.params.id,
      status: { $in: ['Pending', 'Confirmed'] },
      bookingDate: { $gte: new Date() }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat menghapus ruangan yang memiliki booking aktif'
      });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Ruangan berhasil dihapus',
      data: { deletedRoom: room.name }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/room/bookings/all - Lihat semua booking (Admin Only)
router.get('/bookings/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, roomId, date } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    if (roomId) filter.room = roomId;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.bookingDate = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const bookings = await RoomBooking.find(filter)
      .populate('room', 'name type capacity')
      .populate('user', 'name email phoneNumber')
      .sort({ bookingDate: -1, startTime: -1 });

    res.json({
      success: true,
      message: 'Semua booking berhasil diambil',
      data: { bookings }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/room/bookings/:id/confirm - Konfirmasi booking (Admin Only)
router.put('/bookings/:id/confirm', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const booking = await RoomBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking tidak ditemukan'
      });
    }

    if (booking.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Hanya booking dengan status Pending yang bisa dikonfirmasi'
      });
    }

    booking.status = 'Confirmed';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking berhasil dikonfirmasi',
      data: { booking }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;