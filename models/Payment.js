const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  borrowing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Borrowing',
    required: false, // Opsi: untuk pembayaran denda
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
  transactionId: String, // ID transaksi dari gateway pembayaran (opsional)
});

module.exports = mongoose.model('Payment', paymentSchema);