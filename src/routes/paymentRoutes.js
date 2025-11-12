const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/notification", paymentController.notification);
router.get("/my", verifyToken, paymentController.listMyPayments);

module.exports = router;
