// Konstanta biaya
const FEES = {
  COMMITMENT_FEE: 25000, // Rp 25.000
  FINE_PER_DAY: 5000,    // Rp 5.000 per hari
  MEMBER_DISCOUNT: 0.5,   // 50% discount untuk member
  MAX_FINE: 100000       // Max fine Rp 100.000
};

// Hitung total biaya peminjaman
const calculateTotalCost = (borrowType, dueDate, returnDate, isMember = false) => {
  const commitment = FEES.COMMITMENT_FEE;
  
  // Hitung overdue days
  const today = new Date(returnDate);
  const due = new Date(dueDate);
  const diffTime = today - due;
  const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let fineAmount = 0;
  if (overdueDays > 0) {
    let finePerDay = FEES.FINE_PER_DAY;
    if (isMember) {
      finePerDay = finePerDay * (1 - FEES.MEMBER_DISCOUNT);
    }
    fineAmount = overdueDays * finePerDay;
    if (fineAmount > FEES.MAX_FINE) {
      fineAmount = FEES.MAX_FINE;
    }
  }
  
  let total = commitment + fineAmount;
  let refund = 0;
  
  // Jika tidak ada denda, commitment fee akan dikembalikan
  if (fineAmount === 0) {
    refund = commitment;
    total = 0;
  }
  
  return {
    commitmentFee: commitment,
    lateFine: fineAmount,
    totalCost: total,
    refund: refund,
    summary: total === 0 ? 
      'Commitment fee akan dikembalikan' : 
      `Total biaya: Rp ${total.toLocaleString('id-ID')}`
  };
};

// Hitung estimasi biaya sebelum meminjam
const estimateBorrowCost = (borrowType, borrowDate, isMember = false) => {
  const { calculateDueDate } = require('./dateUtils');
  
  const dueDate = calculateDueDate(borrowType, isMember, borrowDate);
  const commitmentFee = FEES.COMMITMENT_FEE;
  
  return {
    onTime: {
      commitmentFee,
      lateFine: 0,
      totalCost: 0,
      refund: commitmentFee,
      dueDate,
      message: 'Jika dikembalikan tepat waktu, commitment fee akan dikembalikan'
    },
    feeStructure: {
      commitmentFee: FEES.COMMITMENT_FEE,
      finePerDay: isMember ? FEES.FINE_PER_DAY * (1 - FEES.MEMBER_DISCOUNT) : FEES.FINE_PER_DAY,
      memberBenefit: isMember ? 'Discount 50% untuk denda' : 'Tidak ada discount',
      maxFine: FEES.MAX_FINE
    }
  };
};

module.exports = {
  FEES,
  calculateTotalCost,
  estimateBorrowCost
};