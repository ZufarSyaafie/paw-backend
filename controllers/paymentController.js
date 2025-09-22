const Payment = require('../models/Payment'); // Gunakan model Payment
const Borrowing = require('../models/Borrowing');
const User = require('../models/User');

// Endpoint untuk membayar biaya komitmen
const payCommitmentFee = async (req, res) => {
  try {
    const { borrowingId } = req.body;
    const borrowing = await Borrowing.findById(borrowingId);
    if (!borrowing) {
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (borrowing.commitmentFee.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Commitment fee sudah dibayar' });
    }

    // 1. Buat record pembayaran baru
    const payment = new Payment({
      user: req.user._id,
      borrowing: borrowingId,
      type: 'commitment',
      amount: borrowing.commitmentFee.amount,
    });
    await payment.save();

    // 2. Perbarui status di model Borrowing
    borrowing.commitmentFee.status = 'Paid';
    borrowing.commitmentFee.paidAt = new Date();
    await borrowing.save();

    res.json({ success: true, message: 'Commitment fee berhasil dibayar', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Endpoint untuk membayar denda
const payFine = async (req, res) => {
  try {
    const { borrowingId } = req.body;
    const borrowing = await Borrowing.findById(borrowingId);
    if (!borrowing) {
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }
    
    // Asumsi: denda sudah dihitung sebelumnya oleh method `updateOverdueStatus` di model Borrowing
    if (!borrowing.fine || borrowing.fine.amount <= 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada denda untuk peminjaman ini' });
    }
    
    // 1. Buat record pembayaran baru
    const payment = new Payment({
      user: req.user._id,
      borrowing: borrowingId,
      type: 'fine',
      amount: borrowing.fine.amount,
    });
    await payment.save();
    
    // 2. Perbarui status di model Borrowing
    borrowing.fine.status = 'Paid';
    borrowing.fine.paidAt = new Date();
    await borrowing.save();

    res.json({ success: true, message: 'Denda berhasil dibayar', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { payCommitmentFee, payFine };