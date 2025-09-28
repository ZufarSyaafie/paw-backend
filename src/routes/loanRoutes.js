// const express = require("express");
// const router = express.Router();
// const { verifyToken } = require("../middleware/authMiddleware");
// const loanController = require("../controllers/loanController");

// router.get("/my", verifyToken, loanController.getMyLoans);
// router.post("/:id/return", verifyToken, loanController.returnLoan);

// module.exports = router;
// src/routes/loanRoutes.js
const express = require("express");
const router = express.Router();
const loanController = require("../controllers/loanController");
const { authenticate } = require("../middleware/authMiddleware");

router.get("/my", authenticate(), loanController.getMyLoans);
router.post("/:id/return", authenticate(), loanController.returnLoan);
// admin routes (optional)
router.get("/", authenticate(["admin"]), loanController.getAllLoans);

module.exports = router;
