const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { signToken } = require("../config/jwt");
require("dotenv").config();

module.exports = function initGoogleStrategy() {
	passport.use(
		new GoogleStrategy(
			{
				clientID: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
				callbackURL: process.env.GOOGLE_CALLBACK_URL,
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					const email =
						profile.emails && profile.emails[0] && profile.emails[0].value;
					if (!email) return done(new Error("No email from Google"));

					const role = email.endsWith("@mail.ugm.ac.id") ? "admin" : "user";

					let user = await User.findOne({ email });
					if (!user) {
						user = await User.create({
							name: profile.displayName,
							email,
							role,
							isVerified: true, // Google users are automatically verified
						});
					} else {
						// if existing user but role should be admin (in case changed), update
						if (role === "admin" && user.role !== "admin") {
							user.role = "admin";
							await user.save();
						}
						// Ensure Google users are marked as verified
						if (!user.isVerified) {
							user.isVerified = true;
							await user.save();
						}
					}

					// create a JWT to send back
					const token = signToken({
						id: user._id,
						email: user.email,
						role: user.role,
					});
					// attach token to profile for callback handler
					return done(null, { user, token });
				} catch (err) {
					done(err);
				}
			}
		)
	);

	// Serialize user for session
	passport.serializeUser((user, done) => {
		done(null, user);
	});

	// Deserialize user from session
	passport.deserializeUser((user, done) => {
		done(null, user);
	});
};
