const Book = require("../models/Book");
const Loan = require("../models/Loan");
const Announcement = require("../models/Announcement");
const mongoose = require("mongoose");
const { snap, core } = require("../services/midtrans");
const { sendAnnouncementToAllUsers } = require("../services/emailService");
const asyncHandler = require("express-async-handler");

const getTopCategories = asyncHandler(async (req, res) => {
	const limit = parseInt(req.query.limit, 10) || 10;
	const agg = await Book.aggregate([
		{ $match: { category: { $exists: true, $ne: null } } },
		{ $group: { _id: "$category", count: { $sum: 1 } } },
		{ $sort: { count: -1 } },
		{ $limit: limit },
		{ $project: { category: "$_id", count: 1, _id: 0 } },
	]);
	res.json(agg.map(x => x.category));
});

exports.listBooks = asyncHandler(async (req, res) => {
	const { sortBy, order = "asc", page = 1, limit = 20, search, ...queries } = req.query;
	
	const filter = {};
	if (search) {
		const regex = new RegExp(search, "i");
		filter.$or = [
			{ title: regex },
			{ author: regex },
			{ isbn: regex },
			{ description: regex },
		];
	}
	for (const key in queries) {
		if (["createdAt", "__v", "_id"].includes(key)) continue;
		if (["year", "stock"].includes(key)) {
			filter[key] = parseInt(queries[key]);
		} else {
			if (key === 'status') {
			  filter[key] = queries[key];
			} else {
			  filter[key] = new RegExp(queries[key], "i");
			}
		}
	}

	const sort = {};
	if (sortBy) sort[sortBy] = order === "asc" ? 1 : -1;

	const [books, totalCount] = await Promise.all([
		Book.find(filter)
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(parseInt(limit))
			.lean(),
		Book.countDocuments(filter) 
	]);

	res.json({ data: books, total: totalCount });
});

exports.getBook = asyncHandler(async (req, res) => {
	if (!req.params.id || req.params.id === 'undefined') {
		return res.status(400).json({ message: "Book ID is required" });
	}
	const book = await Book.findById(req.params.id);
	if (!book) return res.status(404).json({ message: "Book not found" });
	res.json(book);
});

exports.createBook = asyncHandler(async (req, res) => {
	const payload = req.body;
	const book = await Book.create(payload);

	const announcement = await Announcement.create({
		bookTitle: book.title,
		message: `Buku baru: "${book.title}" oleh ${book.author || "Unknown author"} sekarang tersedia.`,
	});

	try {
		const emailResult = await sendAnnouncementToAllUsers(announcement);
		console.log(`Email announcement sent to ${emailResult.sent} users`);
	} catch (emailError) {
		console.error("EMAIL GAGAL (ETIMEDOUT): Failed to send announcement emails:", emailError.message);
	}

	res.status(201).json(book);
});

exports.updateBook = asyncHandler(async (req, res) => {
	const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
		new: true,
	});
	if (!book) return res.status(404).json({ message: "Book not found" });
	res.json(book);
});

exports.deleteBook = asyncHandler(async (req, res) => {
	await Book.findByIdAndDelete(req.params.id);
	res.json({ message: "Deleted" });
});

exports.borrowBook = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const bookId = req.params.id;
	const dueDate = new Date();
	dueDate.setDate(dueDate.getDate() + 7);

	const book = await Book.findById(bookId);
	if (!book) {
		return res.status(404).json({ message: "Book not found" });
	}
	if (book.status === 'unavailable') {
		return res.status(400).json({ message: "Book is currently unavailable" });
	}
	if (book.stock <= 0) {
		return res.status(400).json({ message: "Book out of stock" });
	}

	const loan = await Loan.create({
		user: new mongoose.Types.ObjectId(userId),
		book: new mongoose.Types.ObjectId(bookId),
		dueDate: dueDate, // <-- INI FIX-NYA
		depositAmount: 25000,
		paymentStatus: "unpaid",
		refundStatus: "pending",
	});

	const orderId = `loan-${loan._id}`;
	loan.midtransOrderId = orderId;
	await loan.save();

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
});

exports.returnBook = asyncHandler(async (req, res) => {
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
});

exports.getCategories = asyncHandler(async (req, res) => {
	const categories = await Book.distinct("category");
	const filteredCategories = categories.filter(cat => cat);
	res.json(filteredCategories);
});

exports.getTopCategories = getTopCategories;