const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    unique: true,
  },
  capacity: {
    type: Number,
    required: true,
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