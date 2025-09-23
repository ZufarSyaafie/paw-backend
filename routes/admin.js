// routes/admin.js
const express = require('express');
const router = express.Router();
const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { calculateFine } = require('../utils/fineCalculator');

const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeBorrowings = await Borrowing.countDocuments({ status: { $in: ['Active', 'Overdue'] } });
    const paymentsAgg = await Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]);
    const totalPayments = (paymentsAgg[0] && paymentsAgg[0].total) || 0;
    res.json({ success: true, data: { totalBooks, totalUsers, activeBorrowings, totalPayments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/promote
router.post('/promote', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: 'userId required' });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'admin';
    await user.save();
    res.json({ success: true, message: 'User promoted', data: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/overdue
router.get('/overdue', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const borrows = await Borrowing.find({ status: { $in: ['Active', 'Overdue'] } }).populate('user book');
    const list = borrows.map(b => {
      const fine = calculateFine(b.dueDate || b.dueAt || b.due, b.returnDate, b.user && b.user.isMember);
      return { borrow: b, fine, isOver: fine > 0 };
    }).filter(x => x.isOver);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

