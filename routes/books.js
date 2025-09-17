const express = require('express');
const Book = require('../models/Book');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/books - Halaman Daftar Buku (Public)
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
      filters['details.publishDate'] = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1)
      };
    }
    if (available === 'true') {
      filters.availableStock = { $gt: 0 };
      filters.status = 'Tersedia';
    }

    // Search query
    let query = Book.find(filters);
    
    if (search) {
      query = Book.find({
        ...filters,
        $text: { $search: search }
      });
    }

    // Sorting options
    const sortOptions = {
      'title': { title: 1 },
      'author': { author: 1 },
      'year': { 'details.publishDate': -1 },
      'category': { category: 1, title: 1 },
      'popularity': { popularity: -1 },
      'rating': { averageRating: -1 },
      'newest': { addedToCollectionDate: -1 }
    };

    // Execute query with pagination
    const books = await query
      .sort(sortOptions[sortBy] || sortOptions.title)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-reviews') // Exclude reviews untuk performance
      .lean();

    // Count total for pagination
    const total = await Book.countDocuments(search ? 
      { ...filters, $text: { $search: search } } : 
      filters
    );

    res.json({
      success: true,
      message: 'Daftar buku berhasil diambil',
      data: {
        books,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalBooks: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          category,
          author,
          search,
          sortBy,
          year,
          available
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/books/search-suggestions - Auto-suggestion untuk pencarian
router.get('/search-suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: { suggestions: [] }
      });
    }

    const suggestions = await Book.getSearchSuggestions(q, 10);
    
    res.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/books/new-arrivals - Buku-buku baru (untuk pengumuman)
router.get('/new-arrivals', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const newBooks = await Book.getNewArrivals(parseInt(days));
    
    res.json({
      success: true,
      message: 'Buku-buku terbaru berhasil diambil',
      data: { books: newBooks }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/books/popular - Buku populer
router.get('/popular', async (req, res) => {
  try {
    const popularBooks = await Book.find({
      status: 'Tersedia'
    })
    .sort({ popularity: -1, borrowCount: -1 })
    .limit(10)
    .select('-reviews')
    .lean();

    res.json({
      success: true,
      message: 'Buku populer berhasil diambil',
      data: { books: popularBooks }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/books/:id - Detail Buku (Public)
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('reviews.user', 'name isMember')
      .lean();

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Buku tidak ditemukan'
      });
    }

    // Increment view count (tanpa await untuk performance)
    Book.findByIdAndUpdate(req.params.id, { 
      $inc: { viewCount: 1 } 
    }).exec();

    res.json({
      success: true,
      message: 'Detail buku berhasil diambil',
      data: { book }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/books - Tambah Buku (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const bookData = req.body;
    
    // Validasi required fields
    const requiredFields = [
      'title', 'author', 'description', 'category', 'rackLocation',
      'totalStock', 'availableStock'
    ];
    
    for (let field of requiredFields) {
      if (!bookData[field]) {
        return res.status(400).json({
          success: false,
          message: `Field ${field} wajib diisi`
        });
      }
    }

    // Validasi detail fields
    if (!bookData.details) {
      return res.status(400).json({
        success: false,
        message: 'Detail buku wajib diisi'
      });
    }

    const book = new Book(bookData);
    await book.save();

    res.status(201).json({
      success: true,
      message: 'Buku berhasil ditambahkan',
      data: { book }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'ISBN sudah terdaftar'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/books/:id - Update Buku (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Buku tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Buku berhasil diupdate',
      data: { book }
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'ISBN sudah terdaftar'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/books/:id - Hapus Buku (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Buku tidak ditemukan'
      });
    }

    res.json({
      success: true,
      message: 'Buku berhasil dihapus',
      data: { deletedBook: book.title }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/books/:id/reviews - Tambah Ulasan (Auth Required)
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Rating dan komentar wajib diisi'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating harus antara 1-5'
      });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Buku tidak ditemukan'
      });
    }

    await book.addReview(
      req.user._id,
      req.user.name,
      rating,
      comment
    );

    res.status(201).json({
      success: true,
      message: 'Ulasan berhasil ditambahkan',
      data: {
        rating,
        comment,
        averageRating: book.averageRating,
        totalReviews: book.totalReviews
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;