const express = require("express");
const router = express.Router();

// static info perpustakaan
router.get("/", (req, res) => {
  res.json({
    name: "Perpustakaan Digital Naratama",
    contact: {
      phone: "+62 812-3456-7890",
      email: "info@naratama-library.id"
    },
    address: "Jl. Perpustakaan No. 123, Surabaya, Indonesia",
    map: "https://maps.google.com/?q=-7.2575,112.7521", // contoh koordinat Surabaya
    hours: {
      monday_friday: "08:00 - 17:00",
      saturday: "Closed",
      sunday: "Closed"
    },
    rules: {
      borrowing: {
        regular: "14 hari",
        member: "21 hari",
        late_fine: "Rp5.000/hari (Rp2.500/hari untuk member)"
      },
      rooms: {
        booking: "Hanya Senin–Jumat, minimal 1 jam",
        payment: "Bayar commitment fee Rp25.000 saat peminjaman"
      }
    }
  });
});

module.exports = router;
