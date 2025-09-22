const Room = require('../models/Room');
const User = require('../models/User');

// Get all rooms
const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Check room availability
const checkAvailability = async (req, res) => {
  try {
    const availableRooms = await Room.find({ isAvailable: true });
    res.json({ success: true, data: availableRooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

// Book a room
const bookRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;
    
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan.' });
    }
    
    if (!room.isAvailable) {
      return res.status(409).json({ success: false, message: 'Ruangan ini sudah dipesan.' });
    }

    room.isAvailable = false;
    room.lastBookedBy = userId;
    room.lastBookedAt = new Date();
    await room.save();

    res.json({ success: true, message: 'Ruangan berhasil dipesan!', data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: error.message });
  }
};

module.exports = { getRooms, checkAvailability, bookRoom };