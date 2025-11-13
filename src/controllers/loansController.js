const Loan = require("../models/Loan");
const Book = require("../models/Book");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");

// get loans for current user
exports.myLoans = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const loans = await Loan.find({ user: userId }).populate("book");
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// admin: list all loans
exports.listAllLoans = asyncHandler(async (req, res) => {
  try {
    const loans = await Loan.find().populate("user").populate("book");
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

exports.getLoanById = asyncHandler(async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("book user");
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // if not admin, ensure owner
    if (req.user.role !== "admin" && loan.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// return loan (simple refund mock & stock adjust)
exports.returnLoan = asyncHandler(async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findById(loanId).populate("book");
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // permission: owner or admin
    if (req.user.role !== "admin" && loan.user._id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (loan.status === "returned") {
      return res.status(400).json({ message: "Already returned" });
    }

    loan.returnedAt = new Date();
    loan.status = "returned";

    // if returned on-time and payment was paid, mark refunded (mock)
    if (loan.dueDate && loan.returnedAt > loan.dueDate) {
      loan.refundStatus = "forfeited";
    } else {
      if (loan.paymentStatus === "paid") {
        // mock refund success
        loan.refundStatus = "refunded";
      } else {
        loan.refundStatus = "no_payment_made";
      }
    }

    // increase book stock
    if (loan.book) {
      await Book.findByIdAndUpdate(loan.book._id, { $inc: { stock: 1 } });
    }

    await loan.save();
    res.json({ message: "Book returned", loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

exports.checkLoanByBookId = asyncHandler(async (req, res) => {
    try {
        const { bookId } = req.query;
        const userId = req.user.id;

        if (!bookId) return res.status(400).json({ message: "Book ID is required." });

        const loan = await Loan.findOne({
            book: bookId,
            user: userId,
            status: 'borrowed' 
        })
        .populate('book')
        .sort({ borrowedAt: -1 }); 

        if (!loan) {
            return res.status(404).json({ message: "No active loan found." }); 
        }

        let loanStatus = "borrowed"; 
        const isOverdue = new Date(loan.dueDate) < new Date();
        
        if (isOverdue) {
            loanStatus = "overdue";
        } else if (loan.paymentStatus === 'unpaid') {
            loanStatus = "pending"; 
        }

        res.json({
            status: loanStatus,
            paymentStatus: loan.paymentStatus,
            dueDate: loan.dueDate,
        });

    } catch (err) {
        console.error("Error checking loan by book ID:", err);
        res.status(500).json({ message: "Server error" });
    }
});
