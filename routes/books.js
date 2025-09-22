// routes/books.js
const express = require('express');
const router = express.Router();

// dari routes/ ke models/ adalah ../models/Book
const Book = require('../models/Book');
// middleware path relatif ke routes/ => ../middleware/auth
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/books
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      author,
      search,
      sortBy = 'title',
      year,
      available
    } = req.query;

    // Build filter object
    const filters = {};

    if (category) filters.category = category;
    if (author) filters.author = { $regex: author, $options: 'i' };
    if (year) {
      const y = parseInt(year, 10);
      if (!Number.isNaN(y)) {
        filters['details.publishDate'] = {
          $gte: new Date(y, 0, 1),
          $lt: new Date(y + 1, 0, 1)
        };
      }
    }
    if (available === 'true') {
      filters.availableStock = { $gt: 0 };
      filters.status = 'Tersedia';
    }

    // Jika ada search, tambahkan $text (pastikan index text sudah ada di model jika mau full text)
    if (search && search.trim().length > 0) {
      filters.$text = { $search: search.trim() };
    }

    // Sorting options (fallback ke title)
    const sortOptions = {
      title: { title: 1 },
      author: { author: 1 },
      year: { 'details.publishDate': -1 },
      category: { category: 1, title: 1 },
      popularity: { popularity: -1 },
      rating: { averageRating: -1 },
      newest: { addedToCollectionDate: -1 }
    };

    const query = Book.find(filters)
      .select('-reviews')
      .sort(sortOptions[sortBy] || sortOptions.title)
      .limit(Math.min(100, parseInt(limit, 10)))
      .skip((Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10)))
      .lean();

    const [books, total] = await Promise.all([
      query.exec(),
      Book.countDocuments(filters)
    ]);

    res.json({
      success: true,
      message: 'Daftar buku berhasil diambil',
      data: {
        books,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(total / Math.min(100, parseInt(limit, 10))),
          totalBooks: total,
          hasNext: (parseInt(page, 10) * Math.min(100, parseInt(limit, 10))) < total,
          hasPrev: parseInt(page, 10) > 1
        },
        filters: { category, author, search, sortBy, year, available }
      }
    });

  } catch (error) {
    console.error('GET /api/books error', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// POST /api/books - tambah (admin)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookData = req.body;
    // minimal validation
    if (!bookData.title || !bookData.author || !bookData.details || !bookData.details.isbn) {
      return res.status(400).json({ success: false, message: 'title, author, details.isbn required' });
    }
    const book = new Book(bookData);
    await book.save();
    res.status(201).json({ success: true, message: 'Buku berhasil ditambahkan', data: { book } });
  } catch (error) {
    console.error('POST /api/books error', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Duplicate key (possible ISBN already exists)' });
    }
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('reviews.user', 'name isMember')
      .lean();
    if (!book) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    // fire-and-forget increment
    Book.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();
    res.json({ success: true, message: 'Detail buku berhasil diambil', data: { book } });
  } catch (error) {
    console.error('GET /api/books/:id error', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// PUT /api/books/:id - update (admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!book) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    res.json({ success: true, message: 'Buku berhasil diupdate', data: { book } });
  } catch (error) {
    console.error('PUT /api/books/:id error', error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Duplicate key' });
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// DELETE /api/books/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ success: false, message: 'Buku tidak ditemukan' });
    res.json({ success: true, message: 'Buku berhasil dihapus', data: { deletedBook: book.title } });
  } catch (error) {
    console.error('DELETE /api/books/:id error', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;
