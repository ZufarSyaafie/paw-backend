const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const cors = require("cors");
require("dotenv").config();

// init passport strategy
const initGoogle = require("./src/passport/googleStrategy");
initGoogle();

const authRoutes = require("./src/routes/authRoutes");
const bookRoutes = require("./src/routes/bookRoutes");
const roomRoutes = require("./src/routes/roomRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const userRoutes = require("./src/routes/userRoutes");
const loanRoutes = require("./src/routes/loanRoutes");

const app = express();

app.use(cors({ 
  origin: 'http://localhost:3000', 
  credentials: true 
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// initialize passport
app.use(passport.initialize());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/loans", loanRoutes);

// health
app.get("/", (req, res) => res.send("Perpustakaan API running"));

app.use((err, req, res, next) => {
	console.error(err.stack); // log errornya di server
	
	const statusCode = err.status || 500;
	const message = err.message || "Terjadi kesalahan pada server";

	res.status(statusCode).json({
		message: message,
		// Kalo lagi development, kirim stack trace-nya
		stack: process.env.NODE_ENV === 'production' ? null : err.stack,
	});
});

module.exports = app;
