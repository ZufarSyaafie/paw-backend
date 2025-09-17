const mongoose = require('mongoose');

const borrowingSchema = new mongoose.Schema({
  // User Info
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Book Info
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  
  // Borrowing Details
  borrowType: {
    type: String,
    enum: ['Baca di Tempat', 'Bawa Pulang'],
    required: true
  },
  
  borrowDate: {
    type: Date,
    default: Date.now
  },
  
  dueDate: {
    type: Date,
    required: true
  },
  
  returnDate: {
    type: Date,
    default: null
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Overdue', 'Lost'],
    default: 'Active'
  },
  
  // Naratama Specific - Commitment Fee System
  commitmentFee: {
    amount: {
      type: Number,
      default: 25000 // Rp 25.000
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending'
    },
    paidAt: {
      type: Date,
      default: null
    },
    refundedAt: {
      type: Date,
      default: null
    }
  },
  
  // Fine System
  fine: {
    amount: {
      type: Number,
      default: 0
    },
    perDay: {
      type: Number,
      default: 5000 // Rp 5.000 per hari
    },
    status: {
      type: String,
      enum: ['None', 'Pending', 'Paid'],
      default: 'None'
    },
    paidAt: {
      type: Date,
      default: null
    }
  },
  
  // Operational Info
  operationalHours: {
    isWorkingDay: {
      type: Boolean,
      default: true
    },
    borrowTime: {
      type: String,
      default: function() {
        return new Date().toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    }
  },
  
  // Member Benefits
  memberBenefits: {
    extendedPeriod: {
      type: Boolean,
      default: false
    },
    reducedFine: {
      type: Boolean,
      default: false
    },
    priorityAccess: {
      type: Boolean,
      default: false
    }
  },
  
  // Additional Info
  notes: {
    type: String,
    default: ''
  },
  
  librarian: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
  
}, {
  timestamps: true
});

// Indexes for performance
borrowingSchema.index({ user: 1, status: 1 });
borrowingSchema.index({ book: 1, status: 1 });
borrowingSchema.index({ borrowDate: -1 });
borrowingSchema.index({ dueDate: 1, status: 1 });

// Virtual untuk calculate overdue days
borrowingSchema.virtual('overdueDays').get(function() {
  if (this.status !== 'Active' || !this.dueDate) return 0;
  
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = today - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
});

// Virtual untuk calculate fine amount
borrowingSchema.virtual('calculatedFine').get(function() {
  const overdue = this.overdueDays;
  if (overdue <= 0) return 0;
  
  const baseRate = this.memberBenefits.reducedFine ? 2500 : 5000;
  return overdue * baseRate;
});

// Pre-save middleware untuk set due date
borrowingSchema.pre('save', function(next) {
  if (this.isNew && !this.dueDate) {
    const borrowDate = new Date(this.borrowDate);
    let dueDate = new Date(borrowDate);
    
    if (this.borrowType === 'Baca di Tempat') {
      // Minimal 1 jam untuk baca di tempat
      dueDate.setHours(dueDate.getHours() + 1);
    } else {
      // Max 14 hari untuk bawa pulang
      dueDate.setDate(dueDate.getDate() + 14);
      
      // Extend untuk member
      if (this.memberBenefits.extendedPeriod) {
        dueDate.setDate(dueDate.getDate() + 7); // +7 hari extra
      }
    }
    
    this.dueDate = dueDate;
  }
  next();
});

// Method untuk update status overdue
borrowingSchema.methods.updateOverdueStatus = function() {
  const now = new Date();
  if (this.status === 'Active' && now > this.dueDate) {
    this.status = 'Overdue';
    this.fine.amount = this.calculatedFine;
    this.fine.status = this.fine.amount > 0 ? 'Pending' : 'None';
  }
  return this.save();
};

// Method untuk return book
borrowingSchema.methods.returnBook = function() {
  this.returnDate = new Date();
  this.status = 'Returned';
  
  // Refund commitment fee jika tidak ada denda
  if (this.fine.amount === 0 && this.commitmentFee.status === 'Paid') {
    this.commitmentFee.status = 'Refunded';
    this.commitmentFee.refundedAt = new Date();
  }
  
  return this.save();
};

// Method untuk pay commitment fee
borrowingSchema.methods.payCommitmentFee = function() {
  this.commitmentFee.status = 'Paid';
  this.commitmentFee.paidAt = new Date();
  return this.save();
};

// Method untuk pay fine
borrowingSchema.methods.payFine = function() {
  this.fine.status = 'Paid';
  this.fine.paidAt = new Date();
  return this.save();
};

// Static method untuk get active borrowings
borrowingSchema.statics.getActiveBorrowings = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['Active', 'Overdue'] }
  }).populate('book', 'title author availableStock');
};

// Static method untuk borrowing statistics
borrowingSchema.statics.getBorrowingStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalFines: { $sum: '$fine.amount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Borrowing', borrowingSchema);