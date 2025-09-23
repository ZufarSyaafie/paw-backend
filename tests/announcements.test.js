const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

describe("Announcements API", () => {
  let token;
  let headers;
  let announcementId;

  beforeAll(async () => {
    // login admin dulu
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: "admin@naratama.com",
      password: "admin123",
    });
    token = res.data.data.token;
    headers = { Authorization: `Bearer ${token}` };
  });

  it("should create an announcement", async () => {
    const createPayload = {
      title: "Libur Perpustakaan",
      content: "Perpustakaan akan libur tanggal 1 Oktober.",
      type: "general", // general | event | maintenance
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const res = await axios.post(`${BASE_URL}/announcements`, createPayload, {
      headers,
    });

    expect(res.status).toBe(201); // cek status code
    expect(res.data.data).toHaveProperty("announcement._id");

    announcementId = res.data.data.announcement._id;
  });

  it("should fetch all announcements", async () => {
    const res = await axios.get(`${BASE_URL}/announcements`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data.announcements)).toBe(true);
  });

  it("should fetch detail of an announcement", async () => {
    const res = await axios.get(`${BASE_URL}/announcements/${announcementId}`);

    expect(res.status).toBe(200);
    expect(res.data.data.announcement).toHaveProperty("_id", announcementId);
  });

  it("should update an announcement", async () => {
    const res = await axios.put(
      `${BASE_URL}/announcements/${announcementId}`,
      { title: "Libur Nasional Perpustakaan" },
      { headers }
    );

    expect(res.status).toBe(200);
    expect(res.data.data.announcement.title).toBe(
      "Libur Nasional Perpustakaan"
    );
  });

  it("should delete an announcement", async () => {
    const res = await axios.delete(
      `${BASE_URL}/announcements/${announcementId}`,
      { headers }
    );

    expect(res.status).toBe(200);
    expect(res.data.message).toMatch(/deleted/i);
  });
});
