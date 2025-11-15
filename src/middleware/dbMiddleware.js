const connectDB = require("../config/database");

const ensureDBConnection = async (req, res, next) => {
	try {
		await connectDB();
		next();
	} catch (error) {
		console.error("Database connection failed:", error);
		res.status(503).json({
			message: "Database connection unavailable. Please try again later.",
			error: error.message
		});
	}
};

module.exports = ensureDBConnection;
