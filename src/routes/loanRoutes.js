const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");
const loansController = require("../controllers/loansController");

// user: get my loans
router.get("/my", verifyToken, loansController.myLoans);

// admin: get all loans
router.get("/", verifyToken, requireAdmin, loansController.listAllLoans);

router.get("/status", verifyToken, loansController.checkLoanByBookId);

// return a loan (user or admin)
router.post("/:id/return", verifyToken, loansController.returnLoan);

// get loan by id (user owns or admin)
router.get("/:id", verifyToken, loansController.getLoanById);

module.exports = router;
