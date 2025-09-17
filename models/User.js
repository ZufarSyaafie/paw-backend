const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nama wajib diisi'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email wajib diisi'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password wajib diisi'],
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: [true, 'Nomor telepon wajib diisi'],
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // Sistem Membership Naratama
  isMember: {
    type: Boolean,
    default: false
  },
  membershipDate: {
    type: Date,
    default: null
  },
  membershipType: {
    type: String,
    enum: ['Regular', 'Premium', 'Student'],
    default: 'Regular'
  },
  
  // Status Account
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Member Benefits Tracking
  memberBenefits: {
    extendedBorrowPeriod: {
      type: Boolean,
      default: function() { return this.isMember; }
    },
    reducedFines: {
      type: Boolean,
      default: function() { return this.isMember; }
    },
    priorityBooking: {
      type: Boolean,
      default: function() { return this.isMember; }
    }
  },
  
  // Borrowing History Summary
  borrowingStats: {
    totalBooksBorrowed: {
      type: Number,
      default: 0
    },
    currentActiveBorrows: {
      type: Number,
      default: 0
    },
    overdueBorrows: {
      type: Number,
      default: 0
    },
    totalFinesPaid: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index untuk performance
userSchema.index({ isMember: 1, membershipDate: -1 });

// Virtual untuk member status
userSchema.virtual('membershipStatus').get(function() {
  if (!this.isMember) return 'Non-Member';
  
  const membershipAge = Date.now() - this.membershipDate;
  const daysSinceMembership = Math.floor(membershipAge / (1000 * 60 * 60 * 24));
  
  if (daysSinceMembership < 30) return 'New Member';
  if (daysSinceMembership < 365) return 'Active Member';
  return 'Senior Member';
});

// Virtual untuk display name
userSchema.virtual('displayName').get(function() {
  return this.isMember ? `${this.name} (Member)` : this.name;
});

// Hash password sebelum save
userSchema.pre('save', async function(next) {
  // Hanya hash jika password dimodifikasi
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Set membership date ketika upgrade ke member
userSchema.pre('save', function(next) {
  if (this.isMember && !this.membershipDate) {
    this.membershipDate = new Date();
  }
  next();
});

// Method untuk compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method untuk upgrade ke member
userSchema.methods.upgradeMembership = function(membershipType = 'Regular') {
  this.isMember = true;
  this.membershipDate = new Date();
  this.membershipType = membershipType;
  this.memberBenefits = {
    extendedBorrowPeriod: true,
    reducedFines: true,
    priorityBooking: true
  };
  return this.save();
};

// Method untuk update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Method untuk increment borrowing stats
userSchema.methods.incrementBorrowStats = function() {
  this.borrowingStats.totalBooksBorrowed += 1;
  this.borrowingStats.currentActiveBorrows += 1;
  return this.save();
};

// Method untuk decrement active borrows (when returned)
userSchema.methods.decrementActiveBorrows = function() {
  if (this.borrowingStats.currentActiveBorrows > 0) {
    this.borrowingStats.currentActiveBorrows -= 1;
  }
  return this.save();
};

// Method untuk add fine payment
userSchema.methods.addFinePaid = function(amount) {
  this.borrowingStats.totalFinesPaid += amount;
  return this.save();
};

// Method untuk check borrowing eligibility
userSchema.methods.canBorrowBooks = function() {
  const maxBorrows = this.isMember ? 10 : 3; // Member bisa pinjam lebih banyak
  return this.borrowingStats.currentActiveBorrows < maxBorrows && 
         this.borrowingStats.overdueBorrows === 0 &&
         this.isActive;
};

// Static method untuk find by phone
userSchema.statics.findByPhone = function(phoneNumber) {
  return this.findOne({ phoneNumber });
};

// Static method untuk get member statistics
userSchema.statics.getMemberStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$isMember',
        count: { $sum: 1 },
        avgBorrows: { $avg: '$borrowingStats.totalBooksBorrowed' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);