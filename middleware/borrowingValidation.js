// middleware/borrowingValidation.js
const Book = require('../models/Book');
const Borrowing = require('../models/Borrowing');
const { validateBorrowTime } = require('../utils/dateUtils');
const { estimateBorrowCost } = require('../utils/fineCalculator');

// Validate borrowing request
const validateBorrowRequest = async (req, res, next) => {
  try {
    const { bookId, borrowType } = req.body;
    const errors = [];

    if (!bookId) errors.push('Book ID wajib diisi');
    if (!borrowType) errors.push('Tipe peminjaman wajib diisi');

    const validBorrowTypes = ['Baca di Tempat', 'Bawa Pulang'];
    if (borrowType && !validBorrowTypes.includes(borrowType)) {
      errors.push('Tipe peminjaman harus "Baca di Tempat" atau "Bawa Pulang"');
    }

    const timeValidation = validateBorrowTime ? validateBorrowTime() : { isValid: true, errors: [] };
    if (!timeValidation.isValid) {
      errors.push(...timeValidation.errors);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validasi gagal', errors });
    }

    req.validatedData = { bookId, borrowType };
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saat validasi', error: err.message });
  }
};

// Cek ketersediaan buku
const checkBookAvailability = async (req, res, next) => {
  try {
    const { bookId } = req.validatedData;
    const book = await Book.findById(bookId);

    if (!book) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    if (book.availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Buku sedang tidak tersedia',
        details: { title: book.title, availableStock: book.availableStock, totalStock: book.totalStock }
      });
    }

    req.book = book;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saat cek buku', error: err.message });
  }
};

// Cek limit peminjaman user
const checkUserBorrowingLimits = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const activeBorrowings = await Borrowing.getActiveBorrowings(userId);
    const maxBorrowings = req.user.isMember ? 5 : 2;

    if (activeBorrowings.length >= maxBorrowings) {
      return res.status(400).json({
        success: false,
        message: `Maksimal ${maxBorrowings} peminjaman aktif`,
        details: { currentBorrowings: activeBorrowings.length, maxAllowed: maxBorrowings }
      });
    }

    req.activeBorrowings = activeBorrowings;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saat cek limit', error: err.message });
  }
};

// Validasi pengembalian
const validateReturnRequest = async (req, res, next) => {
  try {
    const { borrowingId } = req.body;
    if (!borrowingId) return res.status(400).json({ success: false, message: 'Borrowing ID wajib diisi' });

    const borrowing = await Borrowing.findById(borrowingId).populate('book', 'title author').populate('user', 'name email');

    if (!borrowing) return res.status(404).json({ success: false, message: 'Record tidak ditemukan' });
    if (borrowing.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Hanya bisa mengembalikan peminjaman sendiri' });
    }
    if (borrowing.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Buku sudah dikembalikan' });
    }

    req.borrowing = borrowing;
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saat validasi return', error: err.message });
  }
};

const calculateBorrowingCosts = (req, res, next) => {
  try {
    const { borrowType } = req.validatedData;
    const costEstimate = estimateBorrowCost ? estimateBorrowCost(borrowType, new Date(), req.user.isMember) : { feeStructure: { commitmentFee: parseInt(process.env.COMMITMENT_FEE || '25000') }, estimatedFine: 0 };

    req.borrowingCosts = { estimate: costEstimate, commitmentFee: { amount: costEstimate.feeStructure.commitmentFee, refundable: true } };
    next();
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error saat hitung biaya', error: err.message });
  }
};

module.exports = { validateBorrowRequest, checkBookAvailability, checkUserBorrowingLimits, validateReturnRequest, calculateBorrowingCosts };
