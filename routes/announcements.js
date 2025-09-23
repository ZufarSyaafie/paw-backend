const express = require("express");
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET all announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET single announcement
router.get("/:id", async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Not found" });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// CREATE announcement (Admin only)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const announcement = new Announcement({
      title,
      content,
      category,
      createdBy: req.user._id
    });
    await announcement.save();
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE announcement (Admin only)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!announcement) return res.status(404).json({ message: "Not found" });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE announcement (Admin only)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
