const Loan = require("../models/Loan");
const midtransClient = require("midtrans-client");

const core = new midtransClient.CoreApi({
	isProduction: false,
	serverKey: process.env.MIDTRANS_SERVER_KEY,
	clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

exports.notification = async (req, res) => {
	try {
		console.log("Raw notification:", req.body);

		const notification = await core.transaction.notification(req.body);
		console.log("Midtrans notification received:", notification);

		const orderId = notification.order_id;
		const transactionStatus = notification.transaction_status;
		const fraudStatus = notification.fraud_status;

		console.log("Order ID:", orderId, "Status:", transactionStatus);

		const loan = await Loan.findOne({ midtransOrderId: orderId }).populate(
			"book"
		);
		if (!loan) {
			return res.status(404).json({ message: "Loan not found" });
		}

		// Handle status
		if (
			transactionStatus === "settlement" ||
			(transactionStatus === "capture" && fraudStatus === "accept")
		) {
			loan.paymentStatus = "paid";
			await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: -1 } });
		} else if (
			transactionStatus === "expire" ||
			transactionStatus === "cancel" ||
			transactionStatus === "deny"
		) {
			loan.paymentStatus = "failed";
		}

		await loan.save();
		console.log("Loan updated:", loan);

		// ⚠️ Selalu kasih response 200 OK ke Midtrans
		return res
			.status(200)
			.json({ message: "Notification processed", status: transactionStatus });
	} catch (err) {
		console.error("Midtrans notification error:", err);
		// tetap balikin 200 biar Midtrans ga retry terus
		return res
			.status(200)
			.json({ message: "Notification received but error", error: err.message });
	}
};
