const validateBookingTime = (req, res, next) => {
  const { startTime, endTime, date } = req.body;
  const bookingDate = new Date(date);
  
  // Validasi hari kerja
  const day = bookingDate.getDay();
  if (day === 0 || day === 6) {
    return res.status(400).json({
      success: false,
      message: 'Booking hanya tersedia pada hari kerja (Senin-Jumat)'
    });
  }

  // Validasi jam operasional (08:00-17:00)
  const start = parseInt(startTime.split(':')[0]);
  const end = parseInt(endTime.split(':')[0]);
  
  if (start < 8 || end > 17) {
    return res.status(400).json({
      success: false,
      message: 'Booking hanya tersedia pada jam 08:00-17:00'
    });
  }

  next();
};

module.exports = {
  validateBookingTime
};