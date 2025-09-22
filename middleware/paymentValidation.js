// Middleware untuk validasi request pembayaran
const validatePayment = (req, res, next) => {
  const { amount, type } = req.body;
  const errors = [];

  if (!amount || amount <= 0) {
    errors.push('Jumlah pembayaran tidak valid');
  }

  const validTypes = ['commitment-fee', 'fine'];
  if (!type || !validTypes.includes(type)) {
    errors.push(`Tipe pembayaran harus salah satu dari: ${validTypes.join(', ')}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validasi pembayaran gagal',
      errors
    });
  }

  next();
};

module.exports = { validatePayment };
