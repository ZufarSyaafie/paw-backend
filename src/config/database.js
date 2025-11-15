const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Cache connection untuk serverless environment
let isConnected = false;

const connectDB = async () => {
	if (!MONGO_URI) {
		console.error("MONGO_URI / MONGODB_URI is not set.");
		throw new Error("Missing MongoDB URI");
	}

	// Jika sudah connect, skip
	if (isConnected && mongoose.connection.readyState === 1) {
		console.log("Using existing MongoDB connection");
		return;
	}

	try {
		// Set mongoose options
		mongoose.set('strictQuery', false);
		mongoose.set('bufferCommands', false); // Disable buffering
		
		await mongoose.connect(MONGO_URI, {
			serverSelectionTimeoutMS: 30000,
			socketTimeoutMS: 45000,
			maxPoolSize: 10, // Connection pooling
			minPoolSize: 2,
			family: 4,
		});
		
		isConnected = true;
		console.log("MongoDB connected successfully");
		console.log("Database Name:", mongoose.connection.name);
		
		// Handle connection events
		mongoose.connection.on('disconnected', () => {
			console.log('MongoDB disconnected');
			isConnected = false;
		});
		
		mongoose.connection.on('error', (err) => {
			console.error('MongoDB connection error:', err);
			isConnected = false;
		});
		
	} catch (error) {
		console.error("MongoDB connection error:", error.message);
		console.error("Please check:");
		console.error("1. MongoDB URI is correct");
		console.error("2. Network access is allowed in MongoDB Atlas");
		console.error("3. Database credentials are valid");
		isConnected = false;
		throw error; // Jangan exit di serverless
	}
};

module.exports = connectDB;
