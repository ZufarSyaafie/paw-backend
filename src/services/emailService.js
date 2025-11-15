const { Resend } = require("resend");
const { Resend } = require("resend");
const User = require("../models/User");

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM =
	process.env.EMAIL_FROM ||
	process.env.EMAIL_USER ||
	"Perpustakaan Naratama <onboarding@resend.dev>";

// Send announcement email to all registered users
const sendAnnouncementToAllUsers = async (announcement) => {
	try {
		// Get all verified users
		const users = await User.find({
			isVerified: true,
			email: { $exists: true, $ne: null },
		}).select("email name");

		if (users.length === 0) {
			console.log("No verified users found to send announcement");
			return { success: true, sent: 0 };
		}

		let successCount = 0;
		let failureCount = 0;

		// Send email to each user
		for (const user of users) {
			try {
				const { error } = await resend.emails.send({
					from: EMAIL_FROM,
					to: [user.email],
					subject: `📚 Pengumuman Baru: ${announcement.bookTitle}`,
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
							<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
								<h1 style="color: white; margin: 0; font-size: 28px;">📚 Perpustakaan Naratama</h1>
								<p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistem Perpustakaan</p>
							</div>
                            
							<div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
								<h2 style="color: #333; margin-top: 0; font-size: 24px;">🎉 Pengumuman Baru!</h2>
                                
								<div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
									<h3 style="color: #495057; margin-top: 0; font-size: 20px;">${announcement.bookTitle}</h3>
									<p style="color: #6c757d; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
										${announcement.message}
									</p>
								</div>
                                
								<div style="text-align: center; margin: 30px 0;">
									<p style="color: #666; font-size: 14px; margin: 0;">
										Kunjungi perpustakaan atau akses sistem online untuk informasi lebih lanjut.
									</p>
								</div>
                                
								<hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                                
								<p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
									Email ini dikirim secara otomatis dari sistem Perpustakaan Naratama.<br>
									Jika Anda tidak ingin menerima email ini lagi, silakan hubungi administrator.
								</p>
							</div>
						</div>
					`,
				});
				if (error) throw new Error(error.message || "Resend send failed");
				successCount++;
				console.log(`Announcement sent to ${user.email}`);
			} catch (error) {
				failureCount++;
				console.error(
					`Failed to send announcement to ${user.email}:`,
					error?.message || error
				);
			}
		}

		console.log(
			`Announcement sending completed. Success: ${successCount}, Failed: ${failureCount}`
		);
		return {
			success: true,
			sent: successCount,
			failed: failureCount,
			total: users.length,
		};
	} catch (error) {
		console.error("Error sending announcement to all users:", error);
		throw new Error("Failed to send announcement emails");
	}
};

// Send custom announcement email to all registered users
const sendCustomAnnouncementToAllUsers = async (title, message) => {
	try {
		// Get all verified users
		const users = await User.find({
			isVerified: true,
			email: { $exists: true, $ne: null },
		}).select("email name");

		if (users.length === 0) {
			console.log("No verified users found to send announcement");
			return { success: true, sent: 0 };
		}

		let successCount = 0;
		let failureCount = 0;

		// Send email to each user
		for (const user of users) {
			try {
				const { error } = await resend.emails.send({
					from: EMAIL_FROM,
					to: [user.email],
					subject: `📢 Pengumuman: ${title}`,
					html: `
						<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
							<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
								<h1 style="color: white; margin: 0; font-size: 28px;">📢 Perpustakaan Naratama</h1>
								<p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Sistem Perpustakaan</p>
							</div>
                            
							<div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
								<h2 style="color: #333; margin-top: 0; font-size: 24px;">📢 Pengumuman</h2>
                                
								<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin: 20px 0;">
									<h3 style="color: #856404; margin-top: 0; font-size: 20px;">${title}</h3>
									<div style="color: #856404; font-size: 16px; line-height: 1.6;">
										${message.replace(/\n/g, "<br>")}
									</div>
								</div>
                                
								<div style="text-align: center; margin: 30px 0;">
									<p style="color: #666; font-size: 14px; margin: 0;">
										Terima kasih atas perhatiannya.
									</p>
								</div>
                                
								<hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;">
                                
								<p style="color: #6c757d; font-size: 12px; text-align: center; margin: 0;">
									Email ini dikirim secara otomatis dari sistem Perpustakaan Naratama.<br>
									Jika Anda tidak ingin menerima email ini lagi, silakan hubungi administrator.
								</p>
							</div>
						</div>
					`,
				});
				if (error) throw new Error(error.message || "Resend send failed");
				successCount++;
				console.log(`Custom announcement sent to ${user.email}`);
			} catch (error) {
				failureCount++;
				console.error(
					`Failed to send custom announcement to ${user.email}:`,
					error?.message || error
				);
			}
		}

		console.log(
			`Custom announcement sending completed. Success: ${successCount}, Failed: ${failureCount}`
		);
		return {
			success: true,
			sent: successCount,
			failed: failureCount,
			total: users.length,
		};
	} catch (error) {
		console.error("Error sending custom announcement to all users:", error);
		throw new Error("Failed to send custom announcement emails");
	}
};

module.exports = {
	sendAnnouncementToAllUsers,
	sendCustomAnnouncementToAllUsers,
};
