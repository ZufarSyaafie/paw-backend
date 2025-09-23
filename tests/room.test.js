// room.test.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";
let token = "";
let headers = {};
let testRoom = null;
let bookingId = "";

describe("Room Booking System", () => {
  beforeAll(async () => {
    // login admin dulu
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@naratama.com",
      password: "admin123",
    });
    token = res.data.data.token;
    headers = { Authorization: `Bearer ${token}` };
    expect(token).toBeDefined();

    // ambil room yg available
    const roomsRes = await axios.get(`${BASE_URL}/rooms`, { headers });
    expect(Array.isArray(roomsRes.data.data.rooms)).toBe(true);
    if (roomsRes.data.data.rooms.length === 0) {
      throw new Error("no rooms available, seed dulu datanya");
    }
    testRoom = roomsRes.data.data.rooms[0];
  });

  it("should check availability", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const bookingDate = date.toISOString().split("T")[0];

    const res = await axios.get(
      `${BASE_URL}/rooms/${testRoom._id}/availability?date=${bookingDate}`,
      { headers }
    );
    expect(res.status).toBe(200);
    expect(res.data.data).toBeDefined();
  });

  it("should book a room", async () => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const bookingDate = date.toISOString().split("T")[0];

    const res = await axios.post(
      `${BASE_URL}/rooms/${testRoom._id}/book`,
      {
        date: bookingDate,
        startTime: "10:00",
        endTime: "12:00",
      },
      { headers }
    );

    expect(res.status).toBe(201);
    expect(res.data.data.booking).toBeDefined();
    bookingId = res.data.data.booking._id;
  });

  it("should cancel a booking", async () => {
    const res = await axios.delete(
      `${BASE_URL}/rooms/${testRoom._id}/cancel/${bookingId}`,
      { headers }
    );
    expect(res.status).toBe(200);
    expect(res.data.message).toMatch(/canceled/i);
  });
});
