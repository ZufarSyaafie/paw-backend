const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const borrowingRoutes = require('./routes/borrowing');
const roomRoutes = require('./routes/room'); // Ubah baris ini

app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrowing', borrowingRoutes);
app.use('/api/room', roomRoutes); // dari '/api/rooms' menjadi '/api/room'

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Perpustakaan Naratama API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      borrowing: '/api/borrowing',
      rooms: '/api/room'
    }
  });
});

// Tambahkan endpoint ini di app.js sebelum error handler
app.get('/seed-naratama-data', async (req, res) => {
  try {
    const Book = require('./models/Book');
    const Room = require('./models/Room');
    
    // Hapus data lama jika ada
    await Book.deleteMany({});
    await Room.deleteMany({});
    
    // Sample rooms sesuai kriteria
    const rooms = await Room.create([
      {
        name: "Ruang Diskusi Kecil A",
        type: "Diskusi Kecil",
        capacity: 6,
        facilities: ["Whiteboard", "AC", "WiFi"],
        hourlyRate: 25000,
        isAvailable: true
      },
      {
        name: "Ruang Diskusi Kecil B",
        type: "Diskusi Kecil", 
        capacity: 8,
        facilities: ["Smart TV", "AC", "WiFi"],
        hourlyRate: 30000,
        isAvailable: true
      },
      {
        name: "Ruang Diskusi Kecil C",
        type: "Diskusi Kecil",
        capacity: 6,
        facilities: ["Proyektor", "AC", "WiFi"],
        hourlyRate: 35000,
        isAvailable: true
      },
      {
        name: "Ruang Diskusi Kecil D", 
        type: "Diskusi Kecil",
        capacity: 10,
        facilities: ["Smart Board", "AC", "WiFi"],
        hourlyRate: 40000,
        isAvailable: true
      },
      {
        name: "Ruang Diskusi Kecil E",
        type: "Diskusi Kecil",
        capacity: 8, 
        facilities: ["Whiteboard", "AC", "WiFi"],
        hourlyRate: 28000,
        isAvailable: true
      },
      {
        name: "Ruang Pertemuan Besar 1",
        type: "Pertemuan Besar",
        capacity: 30,
        facilities: ["Proyektor HD", "Sound System", "AC", "WiFi"],
        hourlyRate: 75000,
        isAvailable: true
      },
      {
        name: "Ruang Pertemuan Besar 2",
        type: "Pertemuan Besar", 
        capacity: 25,
        facilities: ["Smart TV", "Sound System", "AC", "WiFi"],
        hourlyRate: 80000,
        isAvailable: true
      }
    ]);

    // Sample books - PERBAIKI LANGUAGE
    const books = await Book.create([
      {
        title: "Pemrograman JavaScript Modern",
        author: "Ahmad Santoso",
        description: "Panduan JavaScript untuk web development",
        category: "Teknologi",
        rackLocation: "A1-001",
        totalStock: 5,
        availableStock: 5,
        details: {
          publisher: "Tech Books",
          isbn: "978-0123456789",
          publishDate: new Date("2024-01-01"),
          pages: 350,
          language: "English", // GANTI INI
          dimensions: { length: 20, width: 15 },
          weight: 450
        }
      },
      {
        title: "Python untuk Pemula",
        author: "Siti Rahma", 
        description: "Belajar Python dari dasar",
        category: "Teknologi",
        rackLocation: "A1-002",
        totalStock: 3,
        availableStock: 3,
        details: {
          publisher: "Coding Press",
          isbn: "978-0987654321",
          publishDate: new Date("2024-02-01"),
          pages: 280,
          language: "English", // GANTI INI
          dimensions: { length: 20, width: 15 },
          weight: 400
        }
      },
      {
        title: "Laskar Pelangi",
        author: "Andrea Hirata",
        description: "Novel Indonesia terkenal",
        category: "Fiksi", 
        rackLocation: "B2-001",
        totalStock: 4,
        availableStock: 4,
        details: {
          publisher: "Bentang Pustaka",
          isbn: "978-0654321987",
          publishDate: new Date("2005-01-01"),
          pages: 300,
          language: "English", // ATAU INI
          dimensions: { length: 19, width: 13 },
          weight: 350
        }
      }
    ]);

    res.json({
      success: true,
      message: "Database Naratama berhasil di-setup!",
      data: {
        books: books.length,
        rooms: rooms.length,
        breakdown: {
          "Diskusi Kecil": 5,
          "Pertemuan Besar": 2
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 Handler - FIXED
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perpustakaan_naratama')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;