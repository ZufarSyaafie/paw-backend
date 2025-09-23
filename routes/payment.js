// routes/payment.js
const express = require('express');
const router = express.Router();
const { payCommitmentFee, payFine } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { validatePayment } = require('../middleware/paymentValidation');

// Bayar commitment fee
router.post('/commitment-fee', authenticateToken, validatePayment, payCommitmentFee);

// Bayar denda
router.post('/fine', authenticateToken, validatePayment, payFine);

module.exports = router;
