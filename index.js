require("dotenv").config();
const connectDB = require("./src/config/database");
const app = require("./app");

const PORT = process.env.PORT || 4000;

(async () => {
	await connectDB();
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
})();
