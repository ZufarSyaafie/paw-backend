# Perpustakaan Naratama - Backend API

Backend API untuk Sistem Perpustakaan Naratama yang mencakup manajemen buku, peminjaman ruangan, sistem pengumuman dengan email notification, dan autentikasi berbasis OTP.

## 🚀 Features

### 📚 **Book Management**

- CRUD operations untuk buku
- Search dan filter buku
- Sistem peminjaman buku dengan deposit
- Integrasi pembayaran Midtrans

### 🏢 **Room Booking System**

- Peminjaman ruangan dengan validasi ketat
- **Hari kerja saja** (Senin-Jumat)
- **Nomor telepon wajib** (format Indonesia)
- **Durasi minimal 1 jam**
- Jam operasional 08:00-17:00
- Deteksi konflik booking otomatis

### 📧 **Email Announcement System**

- Email otomatis saat ada buku baru
- Pengumuman custom dengan template HTML profesional
- Kirim ke semua user terverifikasi
- Statistics tracking (berhasil/gagal)

### 🔐 **Authentication & Authorization**

- Registrasi dengan OTP verification
- Login dengan OTP (double security)
- Google OAuth integration
- JWT token-based authentication
- Role-based access (user/admin)

## 🛠️ Technology Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB dengan Mongoose
- **Authentication:** JWT, Passport.js (Google OAuth)
- **Email:** Nodemailer
- **Payment:** Midtrans
- **Date Handling:** date-fns
- **Security:** bcrypt, OTP verification

## 📦 Installation

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd perpustakaan-naratama-backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**

   ```bash
   cp .env.example .env
   # Edit .env file dengan konfigurasi Anda
   ```

4. **Start application**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## ⚙️ Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/perpustakaan-naratama

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Midtrans Payment
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key

# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

## 📋 API Documentation

Dokumentasi lengkap API tersedia di:

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Endpoint dan usage
- **[EMAIL_SETUP.md](./EMAIL_SETUP.md)** - Setup email system
- **[ROOM_BOOKING_GUIDE.md](./ROOM_BOOKING_GUIDE.md)** - Room booking rules

## 🧪 Testing

### Test Email System

```bash
node test-email.js
```

### Test Room Booking Rules

```bash
node test-booking-rules.js
```

## 📁 Project Structure

```
src/
├── config/
│   ├── database.js       # MongoDB connection
│   └── jwt.js           # JWT configuration
├── controllers/
│   ├── authController.js       # Authentication logic
│   ├── bookController.js       # Book management
│   ├── roomController.js       # Room booking system
│   ├── announcementController.js # Announcement system
│   └── paymentController.js    # Payment handling
├── middleware/
│   └── authMiddleware.js       # Authentication middleware
├── models/
│   ├── User.js          # User schema
│   ├── Book.js          # Book schema
│   ├── Room.js          # Room schema
│   ├── Booking.js       # Room booking schema
│   ├── Announcement.js  # Announcement schema
│   └── Loan.js          # Book loan schema
├── routes/
│   ├── authRoutes.js           # Authentication endpoints
│   ├── bookRoutes.js           # Book endpoints
│   ├── roomRoutes.js           # Room booking endpoints
│   ├── announcementRoutes.js   # Announcement endpoints
│   └── paymentRoutes.js        # Payment endpoints
├── services/
│   ├── emailService.js         # Email announcement service
│   └── midtrans.js            # Midtrans integration
├── utils/
│   ├── otpService.js          # OTP generation & validation
│   └── dateUtils.js           # Date & time utilities
└── passport/
    └── googleStrategy.js      # Google OAuth strategy
```

## 🔒 Security Features

- **OTP Verification:** Double security untuk registrasi dan login
- **JWT Tokens:** Secure session management
- **Role-based Access:** Admin dan user permissions
- **Input Validation:** Comprehensive validation untuk semua input
- **Phone Normalization:** Format konsisten nomor telepon
- **Working Days Only:** Otomatis block booking weekend

## 📊 Room Booking Rules

### ✅ **Automatic Validations**

1. **Hari Kerja Saja** - Senin sampai Jumat
2. **Phone Required** - Format Indonesia (08xxxxxxxxx)
3. **Minimal 1 Jam** - Durasi peminjaman
4. **Jam Operasional** - 08:00 hingga 17:00
5. **No Conflicts** - Deteksi otomatis bentrok jadwal
6. **Cancellation Rules** - Beda rules untuk user dan admin

### 🚫 **Auto-blocked Scenarios**

- Weekend bookings
- Durasi < 1 jam
- Format phone invalid
- Di luar jam operasional
- Konflik dengan booking existing
- Tanggal yang sudah lewat

## 📧 Email Features

### **Automatic Notifications**

- **New Book Added:** Email otomatis ke semua user saat admin tambah buku
- **Custom Announcements:** Admin bisa buat pengumuman dan kirim email
- **Professional Templates:** HTML templates yang menarik
- **Delivery Statistics:** Track berapa email berhasil/gagal dikirim

### **Email Templates**

- Gradient header dengan branding Perpustakaan Naratama
- Responsive design untuk mobile dan desktop
- Clear call-to-action
- Professional footer dengan disclaimer

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- **Perpustakaan Naratama Team**

## 🆘 Support

Untuk bantuan dan pertanyaan:

- Baca dokumentasi di folder docs/
- Jalankan test scripts untuk validasi
- Check environment variables setup
- Pastikan MongoDB dan email service berjalan

---

**Perpustakaan Naratama Backend API** - Sistem perpustakaan modern dengan fitur lengkap dan keamanan tinggi.
