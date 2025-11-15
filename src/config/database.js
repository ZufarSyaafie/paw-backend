const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Serverless-friendly connection caching.
// When deployed to Vercel (or other serverless platforms), functions may cold-start
// frequently. Re-using an existing Mongoose connection across invocations avoids
// creating too many connections and prevents buffering/timeouts like the one you saw.

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

// Keep cached connection across module reloads (Vercel keeps lambdas warm sometimes)
let cached =
	global._mongooseCache ||
	(global._mongooseCache = { conn: null, promise: null });

const connectDB = async () => {
	if (!MONGO_URI) {
		console.error(
			"MONGODB_URI / MONGO_URI is not set in environment variables."
		);
		throw new Error("Missing MongoDB connection string");
	}

	if (cached.conn) {
		// Reuse existing connection
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			// Recommended options for modern mongoose (some are defaults in v7+ but explicit helps)
			// useNewUrlParser/useUnifiedTopology are no-ops in Mongoose 7+, kept for clarity
			// Connect timeout: try to fail faster if there's a network/DNS/auth issue
			serverSelectionTimeoutMS: 5000, // 5s
			connectTimeoutMS: 10000, // 10s
			// autoIndex: false, // disable in production if indexes are managed separately
		};

		console.log("Connecting to MongoDB...");
		cached.promise = mongoose
			.connect(MONGO_URI, opts)
			.then((mongooseInstance) => {
				console.log(`MongoDB connected: ${mongoose.connection.host}`);
				console.log(`MongoDB database: ${mongoose.connection.name}`);
				cached.conn = mongooseInstance.connection;
				return cached.conn;
			})
			.catch((err) => {
				console.error("MongoDB connection error:", err);
				// reset promise to allow retry on next invocation
				cached.promise = null;
				throw err;
			});
	}

	return cached.promise;
};

module.exports = connectDB;
