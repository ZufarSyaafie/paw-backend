// user.test.js
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

describe("User Model", () => {
  beforeAll(async () => {
    // await mongoose.connect(
    //   process.env.MONGODB_URI ||
    //     "mongodb://localhost:27017/perpustakaan_naratama"
    // );
    await User.deleteOne({ email: "john@example.com" });
  });

  afterAll(async () => {
    // await mongoose.connection.close();
  });

  it("should create a new user and save to DB", async () => {
    const user = new User({
      name: "John Doe",
      email: "john@example.com",
      password: "123456",
      phoneNumber: "081234567001",
    });

    const savedUser = await user.save();
    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe("John Doe");
    expect(savedUser.isMember).toBe(false);
  });

  it("should compare password correctly", async () => {
    const user = await User.findOne({ email: "john@example.com" });
    const isCorrect = await user.comparePassword("123456");
    expect(isCorrect).toBe(true);
  });

  it("should upgrade membership", async () => {
    const user = await User.findOne({ email: "john@example.com" });
    const upgraded = await user.upgradeMembership("Premium");
    expect(upgraded.isMember).toBe(true);
    expect(upgraded.membershipType).toBe("Premium");
    expect(upgraded.membershipDate).toBeDefined();
  });

  it("should update last login", async () => {
    const user = await User.findOne({ email: "john@example.com" });
    await user.updateLastLogin();
    expect(user.lastLogin).toBeInstanceOf(Date);
  });

  it("should update borrowing stats", async () => {
    const user = await User.findOne({ email: "john@example.com" });

    await user.incrementBorrowStats();
    expect(user.borrowingStats.currentActiveBorrows).toBe(1);

    await user.decrementActiveBorrows();
    expect(user.borrowingStats.currentActiveBorrows).toBe(0);

    await user.addFinePaid(5000);
    expect(user.borrowingStats.totalFinesPaid).toBeGreaterThanOrEqual(5000);
  });

  it("should check borrowing eligibility", async () => {
    const user = await User.findOne({ email: "john@example.com" });
    expect(typeof user.canBorrowBooks()).toBe("boolean");
  });

  it("should return virtuals and computed values", async () => {
    const user = await User.findOne({ email: "john@example.com" });
    expect(user.displayName).toContain("John Doe");
    expect(user.membershipStatus).toBeDefined();
  });

  it("should aggregate member stats", async () => {
    const stats = await User.getMemberStats();
    expect(Array.isArray(stats)).toBe(true);
  });
});
