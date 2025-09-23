// models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { // ubah dari roomName → name biar konsisten
    type: String,
    required: true,
    unique: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  hourlyRate: { // biar bisa dihitung biaya booking
    type: Number,
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  lastBookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lastBookedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Room', roomSchema);
