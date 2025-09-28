const app = require("./app");
const connectDB = require("./src/config/database");
require("dotenv").config();
console.log("DEBUG ENV MONGODB_URI:", process.env.MONGODB_URI);

const PORT = process.env.PORT || 4000;

(async () => {
	await connectDB();
	app.listen(PORT, () => {
		console.log(`Server running on port ${PORT}`);
	});
})();
