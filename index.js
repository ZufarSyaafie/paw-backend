const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./src/config/database");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});

const authRoutes = require("./src/routes/authRoutes");
const initGoogleStrategy = require("./src/passport/googleStrategy");
const bookRoutes = require("./src/routes/bookRoutes");

// Initialize Google OAuth strategy
initGoogleStrategy();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);

app.get("/", (req, res) => {
	res.send("Welcome to the API");
});

app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).send({ message: err.message });
});
