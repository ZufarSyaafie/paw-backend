const app = require("./app");
const connectDB = require("./src/config/database");
require("dotenv").config();

const PORT = process.env.PORT || 4000;

(async () => {
	try {
		await connectDB();
		console.log("Database connection established");

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Failed to start server:", error.message);
		process.exit(1);
	}
})();
