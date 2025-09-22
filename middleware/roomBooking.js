// Middleware dummy untuk validasi booking waktu
function validateBookingTime(req, res, next) {
  // nanti bisa diisi logika beneran (cek overlap, jam buka, dll.)
  console.log("✅ validateBookingTime kepanggil");
  next();
}

module.exports = { validateBookingTime };