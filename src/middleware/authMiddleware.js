const jwt = require("jsonwebtoken");
require("dotenv").config();

const secret = process.env.JWT_SECRET || "jwt-secret-key";

function authenticate(allowedRoles = []) {
	// allowedRoles: [] => any authenticated user, ['admin'] => only admin
	return (req, res, next) => {
		const header = req.headers.authorization || "";
		const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
		if (!token) return res.status(401).json({ message: "Unauthorized" });

		try {
			const decoded = jwt.verify(token, secret);
			req.user = decoded;
			if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
				return res.status(403).json({ message: "Forbidden" });
			}
			next();
		} catch (err) {
			return res.status(401).json({ message: "Invalid token" });
		}
	};
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
	const header = req.headers.authorization || "";
	const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;

	if (!token) {
		return res
			.status(401)
			.json({ message: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(token, secret);
		req.user = decoded;
		next();
	} catch (err) {
		return res.status(401).json({ message: "Invalid token" });
	}
};

// Middleware to require admin role
const requireAdmin = (req, res, next) => {
	if (!req.user || req.user.role !== "admin") {
		return res
			.status(403)
			.json({ message: "Access denied. Admin role required." });
	}
	next();
};

module.exports = {
	authenticate,
	verifyToken,
	requireAdmin,
};
