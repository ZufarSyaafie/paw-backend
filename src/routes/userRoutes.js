// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// public create (dev). if mau protect, pindahin verifyToken.requireAdmin
router.post("/", userController.createUser);

// admin-only endpoints
router.get("/", verifyToken, requireAdmin, userController.listUsers);
router.get("/:id", verifyToken, requireAdmin, userController.getUser);
router.delete("/:id", verifyToken, requireAdmin, userController.deleteUser); // <---

module.exports = router;
