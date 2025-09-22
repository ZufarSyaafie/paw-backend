// utils/fineCalculator.js
const moment = require('moment');

const FEES = {
  COMMITMENT_FEE: parseInt(process.env.COMMITMENT_FEE || '25000', 10),
  FINE_PER_DAY: parseInt(process.env.FINE_PER_DAY || '5000', 10),
  MEMBER_DISCOUNT: 0.5,
  MAX_FINE: parseInt(process.env.MAX_FINE || '100000', 10)
};

function calculateFine(dueAt, returnAt = null, isMember = false) {
  if (!dueAt) return 0;
  const now = returnAt ? moment(returnAt) : moment();
  const due = moment(dueAt);
  const daysLate = now.diff(due, 'days');
  if (daysLate <= 0) return 0;
  const perDay = isMember ? Math.round(FEES.FINE_PER_DAY * (1 - FEES.MEMBER_DISCOUNT)) : FEES.FINE_PER_DAY;
  return Math.min(daysLate * perDay, FEES.MAX_FINE);
}

function estimateBorrowCost(borrowType, borrowDate = new Date(), isMember = false) {
  const borrow = new Date(borrowDate);
  const due = new Date(borrow);
  if (borrowType === 'Baca di Tempat') {
    due.setHours(due.getHours() + 1);
  } else {
    due.setDate(due.getDate() + (isMember ? 21 : 14));
    due.setHours(23, 59, 59, 999);
  }
  return {
    commitmentFee: FEES.COMMITMENT_FEE,
    dueDate: due,
    finePerDay: isMember ? Math.round(FEES.FINE_PER_DAY * (1 - FEES.MEMBER_DISCOUNT)) : FEES.FINE_PER_DAY
  };
}

module.exports = { FEES, calculateFine, estimateBorrowCost };
