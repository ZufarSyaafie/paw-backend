// // const Loan = require("../models/Loan");
// // const midtransClient = require("midtrans-client");

// // const core = new midtransClient.CoreApi({
// // 	isProduction: false,
// // 	serverKey: process.env.MIDTRANS_SERVER_KEY,
// // 	clientKey: process.env.MIDTRANS_CLIENT_KEY,
// // });

// // exports.notification = async (req, res) => {
// // 	try {
// // 		console.log("Raw notification:", req.body);

// // 		const notification = await core.transaction.notification(req.body);
// // 		console.log("Midtrans notification received:", notification);

// // 		const orderId = notification.order_id;
// // 		const transactionStatus = notification.transaction_status;
// // 		const fraudStatus = notification.fraud_status;

// // 		console.log("Order ID:", orderId, "Status:", transactionStatus);

// // 		const loan = await Loan.findOne({ midtransOrderId: orderId }).populate(
// // 			"book"
// // 		);
// // 		if (!loan) {
// // 			return res.status(404).json({ message: "Loan not found" });
// // 		}

// // 		// Handle status
// // 		if (
// // 			transactionStatus === "settlement" ||
// // 			(transactionStatus === "capture" && fraudStatus === "accept")
// // 		) {
// // 			loan.paymentStatus = "paid";
// // 			await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: -1 } });
// // 		} else if (
// // 			transactionStatus === "expire" ||
// // 			transactionStatus === "cancel" ||
// // 			transactionStatus === "deny"
// // 		) {
// // 			loan.paymentStatus = "failed";
// // 		}

// // 		await loan.save();
// // 		console.log("Loan updated:", loan);

// // 		// ⚠️ Selalu kasih response 200 OK ke Midtrans
// // 		return res
// // 			.status(200)
// // 			.json({ message: "Notification processed", status: transactionStatus });
// // 	} catch (err) {
// // 		console.error("Midtrans notification error:", err);
// // 		// tetap balikin 200 biar Midtrans ga retry terus
// // 		return res
// // 			.status(200)
// // 			.json({ message: "Notification received but error", error: err.message });
// // 	}
// // };
// // src/controllers/paymentController.js
// const Loan = require("../models/Loan");
// const Book = require("../models/Book");
// const midtrans = require("../services/midtrans");

// exports.charge = async (req, res) => {
//   try {
//     const { loanId, amount } = req.body;
//     if (!loanId) return res.status(400).json({ message: "loanId required" });

//     const loan = await Loan.findById(loanId).populate("book");
//     if (!loan) return res.status(404).json({ message: "Loan not found" });

//     const orderId = `ORDER-${loan._id}-${Date.now()}`;
//     const trx = await midtrans.createTransaction(orderId, amount || 25000, {
//       items: loan.book ? [{
//         id: loan.book._id.toString(),
//         price: amount || 25000,
//         quantity: 1,
//         name: loan.book.title || "book"
//       }] : [],
//       customer: { email: loan.userEmail || "mock@example.com" }
//     });

//     loan.midtransOrderId = orderId;
//     loan.paymentStatus = "pending";
//     await loan.save();

//     return res.json({ message: "transaction created", trx, order_id: orderId });
//   } catch (err) {
//     console.error("charge error:", err);
//     return res.status(500).json({ message: err.message });
//   }
// };

// exports.notification = async (req, res) => {
//   try {
//     const notif = midtrans.parseNotification(req.body);
//     console.log("notification parsed:", notif);

//     const loan = await Loan.findOne({ midtransOrderId: notif.order_id }).populate("book");
//     if (!loan) {
//       // if nothing found, return 200 so payment gateway won't keep retrying in real scenario.
//       return res.status(200).json({ message: "Loan not found (notification ignored)" });
//     }

//     if (["capture", "settlement"].includes(notif.transaction_status)) {
//       loan.paymentStatus = "paid";
//       if (loan.book) {
//         await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: -1 } });
//       }
//     } else if (["deny", "expire", "cancel"].includes(notif.transaction_status)) {
//       loan.paymentStatus = "failed";
//     }

//     await loan.save();
//     return res.status(200).json({ message: "Notification processed", status: notif.transaction_status });
//   } catch (err) {
//     console.error("notif error:", err);
//     return res.status(200).json({ message: "Notification received but error", error: err.message });
//   }
// };
// src/controllers/paymentController.js
const Loan = require("../models/Loan");

const { createTransaction, parseNotification } = require("../services/midtrans");

exports.create = async (req, res) => {
  try {
    const { loanId, grossAmount = 25000, payload = {} } = req.body;
    if (!loanId) return res.status(400).json({ message: "loanId required" });

    const orderId = `loan-${loanId}`;
    const tx = await createTransaction(orderId, grossAmount, payload);

    // respond with redirect/payment info
    return res.json({
      status: "ok",
      order_id: tx.order_id || orderId,
      payment_url: tx.redirect_url || (tx.raw && tx.raw.redirect_url) || null,
      raw: tx,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.notification = async (req, res) => {
  try {
    const body = req.body || {};
    const notification = parseNotification(body);
    console.log("Payment notification parsed:", notification);

    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status || body.fraud_status || "accept";

    const loan = await Loan.findOne({ midtransOrderId: orderId }).populate("book");
    if (!loan) {
      // still return 200 to avoid retries
      return res.status(200).json({ message: "Loan not found", orderId });
    }

    if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
      loan.paymentStatus = "paid";
      try {
        await require("../models/Book").findByIdAndUpdate(loan.book._id, { $inc: { stock: -1 } });
      } catch (e) {
        console.error("Failed to decrement book stock:", e.message);
      }
    } else if (["expire", "cancel", "deny"].includes(transactionStatus)) {
      loan.paymentStatus = "failed";
    }

    await loan.save();
    return res.status(200).json({ message: "Notification processed", status: loan.paymentStatus });
  } catch (err) {
    console.error("Notification error:", err);
    return res.status(200).json({ message: "Notification received but error", error: err.message });
  }
};
