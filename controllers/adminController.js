const Book = require('../models/Book');
const Borrowing = require('../models/Borrowing');
const User = require('../models/User');
const Room = require('../models/Room');

// Dashboard stats
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalBorrowed = await Borrowing.countDocuments({ status: 'Active' });
    const availableRooms = await Room.countDocuments({ isAvailable: true });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalBooks,
        totalBorrowed,
        availableRooms,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Overdue list
const getOverdue = async (req, res) => {
  try {
    const overdue = await Borrowing.find({
      dueDate: { $lt: new Date() },
      status: 'Active',
    })
      .populate('book', 'title')
      .populate('user', 'name phoneNumber');

    res.json({ success: true, data: overdue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getOverdue };