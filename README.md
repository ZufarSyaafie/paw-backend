# 📚 Perpustakaan Naratama - Backend API

A modern, production-ready RESTful API for Perpustakaan Naratama Library Management System featuring comprehensive book management, intelligent rule-based room booking, automated email notification system, and multi-layer authentication with OTP verification.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/ZufarSyaafie/paw-backend)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%3E%3D4.4-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Features Overview](#features-overview)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
  - [Authentication API](#authentication-api)
  - [Books API](#books-api)
  - [Loans API](#loans-api)
  - [Rooms API](#rooms-api)
  - [Announcements API](#announcements-api)
  - [Payments API](#payments-api)
  - [Users API](#users-api)
- [Project Structure](#project-structure)
- [Security Features](#security-features)
- [Contributing](#contributing)
- [Authors](#authors---naratamas-team)

---

## Features Overview

### 🔐 Multi-Layer Authentication

- **OTP Verification**: 6-digit OTP via email for registration and login (10-minute expiry)
- **Google OAuth 2.0**: Social login with auto-verified status
- **JWT Tokens**: Secure session management with role-based access control
- **Password Recovery**: Forgot password with OTP verification
- **Role System**: User and Admin permissions with middleware protection

### 📚 Book Management System

- **CRUD Operations**: Complete book management with validation
- **Advanced Search**: Filter by title, author, category with pagination
- **Stock Management**: Real-time book availability tracking
- **Loan System**: Integrated borrowing with Rp 25,000 deposit via Midtrans
- **Return Process**: Automatic refund for on-time returns
- **Loan History**: Complete borrowing history tracking

### 🏢 Intelligent Room Booking System

- **Working Days Only**: Automatic weekend blocking (Saturday-Sunday)
- **Operating Hours**: 08:00-17:00 with strict validation
- **Phone Required**: Indonesian phone format validation (08xxxxxxxxx)
- **Minimum Duration**: 1-hour minimum booking requirement
- **Conflict Detection**: Automatic scheduling conflict prevention
- **Smart Cancellation**: Different rules for users (2h before) and admin (anytime)

### 📧 Professional Email System

- **Auto-Announcement**: Automatic email when admin adds new books
- **Custom Announcements**: Broadcast custom messages to all verified users
- **HTML Templates**: Responsive email templates with gradient branding
- **Delivery Statistics**: Real-time tracking of email delivery status
- **Professional Design**: Modern footer with disclaimer and unsubscribe info

### 💳 Payment Integration

- **Midtrans Gateway**: Secure payment processing
- **Webhook Handler**: Real-time payment status updates
- **Automatic Refund**: On-time book return refund processing
- **Transaction Tracking**: Complete payment history

---

## Technology Stack

- **Runtime**: Node.js v16+
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB v4.4+ with Mongoose ODM
- **Authentication**: JWT, Passport.js (Google OAuth 2.0)
- **Email Service**: Nodemailer with Gmail
- **Payment Gateway**: Midtrans Client v1.4.3
- **Date Handling**: date-fns v4.1.0
- **Security**: bcrypt v6.0.0, OTP verification
- **Session Management**: express-session with cookies

---

## Quick Start

### Prerequisites

- Node.js v16 or higher
- MongoDB v4.4 or higher
- Gmail account for email service
- Midtrans account for payment gateway

### Installation

```bash
# Clone repository
git clone https://github.com/ZufarSyaafie/paw-backend.git
cd paw-backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB (if running locally)
mongod

# Run development server
npm run dev

# Run production server
npm start
```

### First Time Setup

1. **Database**: Collections will be auto-created on first run
2. **Admin User**: Register first user, then manually update role to 'admin' in database
3. **Email Service**: Configure Gmail App Password in .env
4. **Midtrans**: Set up Server Key and Client Key for payment processing

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/perpustakaan_naratama

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Frontend URL (for CORS and redirects)
FRONTEND_URL=http://localhost:5173
```

---

## API Documentation

Base URL: `http://localhost:3000`

### Authentication API

#### 1. Register User

Register new user with OTP verification.

**Endpoint:** `POST /auth/register`

**Request Body:**

```json
{
	"username": "johndoe",
	"email": "johndoe@example.com",
	"password": "SecurePass123!",
	"fullName": "John Doe"
}
```

**Success Response (201):**

```json
{
	"message": "User registered successfully. Please check your email for OTP verification.",
	"userId": "6582a1f4e8b4c1234567890a",
	"email": "johndoe@example.com"
}
```

**Error Response (400):**

```json
{
	"error": "Email already registered"
}
```

---

#### 2. Verify Registration OTP

Verify OTP sent during registration.

**Endpoint:** `POST /auth/verify-registration-otp`

**Request Body:**

```json
{
	"email": "johndoe@example.com",
	"otp": "123456"
}
```

**Success Response (200):**

```json
{
	"message": "Account verified successfully",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"user": {
		"id": "6582a1f4e8b4c1234567890a",
		"username": "johndoe",
		"email": "johndoe@example.com",
		"fullName": "John Doe",
		"role": "user",
		"isVerified": true
	}
}
```

**Error Response (400):**

```json
{
	"error": "Invalid or expired OTP"
}
```

---

#### 3. Login

Login with email and password, OTP will be sent to email.

**Endpoint:** `POST /auth/login`

**Request Body:**

```json
{
	"email": "johndoe@example.com",
	"password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
	"message": "OTP sent to your email. Please verify to complete login.",
	"email": "johndoe@example.com"
}
```

**Error Response (401):**

```json
{
	"error": "Invalid credentials"
}
```

---

#### 4. Verify Login OTP

Verify OTP sent during login.

**Endpoint:** `POST /auth/verify-login-otp`

**Request Body:**

```json
{
	"email": "johndoe@example.com",
	"otp": "654321"
}
```

**Success Response (200):**

```json
{
	"message": "Login successful",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
	"user": {
		"id": "6582a1f4e8b4c1234567890a",
		"username": "johndoe",
		"email": "johndoe@example.com",
		"fullName": "John Doe",
		"role": "user",
		"isVerified": true
	}
}
```

---

#### 5. Resend Registration OTP

Resend OTP for registration verification.

**Endpoint:** `POST /auth/resend-registration-otp`

**Request Body:**

```json
{
	"email": "johndoe@example.com"
}
```

**Success Response (200):**

```json
{
	"message": "New OTP sent to your email"
}
```

---

#### 6. Resend Login OTP

Resend OTP for login verification.

**Endpoint:** `POST /auth/resend-login-otp`

**Request Body:**

```json
{
	"email": "johndoe@example.com"
}
```

**Success Response (200):**

```json
{
	"message": "New OTP sent to your email"
}
```

---

#### 7. Forgot Password

Request password reset OTP.

**Endpoint:** `POST /auth/forgot-password`

**Request Body:**

```json
{
	"email": "johndoe@example.com"
}
```

**Success Response (200):**

```json
{
	"message": "Password reset OTP sent to your email"
}
```

---

#### 8. Reset Password

Reset password using OTP.

**Endpoint:** `POST /auth/reset-password`

**Request Body:**

```json
{
	"email": "johndoe@example.com",
	"otp": "789012",
	"newPassword": "NewSecurePass456!"
}
```

**Success Response (200):**

```json
{
	"message": "Password reset successfully"
}
```

---

#### 9. Google OAuth Login

Initiate Google OAuth login.

**Endpoint:** `GET /auth/google`

Redirects to Google login page.

---

#### 10. Google OAuth Callback

Google OAuth callback endpoint (handled automatically).

**Endpoint:** `GET /auth/google/callback`

Redirects to frontend with JWT token on success.

---

#### 11. Logout

Logout user (clears session).

**Endpoint:** `POST /auth/logout`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"message": "Logged out successfully"
}
```

---

### Books API

#### 1. List Books

Get all books with pagination, search, and filters.

**Endpoint:** `GET /books`

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by title or author
- `category` (optional): Filter by category

**Example:** `GET /books?page=1&limit=10&search=harry&category=Fiction`

**Success Response (200):**

```json
{
	"books": [
		{
			"_id": "6582a1f4e8b4c1234567890b",
			"title": "Harry Potter and the Philosopher's Stone",
			"author": "J.K. Rowling",
			"category": "Fiction",
			"isbn": "978-0-7475-3269-9",
			"publisher": "Bloomsbury",
			"publishedYear": 1997,
			"stock": 5,
			"description": "The first book in the Harry Potter series",
			"coverImage": "https://example.com/images/harry-potter-1.jpg",
			"createdAt": "2024-01-15T10:30:00.000Z",
			"updatedAt": "2024-01-15T10:30:00.000Z"
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 5,
		"totalBooks": 48,
		"limit": 10
	}
}
```

---

#### 2. Get Book by ID

Get detailed information about a specific book.

**Endpoint:** `GET /books/:id`

**Success Response (200):**

```json
{
	"_id": "6582a1f4e8b4c1234567890b",
	"title": "Harry Potter and the Philosopher's Stone",
	"author": "J.K. Rowling",
	"category": "Fiction",
	"isbn": "978-0-7475-3269-9",
	"publisher": "Bloomsbury",
	"publishedYear": 1997,
	"stock": 5,
	"description": "The first book in the Harry Potter series",
	"coverImage": "https://example.com/images/harry-potter-1.jpg",
	"createdAt": "2024-01-15T10:30:00.000Z",
	"updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (404):**

```json
{
	"error": "Book not found"
}
```

---

#### 3. Get Categories

Get all available book categories.

**Endpoint:** `GET /books/categories`

**Success Response (200):**

```json
{
	"categories": [
		"Fiction",
		"Non-Fiction",
		"Science",
		"History",
		"Biography",
		"Technology",
		"Self-Help"
	]
}
```

---

#### 4. Get Top Categories

Get categories with the most books.

**Endpoint:** `GET /books/categories/top`

**Success Response (200):**

```json
{
	"topCategories": [
		{
			"category": "Fiction",
			"count": 25
		},
		{
			"category": "Science",
			"count": 18
		},
		{
			"category": "History",
			"count": 12
		}
	]
}
```

---

#### 5. Create Book (Admin Only)

Add new book to the library. Automatically sends email announcement to all verified users.

**Endpoint:** `POST /books`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"title": "Clean Code",
	"author": "Robert C. Martin",
	"category": "Technology",
	"isbn": "978-0-13-235088-4",
	"publisher": "Prentice Hall",
	"publishedYear": 2008,
	"stock": 10,
	"description": "A handbook of agile software craftsmanship",
	"coverImage": "https://example.com/images/clean-code.jpg"
}
```

**Success Response (201):**

```json
{
	"message": "Book created successfully",
	"book": {
		"_id": "6582a1f4e8b4c1234567890c",
		"title": "Clean Code",
		"author": "Robert C. Martin",
		"category": "Technology",
		"isbn": "978-0-13-235088-4",
		"publisher": "Prentice Hall",
		"publishedYear": 2008,
		"stock": 10,
		"description": "A handbook of agile software craftsmanship",
		"coverImage": "https://example.com/images/clean-code.jpg",
		"createdAt": "2024-01-16T14:20:00.000Z",
		"updatedAt": "2024-01-16T14:20:00.000Z"
	},
	"emailStats": {
		"sent": 45,
		"failed": 2
	}
}
```

---

#### 6. Update Book (Admin Only)

Update existing book information.

**Endpoint:** `PUT /books/:id`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"stock": 15,
	"description": "Updated description with more details"
}
```

**Success Response (200):**

```json
{
	"message": "Book updated successfully",
	"book": {
		"_id": "6582a1f4e8b4c1234567890c",
		"title": "Clean Code",
		"author": "Robert C. Martin",
		"stock": 15,
		"description": "Updated description with more details"
	}
}
```

---

#### 7. Delete Book (Admin Only)

Delete a book from the library.

**Endpoint:** `DELETE /books/:id`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"message": "Book deleted successfully"
}
```

---

#### 8. Borrow Book

Borrow a book with Rp 25,000 deposit via Midtrans.

**Endpoint:** `POST /books/:id/borrow`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"dueDate": "2024-02-15"
}
```

**Success Response (200):**

```json
{
	"message": "Please complete payment to confirm loan",
	"loan": {
		"_id": "6582a1f4e8b4c1234567890d",
		"userId": "6582a1f4e8b4c1234567890a",
		"bookId": "6582a1f4e8b4c1234567890b",
		"borrowDate": "2024-01-16T15:00:00.000Z",
		"dueDate": "2024-02-15T15:00:00.000Z",
		"status": "pending",
		"deposit": 25000,
		"orderId": "LOAN-1705417200-ABC123"
	},
	"payment": {
		"token": "e3feb5a4-b0b8-4c8e-935b-4e9b46cd2af6",
		"redirect_url": "https://app.sandbox.midtrans.com/snap/v3/redirection/e3feb5a4..."
	}
}
```

---

### Loans API

#### 1. Get My Loans

Get current user's loan history.

**Endpoint:** `GET /loans/my`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"loans": [
		{
			"_id": "6582a1f4e8b4c1234567890d",
			"book": {
				"_id": "6582a1f4e8b4c1234567890b",
				"title": "Harry Potter and the Philosopher's Stone",
				"author": "J.K. Rowling"
			},
			"borrowDate": "2024-01-16T15:00:00.000Z",
			"dueDate": "2024-02-15T15:00:00.000Z",
			"returnDate": null,
			"status": "active",
			"deposit": 25000,
			"depositRefunded": false,
			"orderId": "LOAN-1705417200-ABC123"
		}
	]
}
```

---

#### 2. Get Loan by ID

Get specific loan details (owner or admin only).

**Endpoint:** `GET /loans/:id`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"_id": "6582a1f4e8b4c1234567890d",
	"user": {
		"_id": "6582a1f4e8b4c1234567890a",
		"username": "johndoe",
		"email": "johndoe@example.com",
		"fullName": "John Doe"
	},
	"book": {
		"_id": "6582a1f4e8b4c1234567890b",
		"title": "Harry Potter and the Philosopher's Stone",
		"author": "J.K. Rowling"
	},
	"borrowDate": "2024-01-16T15:00:00.000Z",
	"dueDate": "2024-02-15T15:00:00.000Z",
	"returnDate": null,
	"status": "active",
	"deposit": 25000,
	"depositRefunded": false,
	"orderId": "LOAN-1705417200-ABC123"
}
```

---

#### 3. Get All Loans (Admin Only)

Get all loans from all users.

**Endpoint:** `GET /loans`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `status` (optional): Filter by status (active, returned, overdue, pending, cancelled)
- `page` (optional): Page number
- `limit` (optional): Items per page

**Success Response (200):**

```json
{
	"loans": [
		{
			"_id": "6582a1f4e8b4c1234567890d",
			"user": {
				"username": "johndoe",
				"email": "johndoe@example.com"
			},
			"book": {
				"title": "Harry Potter",
				"author": "J.K. Rowling"
			},
			"status": "active",
			"borrowDate": "2024-01-16T15:00:00.000Z",
			"dueDate": "2024-02-15T15:00:00.000Z"
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 3,
		"totalLoans": 28
	}
}
```

---

#### 4. Check Loan by Book ID

Check if a book is currently loaned by the user.

**Endpoint:** `GET /loans/status?bookId=6582a1f4e8b4c1234567890b`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"hasActiveLoan": true,
	"loan": {
		"_id": "6582a1f4e8b4c1234567890d",
		"status": "active",
		"dueDate": "2024-02-15T15:00:00.000Z"
	}
}
```

---

#### 5. Return Loan

Return a borrowed book. Automatic refund if returned on time.

**Endpoint:** `POST /loans/:id/return`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"message": "Book returned successfully. Deposit refunded.",
	"loan": {
		"_id": "6582a1f4e8b4c1234567890d",
		"status": "returned",
		"returnDate": "2024-02-14T10:30:00.000Z",
		"depositRefunded": true
	}
}
```

**Late Return Response (200):**

```json
{
	"message": "Book returned successfully. Deposit not refunded due to late return.",
	"loan": {
		"_id": "6582a1f4e8b4c1234567890d",
		"status": "returned",
		"returnDate": "2024-02-20T10:30:00.000Z",
		"depositRefunded": false,
		"daysLate": 5
	}
}
```

---

#### 6. Cancel Loan

Cancel a pending loan (before payment completion).

**Endpoint:** `DELETE /loans/:id/cancel`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"message": "Loan cancelled successfully"
}
```

---

### Rooms API

#### 1. List Rooms

Get all available rooms.

**Endpoint:** `GET /rooms`

**Success Response (200):**

```json
{
	"rooms": [
		{
			"_id": "6582a1f4e8b4c1234567890e",
			"name": "Meeting Room A",
			"capacity": 10,
			"facilities": ["Projector", "Whiteboard", "AC", "WiFi"],
			"description": "Modern meeting room with full facilities",
			"isAvailable": true,
			"createdAt": "2024-01-10T08:00:00.000Z"
		},
		{
			"_id": "6582a1f4e8b4c1234567890f",
			"name": "Study Room B",
			"capacity": 6,
			"facilities": ["Whiteboard", "AC", "WiFi"],
			"description": "Quiet study room for small groups",
			"isAvailable": true,
			"createdAt": "2024-01-10T08:00:00.000Z"
		}
	]
}
```

---

#### 2. Get Room by ID

Get detailed room information.

**Endpoint:** `GET /rooms/:id`

**Success Response (200):**

```json
{
	"_id": "6582a1f4e8b4c1234567890e",
	"name": "Meeting Room A",
	"capacity": 10,
	"facilities": ["Projector", "Whiteboard", "AC", "WiFi"],
	"description": "Modern meeting room with full facilities",
	"isAvailable": true,
	"createdAt": "2024-01-10T08:00:00.000Z",
	"updatedAt": "2024-01-10T08:00:00.000Z"
}
```

---

#### 3. Create Room (Admin Only)

Add new room to the system.

**Endpoint:** `POST /rooms`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"name": "Conference Room C",
	"capacity": 20,
	"facilities": ["Projector", "Whiteboard", "AC", "WiFi", "Video Conference"],
	"description": "Large conference room for presentations",
	"isAvailable": true
}
```

**Success Response (201):**

```json
{
	"message": "Room created successfully",
	"room": {
		"_id": "6582a1f4e8b4c123456789010",
		"name": "Conference Room C",
		"capacity": 20,
		"facilities": ["Projector", "Whiteboard", "AC", "WiFi", "Video Conference"],
		"description": "Large conference room for presentations",
		"isAvailable": true
	}
}
```

---

#### 4. Update Room (Admin Only)

Update room information.

**Endpoint:** `PUT /rooms/:id`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"capacity": 25,
	"isAvailable": false
}
```

**Success Response (200):**

```json
{
	"message": "Room updated successfully",
	"room": {
		"_id": "6582a1f4e8b4c123456789010",
		"name": "Conference Room C",
		"capacity": 25,
		"isAvailable": false
	}
}
```

---

#### 5. Book Room

Book a room with strict validation rules.

**Endpoint:** `POST /rooms/:id/book`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"date": "2024-01-22",
	"startTime": "09:00",
	"endTime": "11:00",
	"purpose": "Team meeting discussion",
	"phone": "081234567890"
}
```

**Success Response (201):**

```json
{
	"message": "Room booked successfully",
	"booking": {
		"_id": "6582a1f4e8b4c123456789011",
		"room": {
			"_id": "6582a1f4e8b4c123456789010",
			"name": "Conference Room C"
		},
		"user": {
			"_id": "6582a1f4e8b4c1234567890a",
			"username": "johndoe",
			"email": "johndoe@example.com"
		},
		"date": "2024-01-22",
		"startTime": "09:00",
		"endTime": "11:00",
		"purpose": "Team meeting discussion",
		"phone": "081234567890",
		"status": "confirmed",
		"createdAt": "2024-01-17T10:00:00.000Z"
	}
}
```

**Error Response - Weekend (400):**

```json
{
	"error": "Room bookings are only allowed on working days (Monday-Friday)"
}
```

**Error Response - Outside Operating Hours (400):**

```json
{
	"error": "Room bookings are only allowed between 08:00 and 17:00"
}
```

**Error Response - Minimum Duration (400):**

```json
{
	"error": "Minimum booking duration is 1 hour"
}
```

**Error Response - Conflict (400):**

```json
{
	"error": "Room is already booked for the selected time slot",
	"conflictingBooking": {
		"date": "2024-01-22",
		"startTime": "09:00",
		"endTime": "12:00"
	}
}
```

---

#### 6. List Bookings

Get all room bookings with filters.

**Endpoint:** `GET /rooms/bookings/list`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `roomId` (optional): Filter by room ID
- `date` (optional): Filter by date (YYYY-MM-DD)
- `status` (optional): Filter by status (confirmed, cancelled, completed)
- `userId` (optional): Filter by user ID (admin only)

**Example:** `GET /rooms/bookings/list?date=2024-01-22&status=confirmed`

**Success Response (200):**

```json
{
	"bookings": [
		{
			"_id": "6582a1f4e8b4c123456789011",
			"room": {
				"_id": "6582a1f4e8b4c123456789010",
				"name": "Conference Room C"
			},
			"user": {
				"username": "johndoe",
				"email": "johndoe@example.com"
			},
			"date": "2024-01-22",
			"startTime": "09:00",
			"endTime": "11:00",
			"purpose": "Team meeting discussion",
			"phone": "081234567890",
			"status": "confirmed"
		}
	]
}
```

---

#### 7. Cancel Booking

Cancel a room booking with role-based rules.

**Endpoint:** `PUT /rooms/bookings/:id/cancel`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"message": "Booking cancelled successfully",
	"booking": {
		"_id": "6582a1f4e8b4c123456789011",
		"status": "cancelled",
		"cancelledAt": "2024-01-20T14:30:00.000Z"
	}
}
```

**Error Response - Too Late (400):**

```json
{
	"error": "Bookings can only be cancelled at least 2 hours before the start time"
}
```

**Note:** Admin can cancel anytime, users must cancel at least 2 hours before booking start time.

---

### Announcements API

#### 1. List Announcements

Get all announcements.

**Endpoint:** `GET /announcements`

**Success Response (200):**

```json
{
	"announcements": [
		{
			"_id": "6582a1f4e8b4c123456789012",
			"title": "New Books Available!",
			"content": "We've added 10 new technology books to our collection.",
			"type": "info",
			"createdBy": {
				"username": "admin",
				"fullName": "Admin User"
			},
			"emailsSent": 48,
			"emailsFailed": 2,
			"createdAt": "2024-01-16T14:30:00.000Z"
		},
		{
			"_id": "6582a1f4e8b4c123456789013",
			"title": "Library Hours Update",
			"content": "Library will be closed on January 25th for maintenance.",
			"type": "important",
			"createdBy": {
				"username": "admin"
			},
			"emailsSent": 50,
			"emailsFailed": 0,
			"createdAt": "2024-01-15T09:00:00.000Z"
		}
	]
}
```

---

#### 2. Create Announcement (Admin Only)

Create new announcement and send email to all verified users.

**Endpoint:** `POST /announcements`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"title": "Weekend Reading Program",
	"content": "Join our new weekend reading program starting next Saturday. Free coffee and discussions!",
	"type": "info"
}
```

**Success Response (201):**

```json
{
	"message": "Announcement created and emails sent successfully",
	"announcement": {
		"_id": "6582a1f4e8b4c123456789014",
		"title": "Weekend Reading Program",
		"content": "Join our new weekend reading program starting next Saturday. Free coffee and discussions!",
		"type": "info",
		"createdBy": "6582a1f4e8b4c123456789015",
		"emailsSent": 47,
		"emailsFailed": 3,
		"createdAt": "2024-01-17T11:00:00.000Z"
	},
	"emailStats": {
		"total": 50,
		"sent": 47,
		"failed": 3
	}
}
```

---

#### 3. Resend Announcement Emails (Admin Only)

Resend emails for an existing announcement.

**Endpoint:** `POST /announcements/:id/send-emails`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"message": "Emails sent successfully",
	"emailStats": {
		"total": 50,
		"sent": 50,
		"failed": 0
	}
}
```

---

### Payments API

#### 1. Midtrans Webhook Notification

Handle Midtrans payment webhook (automatic callback).

**Endpoint:** `POST /payment/notification`

**Request Body:** (Sent by Midtrans)

```json
{
	"transaction_status": "settlement",
	"order_id": "LOAN-1705417200-ABC123",
	"gross_amount": "25000.00",
	"payment_type": "bank_transfer",
	"transaction_time": "2024-01-16 15:30:00"
}
```

**Success Response (200):**

```json
{
	"message": "Payment notification processed successfully"
}
```

---

#### 2. Get Payment Status

Check payment status by order ID.

**Endpoint:** `GET /payment/status/:orderId`

**Success Response (200):**

```json
{
	"orderId": "LOAN-1705417200-ABC123",
	"transactionStatus": "settlement",
	"grossAmount": "25000.00",
	"paymentType": "bank_transfer",
	"transactionTime": "2024-01-16 15:30:00",
	"loan": {
		"_id": "6582a1f4e8b4c1234567890d",
		"status": "active",
		"book": {
			"title": "Harry Potter and the Philosopher's Stone"
		}
	}
}
```

---

#### 3. Get My Payments

Get current user's payment history.

**Endpoint:** `GET /payment/my`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"payments": [
		{
			"orderId": "LOAN-1705417200-ABC123",
			"amount": 25000,
			"status": "settlement",
			"paymentType": "bank_transfer",
			"transactionTime": "2024-01-16T15:30:00.000Z",
			"loan": {
				"book": {
					"title": "Harry Potter and the Philosopher's Stone"
				},
				"status": "active"
			}
		}
	]
}
```

---

### Users API

#### 1. List Users (Admin Only)

Get all registered users.

**Endpoint:** `GET /users`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters:**

- `page` (optional): Page number
- `limit` (optional): Items per page
- `role` (optional): Filter by role (user, admin)
- `isVerified` (optional): Filter by verification status

**Success Response (200):**

```json
{
	"users": [
		{
			"_id": "6582a1f4e8b4c1234567890a",
			"username": "johndoe",
			"email": "johndoe@example.com",
			"fullName": "John Doe",
			"role": "user",
			"isVerified": true,
			"createdAt": "2024-01-15T10:00:00.000Z"
		},
		{
			"_id": "6582a1f4e8b4c123456789015",
			"username": "admin",
			"email": "admin@example.com",
			"fullName": "Admin User",
			"role": "admin",
			"isVerified": true,
			"createdAt": "2024-01-10T08:00:00.000Z"
		}
	],
	"pagination": {
		"currentPage": 1,
		"totalPages": 3,
		"totalUsers": 52
	}
}
```

---

#### 2. Get My Profile

Get current user's profile.

**Endpoint:** `GET /users/me`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"_id": "6582a1f4e8b4c1234567890a",
	"username": "johndoe",
	"email": "johndoe@example.com",
	"fullName": "John Doe",
	"role": "user",
	"isVerified": true,
	"createdAt": "2024-01-15T10:00:00.000Z",
	"stats": {
		"activeLoans": 2,
		"totalLoans": 15,
		"totalBookings": 8
	}
}
```

---

#### 3. Update My Profile

Update current user's profile.

**Endpoint:** `PUT /users/me`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"fullName": "John Doe Jr.",
	"password": "NewPassword123!"
}
```

**Success Response (200):**

```json
{
	"message": "Profile updated successfully",
	"user": {
		"_id": "6582a1f4e8b4c1234567890a",
		"username": "johndoe",
		"email": "johndoe@example.com",
		"fullName": "John Doe Jr.",
		"role": "user"
	}
}
```

---

#### 4. Get User by ID (Admin Only)

Get specific user details.

**Endpoint:** `GET /users/:id`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"_id": "6582a1f4e8b4c1234567890a",
	"username": "johndoe",
	"email": "johndoe@example.com",
	"fullName": "John Doe",
	"role": "user",
	"isVerified": true,
	"createdAt": "2024-01-15T10:00:00.000Z",
	"stats": {
		"activeLoans": 2,
		"totalLoans": 15,
		"totalBookings": 8
	}
}
```

---

#### 5. Create User (Admin Only)

Create new user (for admin seeding/quick creation).

**Endpoint:** `POST /users`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**

```json
{
	"username": "janedoe",
	"email": "janedoe@example.com",
	"password": "SecurePass123!",
	"fullName": "Jane Doe",
	"role": "user"
}
```

**Success Response (201):**

```json
{
	"message": "User created successfully",
	"user": {
		"_id": "6582a1f4e8b4c123456789016",
		"username": "janedoe",
		"email": "janedoe@example.com",
		"fullName": "Jane Doe",
		"role": "user",
		"isVerified": true
	}
}
```

---

#### 6. Delete User (Admin Only)

Delete a user account.

**Endpoint:** `DELETE /users/:id`

**Headers:**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**

```json
{
	"message": "User deleted successfully"
}
```

---

## Project Structure

```text
paw-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection configuration
│   │   └── jwt.js               # JWT secret and token utilities
│   │
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic (register, login, OTP)
│   │   ├── bookController.js    # Book management operations
│   │   ├── loansController.js   # Book loan operations
│   │   ├── roomController.js    # Room booking management
│   │   ├── announcementController.js # Announcement system
│   │   ├── paymentController.js # Payment processing
│   │   └── usersController.js   # User management
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification & role checks
│   │   └── dbMiddleware.js      # Database connection middleware
│   │
│   ├── models/
│   │   ├── User.js              # User schema with OTP fields
│   │   ├── Book.js              # Book schema
│   │   ├── Loan.js              # Book loan schema
│   │   ├── Room.js              # Room schema
│   │   ├── Booking.js           # Room booking schema
│   │   └── Announcement.js      # Announcement schema
│   │
│   ├── routes/
│   │   ├── authRoutes.js        # Authentication endpoints
│   │   ├── bookRoutes.js        # Book management endpoints
│   │   ├── loanRoutes.js        # Loan management endpoints
│   │   ├── roomRoutes.js        # Room booking endpoints
│   │   ├── announcementRoutes.js # Announcement endpoints
│   │   ├── paymentRoutes.js     # Payment endpoints
│   │   └── userRoutes.js        # User management endpoints
│   │
│   ├── services/
│   │   ├── emailService.js      # Email sending with HTML templates
│   │   └── midtrans.js          # Midtrans payment gateway integration
│   │
│   ├── utils/
│   │   ├── otpService.js        # OTP generation and validation
│   │   └── dateUtils.js         # Date/time helper functions
│   │
│   └── passport/
│       └── googleStrategy.js    # Google OAuth 2.0 strategy
│
├── app.js                        # Express app configuration
├── server.js                     # Server entry point
├── package.json                  # Dependencies and scripts
├── vercel.json                   # Vercel deployment configuration
└── README.md                     # This file
```

---

## Security Features

### 🔐 Authentication & Authorization

- **OTP Verification**: 6-digit OTP with 10-minute expiry for registration and login
- **JWT Tokens**: Secure session management with HS256 algorithm
- **Password Hashing**: bcrypt with salt rounds for secure password storage
- **Role-Based Access Control (RBAC)**: User and Admin roles with middleware protection
- **Google OAuth 2.0**: Social login with Passport.js integration

### 🛡️ Input Validation & Sanitization

- **Phone Number Validation**: Indonesian format (08xxxxxxxxx)
- **Email Validation**: RFC-compliant email format checking
- **Date Validation**: ISO format with timezone handling
- **SQL Injection Prevention**: MongoDB parameterized queries
- **XSS Protection**: Input sanitization on all user inputs

### 📋 Business Logic Validation

- **Working Days Only**: Automatic weekend blocking for room bookings
- **Operating Hours**: 08:00-17:00 strict validation
- **Minimum Duration**: 1-hour minimum for room bookings
- **Conflict Detection**: Automatic scheduling overlap prevention
- **Stock Management**: Real-time book availability checking

### 🔒 Additional Security Measures

- **CORS Configuration**: Whitelist-based cross-origin requests
- **Rate Limiting**: Protection against brute-force attacks (recommended to implement)
- **Secure Headers**: Helmet.js integration (recommended to implement)
- **Environment Variables**: Sensitive data in .env file
- **Token Expiration**: JWT tokens with configurable expiry

---

## Room Booking Rules

### ✅ Automatic Validations

1. **Working Days Only**: Monday to Friday (weekends automatically blocked)
2. **Operating Hours**: 08:00 to 17:00 (outside hours rejected)
3. **Phone Number Required**: Indonesian format 08xxxxxxxxx
4. **Minimum Duration**: 1 hour minimum booking time
5. **No Overlaps**: Automatic conflict detection with existing bookings
6. **Future Dates Only**: Cannot book past dates
7. **Same-Day Limit**: Cannot book within 2 hours of current time

### 🚫 Cancellation Rules

- **Users**: Can cancel at least 2 hours before booking start time
- **Admins**: Can cancel anytime

### ⚠️ Auto-Blocked Scenarios

- Weekend bookings (Saturday-Sunday)
- Bookings less than 1 hour duration
- Invalid phone number format
- Outside operating hours (before 08:00 or after 17:00)
- Conflicts with existing bookings
- Past dates
- Same-day bookings within 2-hour window

---

## Email System

### 📧 Automatic Email Notifications

1. **Registration OTP**: Sent immediately after registration
2. **Login OTP**: Sent when user attempts to login
3. **New Book Added**: Automatically sent when admin adds new book
4. **Custom Announcements**: Manual broadcast by admin
5. **Password Reset OTP**: Sent when user requests password reset

### 🎨 Email Templates

All emails use professional HTML templates with:

- **Responsive Design**: Mobile and desktop friendly
- **Gradient Branding**: Perpustakaan Naratama color scheme
- **Clear CTAs**: Action buttons and links
- **Professional Footer**: Disclaimer and contact information
- **Security Info**: OTP expiry time and security warnings

### 📊 Delivery Statistics

- Real-time tracking of emails sent/failed
- Stored in announcement/book documents
- Visible to admins for monitoring

---

## Development

### Running Tests

```bash
npm test
```

### Code Style

This project follows JavaScript Standard Style with ESLint.

```bash
npm run lint
```

### Database Seeding

To seed the database with sample data:

```bash
npm run seed
```

---

## Deployment

### Vercel Deployment

This project is configured for Vercel deployment.

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Production)

Ensure all environment variables are set in your hosting platform:

- MongoDB Atlas connection string (not localhost)
- Production Midtrans keys
- Production Google OAuth credentials
- Strong JWT secret (min 32 characters)
- Production email credentials

---

## API Response Format

### Success Response

```json
{
  "message": "Operation successful",
  "data": { ... },
  "metadata": { ... }
}
```

### Error Response

```json
{
	"error": "Error message description",
	"details": "Additional error details (development only)"
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Authentication required or failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., booking overlap)
- **500 Internal Server Error**: Server error

---

## Troubleshooting

### MongoDB Connection Error

```bash
# Check MongoDB service
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/perpustakaan_naratama
```

### Email Not Sending

1. **Check Gmail Settings**:

   - Enable 2-Factor Authentication
   - Generate App Password
   - Use App Password in .env (not regular password)

2. **Verify .env Configuration**:

   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-digit-app-password
   ```

3. **Test Email Service**:

   ```bash
   node -e "require('./src/services/emailService').testEmail()"
   ```

### Midtrans Payment Issues

1. **Sandbox vs Production**: Ensure correct keys for environment
2. **Webhook URL**: Must be publicly accessible (use ngrok for local testing)
3. **Server Key**: Verify in Midtrans dashboard
4. **Test Transactions**: Use Midtrans test cards in sandbox mode

### OTP Not Received

1. Check email spam folder
2. Verify email service is running
3. Check user email address is correct
4. Try resend OTP endpoint
5. Check OTP expiry time (10 minutes)

### JWT Token Errors

1. **Invalid Token**: Token expired or malformed
2. **Missing Token**: Authorization header required
3. **Wrong Role**: User doesn't have required permissions

```bash
# Test JWT token generation
node -e "console.log(require('jsonwebtoken').sign({test: true}, process.env.JWT_SECRET))"
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Pull Request Process

1. Fork the repository
2. Create feature branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. Commit your changes:

   ```bash
   git commit -m 'Add amazing feature'
   ```

4. Push to branch:

   ```bash
   git push origin feature/amazing-feature
   ```

5. Open Pull Request with detailed description

### Coding Standards

- Use ESLint for code linting
- Follow JavaScript Standard Style
- Write meaningful commit messages
- Add comments for complex logic
- Update README for new features

### Testing

- Write unit tests for new features
- Ensure all tests pass before PR
- Test edge cases and error scenarios

---

## License

This project is licensed under the ISC License. See LICENSE file for details.

---

## Authors - Naratama's Team

- **23/517479/TK/56923** | Muhammad Zufar Syaafi'
- **23/514860/TK/56532** | Olivia Nefri
- **23/516603/TK/56796** | Abdul Halim Edi Rahmansyah
- **23/517440/TK/56918** | Syifa Alifiya
- **23/515523/TK/56680** | Kistosi Al Ghifari

---

## Acknowledgments

- MongoDB for excellent database documentation
- Midtrans for payment gateway integration
- Google for OAuth 2.0 API
- Node.js and Express.js communities
- All open-source contributors

---

## Contact & Support

For questions or support, please contact:

- **GitHub Issues**: [Report Bug](https://github.com/ZufarSyaafie/paw-backend/issues)
- **Documentation**: [GitHub Wiki](https://github.com/ZufarSyaafie/paw-backend/wiki)

---

## Changelog

### Version 1.0.0 (2024-01-17)

- Initial release
- Complete authentication system with OTP
- Book management and loan system
- Room booking with intelligent rules
- Email notification system
- Midtrans payment integration
- Admin dashboard features

---

**🏆 Perpustakaan Naratama Backend API** - A modern, secure, and feature-rich library management system built with Node.js, Express.js, and MongoDB.

Made with ❤️ by Naratama's Team
