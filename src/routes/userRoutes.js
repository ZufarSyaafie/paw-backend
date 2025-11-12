const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const usersController = require("../controllers/usersController");

// admin: list all users
router.get("/", verifyToken, requireAdmin, usersController.listUsers);

// admin: create user (e.g. create admin quickly)
router.post("/", verifyToken, requireAdmin, usersController.createUser);

// get current user profile
router.get("/me", verifyToken, usersController.getMe);

// update current user profile
router.put("/me", verifyToken, usersController.updateMe);

// admin: get user by id
router.get("/:id", verifyToken, requireAdmin, usersController.getUserById);

// admin: delete user
router.delete("/:id", verifyToken, requireAdmin, usersController.deleteUser);

module.exports = router;
