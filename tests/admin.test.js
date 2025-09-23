// tests/admin.test.js
const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config();

describe("Admin User Setup", () => {
  const email = "admin@naratama.com";

  beforeAll(async () => {
    // await mongoose.connect(
    //   process.env.MONGODB_URI ||
    //     "mongodb://localhost:27017/perpustakaan_naratama",
    //   { useNewUrlParser: true, useUnifiedTopology: true }
    // );
  });

  afterAll(async () => {
    // await mongoose.connection.close();
  });

  it("should ensure admin user exists", async () => {
    let admin = await User.findOne({ email });

    if (admin) {
      admin.role = "admin";
      admin.isMember = true;
      await admin.save();
    } else {
      admin = await User.create({
        name: "Admin Naratama",
        email,
        password: "admin123", // auto-hash via pre-save hook
        phoneNumber: "081234567999",
        role: "admin",
        isMember: true,
      });
    }

    const fetched = await User.findOne({ email });
    expect(fetched).not.toBeNull();
    expect(fetched.role).toBe("admin");
    expect(fetched.isMember).toBe(true);
  });
});
