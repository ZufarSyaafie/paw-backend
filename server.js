const app = require("./app");
const connectDB = require("./src/config/database");
require("dotenv").config();

const PORT = process.env.PORT || 4000;

(async () => {
	await connectDB();
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
})();
