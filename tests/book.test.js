// tests/book.test.js
const axios = require("axios");
const mongoose = require("mongoose");
const Book = require("../models/Book");
const User = require("../models/User");

const BASE_URL = "http://localhost:5000/api";

describe("Book API Endpoints", () => {
  let token;
  let user;

  beforeAll(async () => {
    // pastikan admin ada
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: "Admin Naratama",
        email: "admin@naratama.com",
        password: "admin123",
        phoneNumber: "081234567999",
      });
    } catch (err) {
      if (!err.response?.data?.message?.includes("sudah terdaftar")) {
        throw err;
      }
    }

    // login admin
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@naratama.com",
      password: "admin123",
    });
    token = loginRes.data.data.token;
    user = loginRes.data.data.user;

    // upgrade role kalau belum admin
    if (user.role !== "admin") {
      await axios.put(
        `${BASE_URL}/admin/upgrade-role`,
        { email: "admin@naratama.com", role: "admin" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const relogin = await axios.post(`${BASE_URL}/auth/login`, {
        email: "admin@naratama.com",
        password: "admin123",
      });
      token = relogin.data.data.token;
      user = relogin.data.data.user;
    }
  });

  it("should return user profile with admin role", async () => {
    const res = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    expect(res.data.data.user.role).toBe("admin");
  });

  it("should add a new book successfully", async () => {
    const minimalBook = {
      title: "Test Book Simple",
      author: "Test Author",
      format: "Soft Cover",
      description: "Simple test book",
      details: {
        publisher: "Test Publisher",
        isbn: "978-0-123456-78-9",
        publishDate: "2023-01-01",
        pages: 100,
        language: "English",
        dimensions: { length: 20, width: 13 },
        weight: 300,
      },
      category: "Fiksi",
      rackLocation: "A-01-01",
      totalStock: 5,
      availableStock: 5,
    };

    const res = await axios.post(`${BASE_URL}/books`, minimalBook, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    expect(res.status).toBe(201);
    expect(res.data.data.book).toHaveProperty("_id");
    expect(res.data.data.book.title).toBe("Test Book Simple");
  });
});

describe("Book Borrowing Integration (Model-level)", () => {
  let user, book;

  beforeAll(async () => {
    // await mongoose.connect(
    //   process.env.MONGODB_URI ||
    //     "mongodb://localhost:27017/perpustakaan_naratama"
    // );

    // cleanup dummy
    await Book.deleteMany({ title: /Test Book/i });
    await User.deleteMany({ email: /testuser@/i });

    // dummy user
    user = await User.create({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
      phoneNumber: "081234567890",
      isMember: true,
    });

    // dummy book
    book = await Book.create({
      title: "Test Book Borrow Flow",
      author: "Integration Tester",
      description: "Book for testing borrowing flow",
      category: "Testing",
      rackLocation: "T-01-01",
      totalStock: 2,
      availableStock: 2,
      details: {
        isbn: "999-TEST-123",
        publishDate: new Date(),
        language: "English",
        pages: 100,
      },
    });
  });

  afterAll(async () => {
    await Book.deleteMany({ title: /Test Book/i });
    await User.deleteMany({ email: /testuser@/i });
    // await mongoose.connection.close();
  });

  it("should allow member to borrow a book", async () => {
    if (book.canBorrow("Bawa Pulang") && user.canBorrowBooks()) {
      await book.borrowBook("Bawa Pulang");
      await user.incrementBorrowStats();

      expect(book.availableStock).toBeLessThan(2);
      expect(user.borrowingStats.currentActiveBorrows).toBeGreaterThan(0);
    } else {
      throw new Error("Borrow not allowed");
    }
  });

  it("should allow user to return a book", async () => {
    await book.returnBook();
    await user.decrementActiveBorrows();

    expect(book.availableStock).toBe(2);
    expect(user.borrowingStats.currentActiveBorrows).toBe(0);
  });

  it("should block guest if over borrow limit (3)", async () => {
    user.isMember = false;
    user.borrowingStats.currentActiveBorrows = 3;
    await user.save();

    const canBorrowMore = user.canBorrowBooks();
    expect(canBorrowMore).toBe(false);
  });
});

describe("Book API (Public Endpoints)", () => {
  let firstBookId;

  it("should get all books", async () => {
    const res = await axios.get(`${BASE_URL}/books`);

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty("pagination.totalBooks");

    const books = res.data.data.books;
    expect(Array.isArray(books)).toBe(true);

    if (books.length > 0) {
      firstBookId = books[0]._id;
      expect(books[0]).toHaveProperty("title");
      expect(books[0]).toHaveProperty("availableStock");
      expect(books[0]).toHaveProperty("totalStock");
    }
  });

  it("should get book detail if at least one exists", async () => {
    if (!firstBookId) return; // skip if no book

    const res = await axios.get(`${BASE_URL}/books/${firstBookId}`);

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty("book");
    expect(res.data.data.book).toHaveProperty("_id", firstBookId);
    expect(res.data.data.book).toHaveProperty("title");
    expect(res.data.data.book).toHaveProperty("author");
    expect(res.data.data.book).toHaveProperty("details.language");
    expect(res.data.data.book).toHaveProperty("borrowingRules");
  });

  it("should return search suggestions", async () => {
    const res = await axios.get(
      `${BASE_URL}/books/search-suggestions?q=test`
    );

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty("suggestions");
    expect(Array.isArray(res.data.data.suggestions)).toBe(true);
  });

  it("should return popular books", async () => {
    const res = await axios.get(`${BASE_URL}/books/popular`);

    expect(res.status).toBe(200);
    expect(res.data.data).toHaveProperty("books");
    expect(Array.isArray(res.data.data.books)).toBe(true);
  });
});
