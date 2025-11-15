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
		await mongoose.connect(MONGO_URI, {
			serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
			socketTimeoutMS: 45000,
			family: 4, // Use IPv4, skip trying IPv6
		});
		console.log("MongoDB connected successfully");
		console.log("Database Name:", mongoose.connection.name);
	} catch (error) {
		console.error("MongoDB connection error:", error.message);
		console.error("Please check:");
		console.error("1. MongoDB URI is correct");
		console.error("2. Network access is allowed in MongoDB Atlas");
		console.error("3. Database credentials are valid");
		process.exit(1);
	}
};

module.exports = connectDB;
