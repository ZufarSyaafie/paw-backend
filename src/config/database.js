const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Serverless-friendly connection caching.
// When deployed to Vercel (or other serverless platforms), functions may cold-start
// frequently. Re-using an existing Mongoose connection across invocations avoids
// creating too many connections and prevents buffering/timeouts.

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
      // Increase a bit for serverless environments (cold starts / DNS lookups)
      serverSelectionTimeoutMS: 15000, // 15s
      connectTimeoutMS: 15000, // 15s
      // Socket timeout for operations
      socketTimeoutMS: 45000, // 45s
      // How long to wait while buffering operations (increase to avoid 'buffering timed out')
      bufferTimeoutMS: 60000, // 60s
      // Keep buffering commands until connected (true) or fail fast (false)
      bufferCommands: true,
      // Limit connection pool size to a small number for serverless environments
      maxPoolSize: 10,
      // Retry writes where supported
      retryWrites: true,
      // Force IPv4 resolution in environments where IPv6 DNS causes issues
      family: 4,
      // autoIndex: false, // disable in production if indexes are managed separately
    };

    // Log the host(s) portion of the connection string (masked) to help debug DNS/whitelist issues
    const maskHost = (uri) => {
      try {
        const afterAt = uri.includes("@") ? uri.split("@").pop() : uri;
        return afterAt.split("/")[0];
      } catch (e) {
        return "unknown";
      }
    };
    console.log(`Connecting to MongoDB host(s): ${maskHost(MONGO_URI)}`);
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
