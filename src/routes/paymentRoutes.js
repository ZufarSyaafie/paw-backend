const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/notification", paymentController.notification);

module.exports = router;
