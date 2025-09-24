const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/authController");

// local auth
router.post("/register", authController.register);
router.post("/login", authController.login);

// OTP verification
router.post("/verify-registration-otp", authController.verifyRegistrationOTP);
router.post("/verify-login-otp", authController.verifyLoginOTP);

// Resend OTP
router.post("/resend-registration-otp", authController.resendRegistrationOTP);
router.post("/resend-login-otp", authController.resendLoginOTP);

// google oauth
router.get(
	"/google",
	passport.authenticate("google", { scope: ["profile", "email"] })
);

// callback
router.get(
	"/google/callback",
	passport.authenticate("google", { session: false }),
	authController.googleCallbackSuccess
);

module.exports = router;
