// app.js (replace file)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
const notificationsRoutes = require('./routes/notifications');

// Middleware core
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/notifications', notificationsRoutes);


// Routes (require BEFORE mounting)
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const borrowingRoutes = require('./routes/borrowing');
const roomRoutes = require('./routes/room');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrowing', borrowingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Perpustakaan Naratama API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      borrowing: '/api/borrowing',
      rooms: '/api/rooms',
      payments: '/api/payments',
      admin: '/api/admin'
    }
  });
});

// 404 Handler (after routes)
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Global Error Handler (last middleware)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Database Connection (async)
async function connectDB() {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Connected to MongoDB');
    } else {
      // fallback to in-memory
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('✅ Connected to in-memory MongoDB');
    }
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // fallback to in-memory once
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('✅ Connected to in-memory MongoDB (fallback)');
  }
}

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;

const startCronJobs = require('./scheduler/cronJobs');
startCronJobs();
