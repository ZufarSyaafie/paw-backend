const mongoose = require('mongoose');

const roomBookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,  // in hours
    required: true,
    min: 1
  },
  totalCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  payment: {
    status: {
      type: String,
      enum: ['Unpaid', 'Paid'],
      default: 'Unpaid'
    },
    paidAt: Date
  },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('RoomBooking', roomBookingSchema);