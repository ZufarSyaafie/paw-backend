const Loan = require("../models/Loan");
const Book = require("../models/Book");
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const { core } = require("../services/midtrans");

const updateFinesForUser = async (userId) => {
  const DENDA_PER_HARI = 5000;
  
  const activeLoans = await Loan.find({ 
    user: userId, 
    status: { $in: ['borrowed', 'late'] } 
  });

  const now = new Date();
  
  for (const loan of activeLoans) {
    if (loan.dueDate && now > loan.dueDate) {
      const diffTime = Math.abs(now.getTime() - loan.dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      loan.fineAmount = diffDays * DENDA_PER_HARI;
      loan.status = 'late';
      
      await loan.save(); 
    }
  }
};

exports.myLoans = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await updateFinesForUser(userId);
  const loans = await Loan.find({ user: userId }).populate("book");
  res.json(loans);
});

exports.listAllLoans = asyncHandler(async (req, res) => {
  const loans = await Loan.find().populate("user").populate("book");
  res.json(loans);
});

exports.getLoanById = asyncHandler(async (req, res) => {
  await updateFinesForUser(req.user.id);
  
  const loan = await Loan.findById(req.params.id).populate("book user");
  if (!loan) return res.status(404).json({ message: "Loan not found" });

  if (req.user.role !== "admin" && loan.user._id.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  res.json(loan);
});

exports.returnLoan = asyncHandler(async (req, res) => {
  const loanId = req.params.id;
  const loan = await Loan.findById(loanId).populate("book");
  if (!loan) return res.status(404).json({ message: "Loan not found" });

  if (req.user.role !== "admin" && loan.user._id.toString() !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (loan.status === "returned") {
    return res.status(400).json({ message: "Already returned" });
  }

  await updateFinesForUser(loan.user.toString());
  const updatedLoan = await Loan.findById(loanId);
  
  updatedLoan.returnedAt = new Date();
  updatedLoan.status = "returned";

  if (updatedLoan.paymentStatus === "paid") {
    const fine = updatedLoan.fineAmount || 0;
    const deposit = updatedLoan.depositAmount;
    const refundAmount = deposit - fine;

    if (refundAmount <= 0) {
      updatedLoan.refundStatus = "forfeited";
    } else {
      try {
        const refundReason = fine > 0 
          ? `Partial refund. Deposit: ${deposit}, Fine: ${fine}` 
          : "Full refund. On-time return.";

        await core.refundTransaction(
          { order_id: updatedLoan.midtransOrderId },
          {
            refund_key: `refund-${updatedLoan._id}-${Date.now()}`,
            amount: refundAmount,
            reason: refundReason,
          }
        );
        updatedLoan.refundStatus = "refunded";
      } catch (refundErr) {
        console.error("Midtrans Refund failed:", refundErr);
        updatedLoan.refundStatus = "pending";
      }
    }
  } else {
    updatedLoan.refundStatus = "no_payment_made";
  }

  if (updatedLoan.book) {
    await Book.findByIdAndUpdate(updatedLoan.book._id, { $inc: { stock: 1 } });
  }

  await updatedLoan.save();
  res.json({ message: "Book returned", loan: updatedLoan });
});

exports.checkLoanByBookId = asyncHandler(async (req, res) => {
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
      loanStatus = "late";
  } else if (loan.paymentStatus === 'unpaid') {
      loanStatus = "pending"; 
  }

  res.json({
      status: loanStatus,
      paymentStatus: loan.paymentStatus,
      dueDate: loan.dueDate,
  });
});