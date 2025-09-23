// tests/setup.js
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../models/User");
const Book = require("../models/Book");
const Room = require("../models/Room");
const Payment = require("../models/Payment");

let mongod;

beforeAll(async () => {
  let uri = process.env.MONGODB_URI;
  if (!uri) {
    mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log("⚡ Using in-memory mongodb:", uri);
  }

  // await mongoose.connect(uri);   <-- commented by script (handled by tests/setup.js)
// mongoose.connect now handled globally in tests/setup.js

  // bersihin koleksi
  await Promise.all([
    User.deleteMany({}),
    Book.deleteMany({}),
    Room.deleteMany({}),
    Payment.deleteMany({})
  ]);

  // seed admin
  const admin = await User.create({
    name: "Admin Naratama",
    email: process.env.INIT_ADMIN_EMAIL || "admin@naratama.com",
    password: process.env.INIT_ADMIN_PASSWORD || "admin123",
    phoneNumber: "081234567999",
    role: "admin",
    isMember: true
  });

  // seed member
  await User.create({
    name: "Jane Example",
    email: "jane@example.com",
    password: "123456",
    phoneNumber: "081234567888",
    isMember: true
  });

  // seed guest
  await User.create({
    name: "Manda",
    email: "manda@gmail.com",
    password: "123456",
    phoneNumber: "082345678901",
    isMember: false
  });

  // seed book
  await Book.create({
    // title: "Belajar Node.js",
    // author: "Anonim",
    // format: "Soft Cover",
    // description: "Buku dasar belajar Node.js",
    // details: {
    //   publisher: "Penerbit Naratama",
    //   isbn: "1234567890",
    //   publishDate: new Date(),
    //   pages: 200,
    //   language: "Indonesia"
    // },
    // category: "Teknologi",
    // rackLocation: "A-01-02",
    // totalStock: 3,
    // availableStock: 3
    title: "Belajar Node.js",
    author: "Anonim",
    category: "Science",   // ✅ cocok dengan enum di schema
    totalQuantity: 3,      // ✅ wajib ada
    quantityAvailable: 3,  // ✅ wajib ada
    description: "Buku dasar Node.js untuk pemula",
    publishedDate: new Date(),
  });

  // seed room
  await Room.create({
    roomName: "Ruang Diskusi A",
    capacity: 10,
    isAvailable: true
  });

  // seed payment dummy
  await Payment.create({
    user: admin._id,
    type: "commitmentFee",
    amount: 10000,
    status: "pending"
  });
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});
