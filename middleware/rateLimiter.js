const rateLimit = require('express-rate-limit');

// Limit login attempt: max 5 requests / 1 menit per IP
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login. Coba lagi setelah 1 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter };
