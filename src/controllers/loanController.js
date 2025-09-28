// const Loan = require("../models/Loan");
// const Book = require("../models/Book");

// // GET /loans/my
// exports.getMyLoans = async (req, res) => {
//   const userId = req.user.id;
//   const loans = await Loan.find({ user: userId }).populate("book").sort({ createdAt: -1 });
//   res.json(loans);
// };

// // POST /loans/:id/return  (or PUT /books/loans/:id/return)
// exports.returnLoan = async (req, res) => {
//   const loanId = req.params.id;
//   const loan = await Loan.findById(loanId).populate("book");
//   if (!loan) return res.status(404).json({ message: "Loan not found" });

//   loan.returnedAt = new Date();
//   loan.status = "returned";

//   // check dueDate logic if exists
//   if (loan.dueDate && loan.returnedAt > loan.dueDate) {
//     loan.refundStatus = "forfeited";
//   } else {
//     // if paid, simulate refund (since no midtrans)
//     if (loan.paymentStatus === "paid") loan.refundStatus = "refunded";
//     else loan.refundStatus = "no_payment_made";
//   }

//   if (loan.book) await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: 1 } });
//   await loan.save();
//   res.json({ message: "Book returned", loan });
// };
// src/controllers/loanController.js
const Loan = require("../models/Loan");
const Book = require("../models/Book");

exports.getMyLoans = async (req, res) => {
  try {
    const userId = req.user.id;
    const loans = await Loan.find({ user: userId }).populate("book").sort({ borrowedAt: -1 });
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate("book user").sort({ borrowedAt: -1 });
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.returnLoan = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findById(loanId).populate("book");
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // Only borrower or admin
    if (String(loan.user) !== String(req.user.id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    loan.returnedAt = new Date();
    loan.status = "returned";

    // if overdue -> forfeited
    if (loan.dueDate && loan.returnedAt > loan.dueDate) {
      loan.refundStatus = "forfeited";
    } else {
      if (loan.paymentStatus === "paid") {
        // Simulate refund success for demo
        loan.refundStatus = "refunded";
      } else {
        loan.refundStatus = "no_payment_made";
      }
    }

    // increment stock if previously decremented (only if paid)
    if (loan.paymentStatus === "paid" && loan.book) {
      try {
        await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: 1 } });
      } catch (e) {
        console.error("Failed to increment stock:", e.message);
      }
    }

    await loan.save();
    res.json({ message: "Book returned", loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
