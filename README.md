# 📚 Perpustakaan Naratama - Backend API

Backend API modern untuk Sistem Perpustakaan Naratama dengan fitur lengkap meliputi manajemen buku, peminjaman ruangan berbasis aturan ketat, sistem pengumuman dengan email notification otomatis, dan autentikasi berlapis dengan OTP verification.

## 🌟 Highlights

- 🔐 **Double Security**: OTP verification untuk registrasi dan login
- 📧 **Smart Email System**: Auto-notification saat ada buku baru atau pengumuman
- 🏢 **Intelligent Room Booking**: Validasi otomatis hari kerja, durasi, dan konflik jadwal
- 💳 **Payment Integration**: Midtrans untuk deposit peminjaman buku
- 🔍 **Advanced Search**: Filter dan pencarian buku yang powerful
- 📊 **Admin Dashboard**: Management tools untuk admin dengan role-based access

## 🚀 Core Features

### 📚 **Book Management System**

- ✅ **CRUD Operations**: Create, read, update, delete buku dengan validasi lengkap
- 🔍 **Advanced Search**: Pencarian berdasarkan judul, author, category dengan pagination
- 📊 **Stock Management**: Tracking stok buku real-time
- 💰 **Loan System**: Peminjaman dengan deposit Rp 25.000 via Midtrans
- 🔄 **Return Process**: Return buku dengan refund otomatis jika tepat waktu
- 📋 **Loan History**: Tracking history peminjaman user

### 🏢 **Smart Room Booking System**

- 📅 **Working Days Only**: Otomatis block weekend (Sabtu-Minggu)
- ⏰ **Operating Hours**: Jam 08:00-17:00 dengan validasi ketat
- 📱 **Phone Required**: Nomor telepon Indonesia wajib (08xxxxxxxxx)
- ⏱️ **Minimum Duration**: Durasi peminjaman minimal 1 jam
- 🚫 **Conflict Detection**: Auto-detect bentrok jadwal dengan booking existing
- ❌ **Smart Cancellation**: Rules berbeda untuk user (2h before) dan admin (anytime)
- 📊 **Booking Management**: View, filter, dan cancel bookings

### 📧 **Professional Email System**

- 🤖 **Auto-Announcement**: Email otomatis saat admin tambah buku baru
- 📢 **Custom Announcements**: Admin bisa buat pengumuman dan broadcast email
- 🎨 **HTML Templates**: Template responsive dengan gradient header Perpustakaan Naratama
- 📊 **Delivery Stats**: Real-time tracking email berhasil/gagal dikirim
- ✅ **Verified Users Only**: Email hanya ke user yang sudah verified
- � **Professional Footer**: Disclaimer dan unsubscribe info

### 🔐 **Multi-Layer Authentication**

- 📧 **OTP Registration**: 6-digit OTP via email untuk registrasi (10 menit expired)
- 🔑 **OTP Login**: Double security dengan OTP setiap login
- 🌐 **Google OAuth**: Login sosial dengan auto-verified status
- 🎫 **JWT Tokens**: Secure session management dengan role-based access
- 👥 **Role System**: User dan Admin dengan permissions berbeda
- 🔄 **OTP Resend**: Functionality untuk kirim ulang OTP

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
   git clone https://github.com/ZufarSyaafie/paw-backend.git
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
MONGODB_URI=mongodb://localhost:XXXX/XXXX

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

## 🌐 API Endpoints Overview

### 🔐 Authentication Endpoints

```
POST /auth/register              # Registrasi dengan OTP
POST /auth/verify-registration-otp # Verifikasi OTP registrasi
POST /auth/login                 # Login dengan OTP
POST /auth/verify-login-otp      # Verifikasi OTP login
POST /auth/resend-registration-otp # Kirim ulang OTP registrasi
POST /auth/resend-login-otp      # Kirim ulang OTP login
GET  /auth/google               # Google OAuth login
GET  /auth/google/callback      # Google OAuth callback
```

### 📚 Book Management Endpoints

```
GET    /books                   # List books dengan search & pagination
GET    /books/:id              # Get book detail
POST   /books                  # Create book (Admin) + auto email announcement
PUT    /books/:id              # Update book (Admin)
DELETE /books/:id              # Delete book (Admin)
POST   /books/:id/borrow       # Borrow book dengan Midtrans payment
PUT    /books/loans/:id/return # Return book dengan refund
```

### 🏢 Room Booking Endpoints

```
GET    /rooms                       # List all rooms
GET    /rooms/:id                   # Get room detail
POST   /rooms                       # Create room (Admin)
PUT    /rooms/:id                   # Update room (Admin)
POST   /rooms/:id/book              # Book room (User/Admin)
GET    /rooms/bookings/list         # Get bookings dengan filter
PUT    /rooms/bookings/:id/cancel   # Cancel booking
```

### 📧 Announcement Endpoints

```
GET    /announcements               # List announcements
POST   /announcements               # Create announcement + broadcast email (Admin)
POST   /announcements/:id/send-emails # Resend email untuk announcement (Admin)
```

### 💳 Payment Endpoints

```
POST   /payment/notification       # Midtrans webhook callback
GET    /payment/status/:orderId    # Check payment status
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

## 🚀 Quick Start Guide

### 1. **Prerequisites**

- Node.js v16+ dan npm
- MongoDB v4.4+
- Gmail account untuk email service
- Midtrans account untuk payment gateway

### 2. **Installation & Setup**

```bash
# Clone repository
git clone https://github.com/your-username/perpustakaan-naratama-backend.git
cd perpustakaan-naratama-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Start MongoDB (jika local)
mongod

# Run application
npm run dev
```

### 3. **First Time Setup**

1. **Database**: Akan otomatis create collections saat pertama dijalankan
2. **Admin User**: Register user pertama, kemudian manual ubah role ke 'admin' di database
3. **Email Service**: Setup Gmail App Password di .env file
4. **Midtrans**: Setup Server Key dan Client Key untuk payment

## 🎯 User Workflows

### 👤 **Regular User Journey**

1. **Register** → Verifikasi OTP via email → Auto login
2. **Browse Books** → Search/filter → View details
3. **Borrow Book** → Payment via Midtrans → Confirm loan
4. **Return Book** → Refund otomatis jika tepat waktu
5. **Book Room** → Validasi rules → Confirmation
6. **Receive Notifications** → Email saat ada buku baru

### 👨‍💼 **Admin Journey**

1. **Login with OTP** → Access admin features
2. **Manage Books** → CRUD operations → Auto email announcement
3. **Create Announcements** → Broadcast ke semua user
4. **Manage Rooms** → CRUD room management
5. **View Bookings** → Manage all user bookings
6. **Payment Oversight** → Monitor transactions

## 🔧 Development Workflow

### **Code Structure Best Practices**

- **Controllers**: Business logic dan API handlers
- **Models**: Database schemas dengan Mongoose
- **Services**: External integrations (email, payment)
- **Utils**: Helper functions dan validations
- **Middleware**: Authentication dan validation
- **Routes**: API endpoint definitions

### **Adding New Features**

1. Create model di `src/models/`
2. Add controller logic di `src/controllers/`
3. Create routes di `src/routes/`
4. Add middleware jika diperlukan
5. Update API documentation
6. Create tests untuk validation

## 🐛 Troubleshooting

### **Common Issues & Solutions**

#### MongoDB Connection Error

```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

#### Email Not Sending

```bash
# Check Gmail App Password
# Verify EMAIL_USER and EMAIL_PASS in .env
# Test with: node test-email.js
```

#### Midtrans Payment Issues

```bash
# Verify server key and client key
# Check webhook URL configuration
# Test in sandbox mode first
```

#### OTP Not Received

```bash
# Check email configuration
# Verify user email address
# Check spam folder
# Try resend OTP feature
```

## 📊 Project Stats

- **Lines of Code**: ~3000+ lines
- **API Endpoints**: 20+ endpoints
- **Security Features**: OTP, JWT, Role-based access
- **Integrations**: MongoDB, Midtrans, Gmail

**🏆 Perpustakaan Naratama Backend API** - Modern library system dengan security tinggi, email automation, dan intelligent room booking system.
