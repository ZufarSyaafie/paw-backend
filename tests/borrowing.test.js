// borrowing.test.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

describe("Borrowing System API", () => {
  let userToken;
  let adminToken;
  let testBook;

  beforeAll(async () => {
    // login admin
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@naratama.com",
      password: "admin123",
    });
    adminToken = adminLogin.data.data.token;

    // pastiin ada buku available
    const booksRes = await axios.get(`${BASE_URL}/books`);
    const availableBooks = booksRes.data.data.books.filter(
      (b) => b.availableStock > 0
    );
    if (availableBooks.length === 0) {
      throw new Error("no available books for borrowing test");
    }
    testBook = availableBooks[0];

    // register user kalo belum ada
    try {
      await axios.post(`${BASE_URL}/auth/register`, {
        name: "Test Borrower",
        email: "borrower@naratama.com",
        password: "test123",
        phoneNumber: "081234567001",
      });
    } catch (err) {
      if (!err.response?.data?.message?.includes("sudah terdaftar")) {
        throw err;
      }
    }

    // login user
    const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: "borrower@naratama.com",
      password: "test123",
    });
    userToken = userLogin.data.data.token;
  });

  it("should allow a member to borrow a book", async () => {
    const res = await axios.post(
      `${BASE_URL}/borrowing/borrow`,
      { bookId: testBook._id, borrowType: "Bawa Pulang" },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );

    expect(res.status).toBe(201);
    expect(res.data.data.borrowing).toHaveProperty("id");
    expect(res.data.data.borrowing).toHaveProperty("borrowDate");
    expect(res.data.data.borrowing).toHaveProperty("dueDate");
  });

  it("should reduce stock after borrowing", async () => {
    const res = await axios.get(`${BASE_URL}/books/${testBook._id}`);
    const book = res.data.data.book;

    expect(book.availableStock).toBeLessThan(book.totalStock);
  });
});
