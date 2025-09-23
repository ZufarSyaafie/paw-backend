// tests/auth.test.js
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api/auth";

describe("Naratama Auth System", () => {
  let memberToken;
  let guestToken;

  it("should register a new member", async () => {
    const res = await axios.post(`${BASE_URL}/register`, {
      name: "Olivia",
      email: "olivia@gmail.com",
      password: "123456",
      phoneNumber: "081234567890",
    });

    expect(res.status).toBe(201); // atau 200 tergantung implementasi API
    expect(res.data).toHaveProperty("data.token");

    memberToken = res.data.data.token;
  });

  it("should login as guest", async () => {
    const res = await axios.post(`${BASE_URL}/guest-login`, {
      name: "Manda",
      phoneNumber: "082345678901",
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("data.token");

    guestToken = res.data.data.token;
  });

  it("should login as member", async () => {
    const res = await axios.post(`${BASE_URL}/login`, {
      email: "olivia@gmail.com",
      password: "123456",
    });

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty("data.token");
  });

  it("should fetch member profile", async () => {
    const res = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    expect(res.data.data.user).toMatchObject({
      name: "Olivia",
      isMember: true,
    });
  });

  it("should fetch guest profile", async () => {
    const res = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${guestToken}` },
    });

    expect(res.status).toBe(200);
    expect(res.data.data.user).toHaveProperty("isMember", false);
  });

  it("should upgrade guest to member", async () => {
    const res = await axios.post(
      `${BASE_URL}/upgrade-membership`,
      {
        email: "manda@gmail.com",
        password: "123456",
      },
      { headers: { Authorization: `Bearer ${guestToken}` } }
    );

    expect(res.status).toBe(200);
    expect(res.data.message).toMatch(/upgrade/i);
  });
});

describe("Auth Middleware Tests", () => {
  let authToken;

  beforeAll(async () => {
    // login sekali buat dapet token
    const res = await axios.post(`${BASE_URL}/login`, {
      email: "jane@example.com", // pastiin user ini ada di DB
      password: "123456",
    });

    authToken = res.data.data.token;
    expect(authToken).toBeDefined();
  });

  it("should access protected route WITH token", async () => {
    const res = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.data.user).toBeDefined();
  });

  it("should block access WITHOUT token", async () => {
    try {
      await axios.get(`${BASE_URL}/profile`);
    } catch (err) {
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/token/i);
    }
  });

  it("should reject invalid token", async () => {
    try {
      await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: "Bearer invalid-token-123" },
      });
    } catch (err) {
      expect(err.response.status).toBe(401);
      expect(err.response.data.message).toMatch(/invalid/i);
    }
  });

  it("should update profile with valid token", async () => {
    const res = await axios.put(
      `${BASE_URL}/profile`,
      { name: "Jane Smith Updated" },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    expect(res.status).toBe(200);
    expect(res.data.data.user.name).toBe("Jane Smith Updated");
  });
});
