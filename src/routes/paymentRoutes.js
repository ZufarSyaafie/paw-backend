// // // const express = require("express");
// // // const router = express.Router();
// // // const paymentController = require("../controllers/paymentController");

// // // router.post("/notification", paymentController.notification);

// // // module.exports = router;
// // const express = require("express");
// // const router = express.Router();
// // const paymentController = require("../controllers/paymentController");

// // // test charge manual
// // router.post("/charge", paymentController.charge);

// // // callback from midtrans / simulate
// // router.post("/notification", paymentController.notification);

// // module.exports = router;

// const express = require("express");
// const router = express.Router();
// const { createTransaction } = require("../services/paymentSimulator");
// const Loan = require("../models/Loan");
// const Book = require("../models/Book");
// const mongoose = require("mongoose");

// // create payment (simulate)
// router.post("/create", async (req, res) => {
//   try {
//     const { loanId, grossAmount, payload } = req.body || {};
//     if (!loanId) return res.status(400).json({ message: "loanId required" });

//     const loan = await Loan.findById(loanId).populate("book");
//     if (!loan) return res.status(404).json({ message: "Loan not found" });

//     const orderId = loan.midtransOrderId || `loan-${loan._id}`;
//     const trx = await createTransaction(orderId, grossAmount || loan.depositAmount || 25000, payload);

//     // save order id if not present
//     loan.midtransOrderId = orderId;
//     loan.paymentStatus = "pending";
//     await loan.save();

//     return res.json({ status: "success", trx, order_id: orderId, payment_url: trx.redirect_url });
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: err.message });
//   }
// });

// // notification endpoint (simulate midtrans callback)
// router.post("/notification", async (req, res) => {
//   try {
//     // client/postman will POST { order_id, transaction_status, fraud_status? }
//     const body = req.body || {};
//     const orderId = body.order_id;
//     const transactionStatus = body.transaction_status || "capture";
//     const fraudStatus = body.fraud_status || "accept";

//     if (!orderId) return res.status(400).json({ message: "order_id required" });

//     const loan = await Loan.findOne({ midtransOrderId: orderId }).populate("book");
//     if (!loan) {
//       // return 200 so caller doesn't retry
//       return res.status(200).json({ message: "Loan not found (ignored)" });
//     }

//     if (transactionStatus === "settlement" || (transactionStatus === "capture" && fraudStatus === "accept")) {
//       loan.paymentStatus = "paid";
//       if (loan.book) await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: -1 } });
//     } else if (["deny","expire","cancel"].includes(transactionStatus)) {
//       loan.paymentStatus = "failed";
//     } else {
//       loan.paymentStatus = transactionStatus;
//     }

//     await loan.save();
//     return res.status(200).json({ message: "Notification processed", status: loan.paymentStatus });
//   } catch (err) {
//     console.error("notif error:", err);
//     return res.status(200).json({ message: "notification received but error", error: err.message });
//   }
// });

// module.exports = router;
// src/routes/paymentRoutes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/create", paymentController.create); // create transaction (sim)
router.post("/notification", paymentController.notification); // webhook
router.get("/status/:orderId", paymentController.status || ((req,res)=>res.json({message:'not implemented'})));

module.exports = router;
