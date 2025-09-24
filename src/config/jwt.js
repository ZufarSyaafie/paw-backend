const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const secret = process.env.JWT_SECRET || "jwt-secret-key";
const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

function signToken(payload) {
	return jwt.sign(payload, secret, { expiresIn });
}

function verifyToken(token) {
	return jwt.verify(token, secret);
}

module.exports = { signToken, verifyToken };
