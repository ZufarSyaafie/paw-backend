const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI, {
			// options not required for mongoose 7+
		});
		console.log(`MongoDB connected: ${mongoose.connection.host}`);
		console.log(`MongoDB database: ${mongoose.connection.name}`);
	} catch (err) {
		console.error("MongoDB connection error", err);
		process.exit(1);
	}
};

module.exports = connectDB;
