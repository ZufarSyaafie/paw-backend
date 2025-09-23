const mongoose = require('mongoose'); // ⬅️ lupa diimport kemarin

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrowing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrowing',
    required: false,
  },
  type: {
    type: String,
    enum: ['commitmentFee', 'lateFine'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  transactionId: String,
});

module.exports = mongoose.model('Payment', paymentSchema);
