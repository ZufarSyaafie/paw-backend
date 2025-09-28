const Book = require("../models/Book");
const Loan = require("../models/Loan");
const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");
const snap = require("../services/midtrans");
const { sendAnnouncementToAllUsers } = require("../services/emailService");

exports.listBooks = async (req, res) => {
	// support query params for search/sort
    try {
        const { sortBy, order = "asc", page = 1, limit = 20, ...queries } = req.query;

        const filter = {};
        for (const key in queries) {
            if (["createdAt", "__v", "_id"].includes(key)) continue; // skip field yg ga dipake filter
            if (["year", "stock"].includes(key)) {
                // numeric fields
                filter[key] = parseInt(queries[key]);
            } else {
                // text fields pake regex biar fleksibel
                filter[key] = new RegExp(queries[key], "i");
            }
        }

        const sort = {};
        if (sortBy) sort[sortBy] = order === "asc" ? 1 : -1;

        const books = await Book.find(filter)
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({ data: books });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "server error" });
    }
};

exports.getBook = async (req, res) => {
	const book = await Book.findById(req.params.id);
	if (!book) return res.status(404).json({ message: "Book not found" });
	res.json(book);
};

exports.createBook = async (req, res) => {
	try {
		// admin only route (enforced by middleware)
		const payload = req.body;
		const book = await Book.create(payload);

		// create an announcement automatically about new book
		const announcement = await Announcement.create({
			bookTitle: book.title,
			message: `Buku baru: "${book.title}" oleh ${
				book.author || "Unknown author"
			} sekarang tersedia.`,
		});

		// Send announcement email to all registered users
		try {
			const emailResult = await sendAnnouncementToAllUsers(announcement);
			console.log(`Email announcement sent to ${emailResult.sent} users`);
		} catch (emailError) {
			console.error("Failed to send announcement emails:", emailError.message);
			// Don't fail the book creation if email sending fails
		}

		res.status(201).json(book);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};

exports.updateBook = async (req, res) => {
	const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});
	if (!book) return res.status(404).json({ message: "Book not found" });
	res.json(book);
};

exports.deleteBook = async (req, res) => {
	await Book.findByIdAndDelete(req.params.id);
	res.json({ message: "Deleted" });
};

// Borrow with Midtrans
exports.borrowBook = async (req, res) => {
	try {
		const userId = req.user.id;
		const bookId = req.params.id;
		// due date 7 days from now
		const dueDate = new Date();
		dueDate.setDate(dueDate.getDate() + 7);

		const book = await Book.findById(bookId);
		if (!book || book.stock <= 0) {
			return res.status(400).json({ message: "Book not available" });
		}

		// buat loan entry unpaid
		const loan = await Loan.create({
			user: new mongoose.Types.ObjectId(userId),
			book: new mongoose.Types.ObjectId(bookId),
			depositAmount: 25000,
			paymentStatus: "unpaid",
			refundStatus: "pending",
		});

		// buat orderId valid
		const orderId = `loan-${loan._id}`;
		loan.midtransOrderId = orderId;
		await loan.save();

		// transaksi ke midtrans
		const parameter = {
			transaction_details: {
				order_id: orderId,
				gross_amount: 25000,
			},
			customer_details: {
				email: req.user.email,
			},
		};

		const transaction = await snap.createTransaction(parameter);
		res.json({
			loan,
			payment_url: transaction.redirect_url,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};

// Return book + refund
exports.returnBook = async (req, res) => {
	try {
		const loanId = req.params.id;
		const loan = await Loan.findById(loanId).populate("book");
		if (!loan) return res.status(404).json({ message: "Loan not found" });

		loan.returnedAt = new Date();
		loan.status = "returned";

		if (loan.dueDate && loan.returnedAt > loan.dueDate) {
			loan.refundStatus = "forfeited";
		} else {
			if (loan.paymentStatus === "paid") {
				try {
					const refundResponse = await core.refundTransaction(
						{ order_id: loan.midtransOrderId },
						{
							refund_key: `refund-${loan._id}-${Date.now()}`,
							amount: loan.depositAmount,
							reason: "On-time return",
						}
					);
					console.log("Refund response:", refundResponse);
					loan.refundStatus = "refunded";
				} catch (refundErr) {
					console.error("Refund failed:", refundErr);
					loan.refundStatus = "pending";
				}
			} else {
				loan.refundStatus = "no_payment_made";
			}
		}

		await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: 1 } });
		await loan.save();

		res.json({ message: "Book returned", loan });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Server error" });
	}
};

const midtransClient = require("midtrans-client");
const core = new midtransClient.CoreApi({
	isProduction: false,
	serverKey: process.env.MIDTRANS_SERVER_KEY,
	clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
