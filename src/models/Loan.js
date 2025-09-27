const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
	borrowedAt: { type: Date, default: Date.now },
	dueDate: Date,
	returnedAt: Date,
	status: {
		type: String,
		enum: ["borrowed", "returned", "late"],
		default: "borrowed",
	},
	midtransOrderId: { type: String },
	paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
	depositAmount: { type: Number, default: 25000 },
	refundStatus: {
		type: String,
		enum: ["pending", "refunded", "forfeited"],
		default: "pending",
	},
});

module.exports = mongoose.model("Loan", loanSchema);
