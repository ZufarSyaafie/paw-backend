const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const { authenticate } = require("../middleware/authMiddleware");

// public
router.get("/", bookController.listBooks);
router.get("/:id", bookController.getBook);

// buat relevant filter
router.get("/categories", bookController.getCategories);

// admin only
router.post("/", authenticate(["admin"]), bookController.createBook);
router.put("/:id", authenticate(["admin"]), bookController.updateBook);
router.delete("/:id", authenticate(["admin"]), bookController.deleteBook);

// borrow (user)
router.post(
	"/:id/borrow",
	authenticate(["user", "admin"]),
	bookController.borrowBook
);

module.exports = router;
