# Perpustakaan Digital "Naratama" 📚

Sistem manajemen perpustakaan modern dengan fitur peminjaman buku dan sistem commitment fee terintegrasi.

## 🚀 Fitur Utama

### 📚 Sistem Peminjaman
- **Commitment Fee System**: Rp25.000 untuk setiap peminjaman
- **Flexible Borrowing**: Baca di tempat atau bawa pulang
- **Member Benefits**: 
  - Extended borrowing period (21 hari vs 14 hari)
  - 50% discount pada denda keterlambatan
  - Priority access

### 🔐 Authentication & Security
- JWT-based authentication
- Password hashing dengan bcryptjs
- Role-based access (Admin/User)
- Protected API endpoints

### 📊 Book Management
- Full CRUD operations untuk buku
- Stock tracking system
- Category management
- Search & filter functionality

## 💻 Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: MongoDB dengan Mongoose
- **Authentication**: JWT
- **Security**: bcryptjs
- **Others**: cors, dotenv

### Testing
- Custom test suite untuk borrowing system
- API endpoint testing

## 🛠️ Project Structure
```
project-root/
├── models/
│   ├── User.js
│   ├── Book.js
│   ├── Borrowing.js
│   ├── Room.js
│   └── RoomBooking.js
├── routes/
│   ├── auth.js
│   ├── books.js
│   ├── borrowing.js
│   └── room.js
├── middleware/
│   ├── auth.js
│   ├── bookingvalidation.js
│   └── borrowing.js
├── utils/
│   ├── dateUtils.js
│   └── fineCalculator.js
├── tests/
│   ├── test-borrowing.js
│   └── etc
├── app.js
├── package-lock.json
├── package.json
└── README.md
```

## ⚙️ Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd project-paw
```

2. **Install dependencies**
```bash
npm install
```

3. **Run development server**
```bash
npm run dev
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Books
- `GET /api/books` - Get all books
- `POST /api/books` - Add new book (Admin)
- `GET /api/books/:id` - Get book details
- `PUT /api/books/:id` - Update book (Admin)
- `GET /api/books/search` - Search with filters
- `GET /api/books/category/:category` - Get by category
- `GET /api/books/recent` - Recent books

### Borrowing
- `POST /api/borrowing/borrow` - Borrow a book
- `POST /api/borrowing/return` - Return a book
- `GET /api/borrowing/my-borrowings` - User's borrowings
- `GET /api/borrowing/active` - Active borrowings

### Room Management
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/check-availability` - Check room availability
- `POST /api/rooms/book` - Book a room

### Payments
- `POST /api/payments/commitment-fee` - Pay commitment fee
- `POST /api/payments/fine` - Pay late return fine

### Admin Dashboard
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/overdue` - Overdue borrowings

## 💰 Borrowing Rules

- **Commitment Fee**: Rp25.000
- **Late Fine**: Rp5.000/day (Rp2.500 for members)
- **Borrowing Period**:
  - Regular: 14 days
  - Member: 21 days
- **Operating Hours**: Monday-Friday, 08:00-17:00

## 👥 Contributors

- Muhammad Zufar Syaafi' (23/517479/TK/56923)
- Olivia Nefri (23/514860/TK/56532)
- Abdul Halim Edi Rahmansyah (23/516603/TK/56796)
- Syifa Alifiya (23/517440/TK/56918)
- Kistosi Al Ghifari (23/515523/TK/56680)