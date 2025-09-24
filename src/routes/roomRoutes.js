const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/", roomController.listRooms);
router.get("/:id", roomController.getRoom);

// admin
router.post("/", authenticate(["admin"]), roomController.createRoom);
router.put("/:id", authenticate(["admin"]), roomController.updateRoom);

// booking (user)
router.post(
	"/:id/book",
	authenticate(["user", "admin"]),
	roomController.bookRoom
);

module.exports = router;
