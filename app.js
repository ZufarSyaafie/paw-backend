// // app.js (replace file)
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const { MongoMemoryServer } = require('mongodb-memory-server');

// const app = express();
// const notificationsRoutes = require('./routes/notifications');

// // Middleware core
// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use('/api/notifications', notificationsRoutes);
// app.use("/api/announcements", require("./routes/announcements"));
// app.use("/api/info", require("./routes/info"));


// // Routes (require BEFORE mounting)
// const authRoutes = require('./routes/auth');
// const bookRoutes = require('./routes/books');
// const borrowingRoutes = require('./routes/borrowing');
// const roomRoutes = require('./routes/room');
// const paymentRoutes = require('./routes/payment');
// const adminRoutes = require('./routes/admin');

// // Mount routes
// app.use('/api/auth', authRoutes);
// app.use('/api/books', bookRoutes);
// app.use('/api/borrowing', borrowingRoutes);
// app.use('/api/rooms', roomRoutes);
// app.use('/api/payments', paymentRoutes);
// app.use('/api/admin', adminRoutes);

// // Root endpoint
// app.get('/', (req, res) => {
//   res.json({
//     message: 'Perpustakaan Naratama API',
//     version: '1.0.0',
//     endpoints: {
//       auth: '/api/auth',
//       books: '/api/books',
//       borrowing: '/api/borrowing',
//       rooms: '/api/rooms',
//       payments: '/api/payments',
//       admin: '/api/admin',
//       announcements: '/api/announcements',
//       info: '/api/info',
//       notifications: '/api/notifications'
//     }
//   });
// });

// // 404 Handler (after routes)
// app.use((req, res) => {
//   res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
// });

// // Global Error Handler (last middleware)
// const errorHandler = require('./middleware/errorHandler');
// app.use(errorHandler);

// // Database Connection (async)
// async function connectDB() {
//   try {
//     if (process.env.MONGODB_URI) {
//       await mongoose.connect(process.env.MONGODB_URI);
//       console.log('✅ Connected to MongoDB');
//     } else {
//       // fallback to in-memory
//       const mongod = await MongoMemoryServer.create();
//       const uri = mongod.getUri();
//       await mongoose.connect(uri);
//       console.log('✅ Connected to in-memory MongoDB');
//     }
//   } catch (error) {
//     console.error('❌ MongoDB connection error:', error);
//     // fallback to in-memory once
//     const mongod = await MongoMemoryServer.create();
//     const uri = mongod.getUri();
//     await mongoose.connect(uri);
//     console.log('✅ Connected to in-memory MongoDB (fallback)');
//   }
// }

// connectDB();

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// module.exports = app;

// const startCronJobs = require('./scheduler/cronJobs');
// startCronJobs();

// app.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const { MongoMemoryServer } = require("mongodb-memory-server");

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/announcements", require("./routes/announcements"));
app.use("/api/info", require("./routes/info"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/books", require("./routes/books"));
app.use("/api/borrowing", require("./routes/borrowing"));
app.use("/api/rooms", require("./routes/room"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/admin", require("./routes/admin"));

// root
app.get("/", (req, res) => {
  res.json({
    message: "Perpustakaan Naratama API",
    version: "1.0.0",
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan" });
});

// error handler
app.use(require("./middleware/errorHandler"));

// db connect
async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      await mongoose.connect(mongoUri);
      console.log("✅ Connected to MongoDB:", mongoUri);
    } else {
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      console.log("✅ Connected to in-memory MongoDB (no URI provided)");
    }
  } catch (err) {
    console.error("❌ Initial MongoDB connection failed:", err.message);
    console.log("🔄 Falling back to in-memory MongoDB...");
    const mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    console.log("✅ Connected to in-memory MongoDB (fallback)");
  }
}

async function startServer() {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

  require("./scheduler/cronJobs")();
}

startServer();

module.exports = app;
