const express = require('express');
const router = express.Router();
const { payCommitmentFee, payFine } = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { validatePayment } = require('../middleware/paymentValidation');

// Pay commitment fee (must be borrower)
router.post('/commitment-fee', authenticateToken, validatePayment, payCommitmentFee);

// Pay fine
router.post('/fine', authenticateToken, validatePayment, payFine);

module.exports = router;
