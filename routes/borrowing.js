// routes/borrowing.js
const express = require('express');
const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const { authenticateToken } = require('../middleware/auth');

// import validation & logger middlewares from correct files
const {
  validateBorrowRequest,
  checkBookAvailability,
  checkUserBorrowingLimits,
  validateReturnRequest,
  calculateBorrowingCosts
} = require('../middleware/borrowingValidation');

const { logBorrowingActivity } = require('../middleware/borrowingLogger');

const { calculateDueDate, formatDateTime } = require('../utils/dateUtils');
const { calculateTotalCost } = require('../utils/fineCalculator');

const router = express.Router();

// POST /api/borrowing/borrow - Pinjam Buku (atomic stock update)
router.post(
  '/borrow',
  authenticateToken,
  logBorrowingActivity('BORROW'),
  validateBorrowRequest,
  checkBookAvailability,
  checkUserBorrowingLimits,
  calculateBorrowingCosts,
  async (req, res) => {
    try {
      const { borrowType } = req.validatedData;
      const user = req.user;
      const book = req.book;

      // Atomic decrement: ensure availableStock > 0
      const updatedBook = await Book.findOneAndUpdate(
        { _id: book._id, availableStock: { $gt: 0 } },
        { $inc: { availableStock: -1, borrowCount: 1 } },
        { new: true }
      );

      if (!updatedBook) {
        return res.status(400).json({ success: false, message: 'Buku sudah tidak tersedia' });
      }

      // Calculate due date
      const borrowDate = new Date();
      const dueDate = calculateDueDate(borrowType, user.isMember, borrowDate);

      // Create borrowing record
      const borrowing = new Borrowing({
        user: user._id,
        book: book._id,
        borrowType,
        borrowDate,
        dueDate,
        memberBenefits: {
          extendedPeriod: user.isMember,
          reducedFine: user.isMember,
          priorityAccess: user.isMember
        },
        commitmentFee: {
          amount: book.borrowingRules ? book.borrowingRules.commitmentFee : (process.env.COMMITMENT_FEE ? parseInt(process.env.COMMITMENT_FEE) : 25000),
          status: 'Pending'
        }
      });

      await borrowing.save();

      // Populate for response
      await borrowing.populate([{ path: 'book', select: 'title author category' }, { path: 'user', select: 'name email isMember' }]);

      res.status(201).json({
        success: true,
        message: 'Buku berhasil dipinjam',
        data: {
          borrowing: {
            id: borrowing._id,
            borrowType: borrowing.borrowType,
            borrowDate: borrowing.borrowDate,
            dueDate: borrowing.dueDate,
            status: borrowing.status,
            book: {
              title: borrowing.book.title,
              author: borrowing.book.author,
              category: borrowing.book.category
            },
            commitmentFee: borrowing.commitmentFee
          },
          instructions: {
            commitmentFee: `Bayar commitment fee Rp ${borrowing.commitmentFee.amount.toLocaleString('id-ID')}`,
            dueDate: `Batas pengembalian: ${formatDateTime(dueDate)}`,
            reminder: borrowType === 'Bawa Pulang' ? 'Jangan lupa kembalikan tepat waktu untuk menghindari denda' : 'Waktu membaca minimal 1 jam'
          }
        }
      });
    } catch (error) {
      // If we failed after decrement, try to rollback availableStock increment (best-effort)
      try {
        if (req.book && req.book._id) {
          await Book.findByIdAndUpdate(req.book._id, { $inc: { availableStock: 1 } });
        }
      } catch (e) {
        console.error('Rollback failed:', e);
      }
      res.status(500).json({ success: false, message: 'Server error saat meminjam buku', error: error.message });
    }
  }
);

// POST /api/borrowing/return - Kembalikan Buku
router.post(
  '/return',
  authenticateToken,
  logBorrowingActivity('RETURN'),
  validateReturnRequest,
  async (req, res) => {
    try {
      const borrowing = req.borrowing;
      const returnDate = new Date();

      await borrowing.updateOverdueStatus();

      const totalCost = calculateTotalCost(borrowing.borrowType, borrowing.dueDate, returnDate, borrowing.memberBenefits.reducedFine);

      await borrowing.returnBook();

      // Atomic increment book availableStock
      await Book.findByIdAndUpdate(borrowing.book._id, { $inc: { availableStock: 1 } });

      res.json({
        success: true,
        message: 'Buku berhasil dikembalikan',
        data: {
          borrowing: {
            id: borrowing._id,
            book: borrowing.book.title,
            borrowDate: borrowing.borrowDate,
            dueDate: borrowing.dueDate,
            returnDate: borrowing.returnDate,
            status: borrowing.status
          },
          costs: totalCost,
          nextSteps: totalCost.totalCost > 0 ? 'Silakan bayar denda keterlambatan' : 'Commitment fee akan dikembalikan'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Server error saat mengembalikan buku', error: error.message });
    }
  }
);

// GET /api/borrowing/my-borrowings
router.get('/my-borrowings', authenticateToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    const filter = { user: userId };
    if (status) filter.status = status;

    const borrowings = await Borrowing.find(filter)
      .populate('book', 'title author category')
      .sort({ borrowDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Borrowing.countDocuments(filter);

    const formattedBorrowings = borrowings.map(borrowing => ({
      id: borrowing._id,
      book: { title: borrowing.book.title, author: borrowing.book.author, category: borrowing.book.category },
      borrowType: borrowing.borrowType,
      borrowDate: borrowing.borrowDate,
      dueDate: borrowing.dueDate,
      returnDate: borrowing.returnDate,
      status: borrowing.status,
      commitmentFee: borrowing.commitmentFee
    }));

    res.json({
      success: true,
      message: 'Daftar peminjaman berhasil diambil',
      data: {
        borrowings: formattedBorrowings,
        pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), totalBorrowings: total }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/borrowing/active
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeBorrowings = await Borrowing.getActiveBorrowings(req.user._id);
    const formatted = activeBorrowings.map(b => ({
      id: b._id,
      book: { title: b.book.title, author: b.book.author },
      borrowType: b.borrowType,
      borrowDate: b.borrowDate,
      dueDate: b.dueDate,
      status: b.status
    }));
    res.json({ success: true, message: 'Peminjaman aktif berhasil diambil', data: { activeBorrowings: formatted, summary: { totalActive: formatted.length } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
