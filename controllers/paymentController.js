// controllers/paymentController.js
const Payment = require('../models/Payment');
const Borrowing = require('../models/Borrowing');

// Commitment Fee
async function payCommitmentFee(req, res) {
  try {
    const { borrowingId } = req.body;
    const borrowing = await Borrowing.findById(borrowingId);
    if (!borrowing) {
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (borrowing.commitmentFee?.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Commitment fee sudah dibayar' });
    }

    const payment = new Payment({
      user: req.user._id,
      borrowing: borrowingId,
      type: 'commitmentFee',
      amount: borrowing.commitmentFee.amount,
    });
    await payment.save();

    borrowing.commitmentFee.status = 'Paid';
    borrowing.commitmentFee.paidAt = new Date();
    await borrowing.save();

    res.json({ success: true, message: 'Commitment fee berhasil dibayar', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Fine
async function payFine(req, res) {
  try {
    const { borrowingId } = req.body;
    const borrowing = await Borrowing.findById(borrowingId);
    if (!borrowing) {
      return res.status(404).json({ success: false, message: 'Peminjaman tidak ditemukan' });
    }

    if (!borrowing.fine || borrowing.fine.amount <= 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada denda untuk peminjaman ini' });
    }

    const payment = new Payment({
      user: req.user._id,
      borrowing: borrowingId,
      type: 'lateFine',
      amount: borrowing.fine.amount,
    });
    await payment.save();

    borrowing.fine.status = 'Paid';
    borrowing.fine.paidAt = new Date();
    await borrowing.save();

    res.json({ success: true, message: 'Denda berhasil dibayar', data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { payCommitmentFee, payFine };

