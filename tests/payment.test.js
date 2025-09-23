// payment.test.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
let token = "";
let headers = {};
let paymentId = "";

describe("Payment System Tests", () => {
  beforeAll(async () => {
    // login admin
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@naratama.com",
      password: "admin123",
    });
    token = res.data.data.token;
    headers = { Authorization: `Bearer ${token}` };
    expect(token).toBeDefined();
  });

  it("should create a new payment", async () => {
    const payload = {
      userId: "admin", // kalau API butuh _id, sesuaikan field
      amount: 50000,
      type: "fine",
      description: "Denda keterlambatan buku test",
      method: "cash",
    };

    const res = await axios.post(`${BASE_URL}/payments`, payload, { headers });
    expect(res.status).toBe(201);
    expect(res.data.data.payment).toBeDefined();
    paymentId = res.data.data.payment._id;
  });

  it("should fetch all payments", async () => {
    const res = await axios.get(`${BASE_URL}/payments`, { headers });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data.payments)).toBe(true);
  });

  it("should fetch payment detail", async () => {
    const res = await axios.get(`${BASE_URL}/payments/${paymentId}`, { headers });
    expect(res.status).toBe(200);
    expect(res.data.data.payment._id).toBe(paymentId);
  });

  it("should update payment status", async () => {
    const res = await axios.put(
      `${BASE_URL}/payments/${paymentId}`,
      { status: "paid" },
      { headers }
    );
    expect(res.status).toBe(200);
    expect(res.data.data.payment.status).toBe("paid");
  });
});
