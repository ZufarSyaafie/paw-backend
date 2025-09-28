const Loan = require("../models/Loan");
const Book = require("../models/Book");
const mongoose = require("mongoose");

// get loans for current user
exports.myLoans = async (req, res) => {
  try {
    const userId = req.user.id;
    const loans = await Loan.find({ user: userId }).populate("book");
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// admin: list all loans
exports.listAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find().populate("user").populate("book");
    res.json(loans);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate("book user");
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // if not admin, ensure owner
    if (req.user.role !== "admin" && loan.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(loan);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// return loan (simple refund mock & stock adjust)
exports.returnLoan = async (req, res) => {
  try {
    const loanId = req.params.id;
    const loan = await Loan.findById(loanId).populate("book");
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    // permission: owner or admin
    if (req.user.role !== "admin" && loan.user.toString() !== req.user.id) {
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
};
