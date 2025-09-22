const Borrowing = require('../models/Borrowing');
const Book = require('../models/Book');
const { FEES, estimateBorrowCost, calculateFine } = require('../utils/fineCalculator');
const mongoose = require('mongoose');

// Helper: compute due date based on borrowType and membership
function computeDueDate(borrowType, borrowDate, isMember) {
  const borrow = new Date(borrowDate || Date.now());
  if (borrowType === 'Baca di Tempat') {
    borrow.setHours(borrow.getHours() + 1);
    return borrow;
  }
  const days = isMember ? 21 : 14;
  const due = new Date(borrow);
  due.setDate(due.getDate() + days);
  due.setHours(23,59,59,999);
  return due;
}

const borrowBook = async (req, res) => {
  try {
    const { bookId, borrowType = 'Bawa Pulang' } = req.body;
    const user = req.user;
    if (!bookId) return res.status(400).json({ success: false, message: 'bookId required' });

    // check book availability
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    if (borrowType === 'Bawa Pulang' && (typeof book.availableStock === 'number' && book.availableStock <= 0)) {
      return res.status(400).json({ success: false, message: 'Book not available for borrowing' });
    }

    // Calculate due date & fee
    const dueDate = computeDueDate(borrowType, new Date(), !!user.isMember);
    const commitment = FEES.COMMITMENT_FEE;

    const borrowing = new Borrowing({
      user: user._id,
      book: book._id,
      borrowType,
      commitmentPaid: false,
      commitmentAmount: commitment,
      borrowDate: new Date(),
      dueDate,
      status: 'Active'
    });

    // decrement stock if bring home
    if (borrowType === 'Bawa Pulang') {
      book.availableStock = (book.availableStock || 0) - 1;
      await book.save();
    }

    await borrowing.save();

    res.status(201).json({ success: true, message: 'Book borrowed (commitment pending)', data: { borrowing } });
  } catch (err) {
    console.error('borrowBook err', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const payCommitment = async (req, res) => {
  // This endpoint could alternatively be in payments controller but included for convenience
  try {
    const { borrowingId } = req.body;
    if (!borrowingId) return res.status(400).json({ success: false, message: 'borrowingId required' });
    const borrowing = await Borrowing.findById(borrowingId).populate('book user');
    if (!borrowing) return res.status(404).json({ success: false, message: 'Borrowing not found' });
    if (String(borrowing.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (borrowing.commitmentPaid) return res.status(400).json({ success: false, message: 'Commitment already paid' });

    // In real app, process payment here (third-party or offline). For now, mark as paid.
    borrowing.commitmentPaid = true;
    await borrowing.save();
    res.json({ success: true, message: 'Commitment fee recorded', data: { borrowing } });
  } catch (err) {
    console.error('payCommitment err', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const returnBook = async (req, res) => {
  try {
    const { borrowingId } = req.body;
    if (!borrowingId) return res.status(400).json({ success: false, message: 'borrowingId required' });
    const borrowing = await Borrowing.findById(borrowingId).populate('book user');
    if (!borrowing) return res.status(404).json({ success: false, message: 'Borrowing not found' });

    // only owner or admin can mark return
    if (String(borrowing.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (borrowing.status === 'Returned') {
      return res.status(400).json({ success: false, message: 'Book already returned' });
    }

    const now = new Date();
    const fine = calculateFine(borrowing.dueDate, now, !!borrowing.user.isMember);

    borrowing.returnDate = now;
    borrowing.lateFineAmount = fine;
    borrowing.status = fine > 0 ? 'Overdue' : 'Returned';
    // if returned and fine 0, set returned; if fine > 0, status Overdue until fine paid

    // increment stock back if bawa pulang
    if (borrowing.borrowType === 'Bawa Pulang') {
      const book = await Book.findById(borrowing.book._id);
      book.availableStock = (book.availableStock || 0) + 1;
      await book.save();
    }

    await borrowing.save();

    res.json({ success: true, message: 'Return processed', data: { borrowing, fine } });
  } catch (err) {
    console.error('returnBook err', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const myBorrowings = async (req, res) => {
  try {
    const borrows = await Borrowing.find({ user: req.user._id }).populate('book').sort({ borrowDate: -1 });
    res.json({ success: true, data: borrows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const activeBorrowings = async (req, res) => {
  try {
    const borrows = await Borrowing.find({ status: { $in: ['Active','Overdue'] } }).populate('user book').sort({ dueDate: 1 });
    res.json({ success: true, data: borrows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { borrowBook, returnBook, myBorrowings, activeBorrowings, payCommitment };
