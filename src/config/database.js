const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const connectDB = async () => {
	if (!MONGO_URI) {
		console.error("MONGO_URI / MONGODB_URI is not set.");
		throw new Error("Missing MongoDB URI");
	}

	try {
		await mongoose.connect(MONGO_URI);
		console.log("MongoDB connected");
		console.log("Database Name:", mongoose.connection.name);
	} catch (error) {
		console.error("MongoDB connection error:", error);
		process.exit(1);
	}
};

module.exports = connectDB;
