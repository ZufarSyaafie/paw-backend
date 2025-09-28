// // const nodemailer = require("nodemailer");
// // const User = require("../models/User");

// // // Create transporter for sending emails
// // const createTransporter = () => {
// // 	return nodemailer.createTransport({
// // 		service: "gmail", // or your preferred email service
// // 		auth: {
// // 			user: process.env.EMAIL_USER,
// // 			pass: process.env.EMAIL_PASS, // Use App Password for Gmail
// // 		},
// // 	});
// // };

// // // Send announcement email to all registered users
// // const sendAnnouncementToAllUsers = async (announcement) => {
// // 	try {
// // 		// Get all verified users
// // 		const users = await User.find({
// // 			isVerified: true,
// // 			email: { $exists: true, $ne: null },
// // 		}).select("email name");

// // 		if (users.length === 0) {
// // 			console.log("No verified users found to send announcement");
// // 			return { success: true, sent: 0 };
// // 		}

// // 		const transporter = createTransporter();
// // 		let successCount = 0;
// // 		let failureCount = 0;

// // 		// Send email to each user
// // 		for (const user of users) {
// // 			try {
// // 				const mailOptions = {
// // 					from: process.env.EMAIL_USER,
// // 					to: user.email,
// // 					subject: `📚 Pengumuman Baru: ${announcement.bookTitle}`,
// // 					html: `
// // 						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
// // 							<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
// // 								<h1 style="color: white; margin: 0; font-size: 28px;">📚 Perpustakaan Naratama</h1>
// // 								<p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistem Perpustakaan</p>
// // 							</div>
							
// // 							<div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
// // 								<h2 style="color: #333; margin-top: 0; font-size: 24px;">🎉 Pengumuman Baru!</h2>
								
// // 								<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
// // 									<h3 style="color: #495057; margin-top: 0; font-size: 20px;">${announcement.bookTitle}</h3>
// // 									<p style="color: #6c757d; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
// // 										${announcement.message}
// // 									</p>
// // 								</div>
								
// // 								<div style="text-align: center; margin: 30px 0;">
// // 									<p style="color: #666; font-size: 14px; margin: 0;">
// // 										Kunjungi perpustakaan atau akses sistem online untuk informasi lebih lanjut.
// // 									</p>
// // 								</div>
								
// // 								<hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
								
// // 								<p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
// // 									Email ini dikirim secara otomatis dari sistem Perpustakaan Naratama.<br>
// // 									Jika Anda tidak ingin menerima email ini lagi, silakan hubungi administrator.
// // 								</p>
// // 							</div>
// // 						</div>
// // 					`,
// // 				};

// // 				await transporter.sendMail(mailOptions);
// // 				successCount++;
// // 				console.log(`Announcement sent to ${user.email}`);
// // 			} catch (error) {
// // 				failureCount++;
// // 				console.error(
// // 					`Failed to send announcement to ${user.email}:`,
// // 					error.message
// // 				);
// // 			}
// // 		}

// // 		console.log(
// // 			`Announcement sending completed. Success: ${successCount}, Failed: ${failureCount}`
// // 		);
// // 		return {
// // 			success: true,
// // 			sent: successCount,
// // 			failed: failureCount,
// // 			total: users.length,
// // 		};
// // 	} catch (error) {
// // 		console.error("Error sending announcement to all users:", error);
// // 		throw new Error("Failed to send announcement emails");
// // 	}
// // };

// // // Send custom announcement email to all registered users
// // const sendCustomAnnouncementToAllUsers = async (title, message) => {
// // 	try {
// // 		// Get all verified users
// // 		const users = await User.find({
// // 			isVerified: true,
// // 			email: { $exists: true, $ne: null },
// // 		}).select("email name");

// // 		if (users.length === 0) {
// // 			console.log("No verified users found to send announcement");
// // 			return { success: true, sent: 0 };
// // 		}

// // 		const transporter = createTransporter();
// // 		let successCount = 0;
// // 		let failureCount = 0;

// // 		// Send email to each user
// // 		for (const user of users) {
// // 			try {
// // 				const mailOptions = {
// // 					from: process.env.EMAIL_USER,
// // 					to: user.email,
// // 					subject: `📢 Pengumuman: ${title}`,
// // 					html: `
// // 						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
// // 							<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
// // 								<h1 style="color: white; margin: 0; font-size: 28px;">📢 Perpustakaan Naratama</h1>
// // 								<p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistem Perpustakaan</p>
// // 							</div>
							
// // 							<div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
// // 								<h2 style="color: #333; margin-top: 0; font-size: 24px;">📢 Pengumuman</h2>
								
// // 								<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
// // 									<h3 style="color: #856404; margin-top: 0; font-size: 20px;">${title}</h3>
// // 									<div style="color: #856404; font-size: 16px; line-height: 1.6;">
// // 										${message.replace(/\n/g, "<br>")}
// // 									</div>
// // 								</div>
								
// // 								<div style="text-align: center; margin: 30px 0;">
// // 									<p style="color: #666; font-size: 14px; margin: 0;">
// // 										Terima kasih atas perhatiannya.
// // 									</p>
// // 								</div>
								
// // 								<hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
								
// // 								<p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
// // 									Email ini dikirim secara otomatis dari sistem Perpustakaan Naratama.<br>
// // 									Jika Anda tidak ingin menerima email ini lagi, silakan hubungi administrator.
// // 								</p>
// // 							</div>
// // 						</div>
// // 					`,
// // 				};

// // 				await transporter.sendMail(mailOptions);
// // 				successCount++;
// // 				console.log(`Custom announcement sent to ${user.email}`);
// // 			} catch (error) {
// // 				failureCount++;
// // 				console.error(
// // 					`Failed to send custom announcement to ${user.email}:`,
// // 					error.message
// // 				);
// // 			}
// // 		}

// // 		console.log(
// // 			`Custom announcement sending completed. Success: ${successCount}, Failed: ${failureCount}`
// // 		);
// // 		return {
// // 			success: true,
// // 			sent: successCount,
// // 			failed: failureCount,
// // 			total: users.length,
// // 		};
// // 	} catch (error) {
// // 		console.error("Error sending custom announcement to all users:", error);
// // 		throw new Error("Failed to send custom announcement emails");
// // 	}
// // };

// // module.exports = {
// // 	sendAnnouncementToAllUsers,
// // 	sendCustomAnnouncementToAllUsers,
// // };

// // src/services/emailService.js  (MOCK)
// const User = require("../models/User");

// /**
//  * Mock send announcement: just count verified users and return success object.
//  * No external SMTP required. Use this in dev/testing only.
//  */

// const sendAnnouncementToAllUsers = async (announcement) => {
//   try {
//     const users = await User.find({
//       isVerified: true,
//       email: { $exists: true, $ne: null },
//     }).select("email name");

//     const sent = users.length;
//     console.log(`[MOCK EMAIL] Announcement "${announcement.bookTitle}" -> will pretend to send to ${sent} users`);

//     // emulate some delay (optional)
//     // await new Promise(r => setTimeout(r, 200));

//     return {
//       success: true,
//       sent,
//       failed: 0,
//       total: users.length,
//       mock: true,
//     };
//   } catch (err) {
//     console.error("[MOCK EMAIL] error:", err);
//     return { success: false, sent: 0, failed: users ? users.length : 0, total: users ? users.length : 0, error: err.message };
//   }
// };

// const sendCustomAnnouncementToAllUsers = async (title, message) => {
//   return sendAnnouncementToAllUsers({ bookTitle: title, message });
// };

// module.exports = {
//   sendAnnouncementToAllUsers,
//   sendCustomAnnouncementToAllUsers,
// };
// src/services/emailService.js
const nodemailer = require("nodemailer");
const User = require("../models/User");
const USE_MOCK_EMAIL = process.env.USE_MOCK_EMAIL === "true";

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendCustomAnnouncementToAllUsers = async (title, message) => {
  try {
    const users = await User.find({ isVerified: true, email: { $exists: true, $ne: null } }).select("email name");
    const total = users.length;
    if (total === 0) return { success: true, sent: 0, failed: 0, total: 0 };

    if (USE_MOCK_EMAIL) {
      console.log("USE_MOCK_EMAIL=true -> skipping real send, returning mocked success");
      return { success: true, sent: total, failed: 0, total };
    }

    const transporter = createTransporter();
    let successCount = 0;
    let failureCount = 0;
    for (const user of users) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: `📢 ${title}`,
          html: `<div><h3>${title}</h3><p>${message.replace(/\n/g, "<br>")}</p></div>`,
        };
        await transporter.sendMail(mailOptions);
        successCount++;
      } catch (error) {
        console.error(`Failed to send to ${user.email}:`, error.message);
        failureCount++;
      }
    }
    return { success: true, sent: successCount, failed: failureCount, total };
  } catch (err) {
    console.error("sendCustomAnnouncementToAllUsers error:", err.message);
    throw err;
  }
};

module.exports = { sendCustomAnnouncementToAllUsers };
