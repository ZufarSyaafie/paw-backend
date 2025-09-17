const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['Diskusi Kecil', 'Pertemuan Besar'],
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  facilities: [{
    type: String
  }],
  hourlyRate: {
    type: Number,
    required: true
  },
  photo: {
    type: String,
    default: 'default-room.jpg'
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);