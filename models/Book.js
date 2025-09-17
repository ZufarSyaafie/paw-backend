const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  // Informasi Utama Buku
  title: {
    type: String,
    required: [true, 'Judul buku wajib diisi'],
    trim: true,
    index: true
  },
  author: {
    type: String,
    required: [true, 'Penulis wajib diisi'],
    trim: true,
    index: true
  },
  format: {
    type: String,
    required: [true, 'Format buku wajib diisi'],
    enum: ['Soft Cover', 'Hard Cover'],
    default: 'Soft Cover'
  },
  description: {
    type: String,
    required: [true, 'Deskripsi buku wajib diisi'],
    trim: true
  },
  
  // Detail Buku
  details: {
    publisher: {
      type: String,
      required: [true, 'Penerbit wajib diisi'],
      trim: true
    },
    isbn: {
      type: String,
      required: [true, 'ISBN wajib diisi'],
      unique: true,
      trim: true,
      index: true
    },
    publishDate: {
      type: Date,
      required: [true, 'Tanggal terbit wajib diisi'],
      index: true
    },
    pages: {
      type: Number,
      required: [true, 'Jumlah halaman wajib diisi'],
      min: 1
    },
    language: {
      type: String,
      required: [true, 'Bahasa wajib diisi'],
      enum: ['Indonesian', 'English', 'Others'], // ⬅️ UPDATE ENUM
      default: 'Indonesian'
    },
    dimensions: {
      length: {
        type: Number,
        required: [true, 'Panjang buku wajib diisi (cm)'],
        min: 0
      },
      width: {
        type: Number,
        required: [true, 'Lebar buku wajib diisi (cm)'],
        min: 0
      }
    },
    weight: {
      type: Number,
      required: [true, 'Berat buku wajib diisi (gram)'],
      min: 0
    }
  },
  
  // Sistem Perpustakaan
  category: {
    type: String,
    required: [true, 'Kategori wajib diisi'],
    enum: ['Fiksi', 'Non-Fiksi', 'Sains', 'Teknologi', 'Sejarah', 'Biografi', 'Pendidikan', 'Lainnya'],
    index: true
  },
  rackLocation: {
    type: String,
    required: [true, 'Lokasi rak wajib diisi'],
    trim: true
  },
  totalStock: {
    type: Number,
    required: [true, 'Total stok wajib diisi'],
    min: 1
  },
  availableStock: {
    type: Number,
    required: [true, 'Stok tersedia wajib diisi'],
    min: 0,
    validate: {
      validator: function(value) {
        return value <= this.totalStock;
      },
      message: 'Stok tersedia tidak boleh melebihi total stok'
    }
  },
  coverImage: {
    type: String,
    default: null
  },
  
  // Sistem Peminjaman Perpustakaan "Naratama"
  borrowingRules: {
    commitmentFee: {
      type: Number,
      default: 25000, // Rp 25.000
      required: true
    },
    minBorrowHours: {
      type: Number,
      default: 1, // 1 jam minimal
      required: true
    },
    maxBorrowDays: {
      type: Number,
      default: 14, // 14 hari
      required: true
    },
    finePerDay: {
      type: Number,
      default: 5000, // Rp 5.000 per hari (update dari 2000)
      required: true
    },
    availableOnWorkDays: {
      type: Boolean,
      default: true
    },
    borrowingOptions: {
      canBorrowHome: {
        type: Boolean,
        default: true
      },
      canReadInLibrary: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Sistem Keanggotaan
  membershipRequirement: {
    requireMembership: {
      type: Boolean,
      default: false
    },
    memberBenefits: {
      longerBorrowPeriod: {
        type: Boolean,
        default: true
      },
      reducedFee: {
        type: Boolean,
        default: true
      },
      priorityAccess: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Ulasan Produk
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userContact: {
      type: String,
      required: false
    },
    rating: {
      type: Number,
      required: [true, 'Rating wajib diisi'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Komentar wajib diisi'],
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Rating & Statistics
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  borrowCount: {
    type: Number,
    default: 0,
    min: 0
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['Tersedia', 'Sedang Dipinjam', 'Tidak Tersedia', 'Maintenance'],
    default: 'Tersedia'
  },
  
  // Metadata
  isNewArrival: {
    type: Boolean,
    default: false
  },
  addedToCollectionDate: {
    type: Date,
    default: Date.now
  },
  
  // Library Info
  libraryInfo: {
    isPopular: {
      type: Boolean,
      default: false
    },
    recommendedFor: {
      type: String,
      enum: ['Pemula', 'Menengah', 'Lanjut', 'Semua Level'],
      default: 'Semua Level'
    },
    readingLocation: {
      type: String,
      enum: ['Di Perpustakaan', 'Bawa Pulang', 'Keduanya'],
      default: 'Keduanya'
    }
  }
}, {
  timestamps: true
});

// ===== INDEXES =====
bookSchema.index({ title: 1, author: 1 });
bookSchema.index({ category: 1, 'details.publishDate': -1 });
bookSchema.index({ popularity: -1, borrowCount: -1 });
bookSchema.index({ isNewArrival: -1, addedToCollectionDate: -1 });
bookSchema.index({ status: 1, availableStock: 1 });

// ===== VIRTUALS =====

// Virtual untuk cek ketersediaan sesuai hari kerja
bookSchema.virtual('isAvailable').get(function() {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const isWorkDay = today >= 1 && today <= 5; // Monday to Friday
  
  return this.availableStock > 0 && 
         this.status === 'Tersedia' && 
         (!this.borrowingRules.availableOnWorkDays || isWorkDay);
});

// Virtual untuk status detail
bookSchema.virtual('detailedStatus').get(function() {
  if (this.availableStock === 0) return 'Sedang Dipinjam';
  if (this.status === 'Maintenance') return 'Sedang Maintenance';
  
  const today = new Date().getDay();
  const isWorkDay = today >= 1 && today <= 5;
  if (this.borrowingRules.availableOnWorkDays && !isWorkDay) {
    return 'Hanya Tersedia di Hari Kerja';
  }
  
  return 'Tersedia';
});

// Virtual untuk tahun terbit
bookSchema.virtual('publishYear').get(function() {
  return this.details.publishDate ? this.details.publishDate.getFullYear() : null;
});

// Virtual untuk availability percentage
bookSchema.virtual('availabilityPercentage').get(function() {
  return Math.round((this.availableStock / this.totalStock) * 100);
});

// ===== PRE-SAVE MIDDLEWARE =====

// Update status berdasarkan availableStock
bookSchema.pre('save', function(next) {
  if (this.availableStock === 0 && this.status === 'Tersedia') {
    this.status = 'Sedang Dipinjam';
  } else if (this.availableStock > 0 && this.status === 'Sedang Dipinjam') {
    this.status = 'Tersedia';
  }
  
  // Update popularity score
  this.updatePopularity();
  
  next();
});

// ===== INSTANCE METHODS =====

// Method untuk menambah ulasan
bookSchema.methods.addReview = function(userId, userName, rating, comment, userContact = null) {
  // Cek apakah user sudah pernah review
  const existingReview = this.reviews.find(review => 
    review.user.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('Anda sudah memberikan ulasan untuk buku ini');
  }
  
  // Tambah review baru
  this.reviews.push({
    user: userId,
    userName: userName,
    userContact: userContact,
    rating: rating,
    comment: comment
  });
  
  // Update rata-rata rating
  const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.averageRating = Number((totalRating / this.reviews.length).toFixed(1));
  this.totalReviews = this.reviews.length;
  
  return this.save();
};

// Method untuk meminjam buku (UPDATED)
bookSchema.methods.borrowBook = function(borrowType = 'Bawa Pulang') {
  // Cek availability
  if (!this.isAvailable) {
    const today = new Date().getDay();
    const isWorkDay = today >= 1 && today <= 5;
    
    if (this.availableStock === 0) {
      throw new Error('Buku sedang tidak tersedia. Semua eksemplar sedang dipinjam.');
    }
    
    if (this.borrowingRules.availableOnWorkDays && !isWorkDay) {
      throw new Error('Peminjaman buku hanya tersedia di hari kerja (Senin-Jumat).');
    }
    
    throw new Error('Buku sedang tidak tersedia untuk dipinjam.');
  }
  
  // Validasi borrowType
  if (borrowType === 'Bawa Pulang' && !this.borrowingRules.borrowingOptions.canBorrowHome) {
    throw new Error('Buku ini tidak dapat dibawa pulang.');
  }
  
  if (borrowType === 'Baca di Tempat' && !this.borrowingRules.borrowingOptions.canReadInLibrary) {
    throw new Error('Buku ini tidak dapat dibaca di perpustakaan.');
  }
  
  // Update stock
  this.availableStock -= 1;
  this.borrowCount += 1;
  
  return this.save();
};

// Method untuk mengembalikan buku (FIXED)
bookSchema.methods.returnBook = function() {
  // Cek apakah masih bisa mengembalikan
  if (this.availableStock >= this.totalStock) {
    throw new Error('Error: Tidak ada buku yang sedang dipinjam untuk dikembalikan.');
  }
  
  // Tambah available stock
  this.availableStock += 1;
  
  return this.save();
};

// Method untuk cek apakah buku tersedia untuk dipinjam
bookSchema.methods.canBorrow = function(borrowType = 'Bawa Pulang') {
  if (!this.isAvailable) return false;
  
  if (borrowType === 'Bawa Pulang') {
    return this.borrowingRules.borrowingOptions.canBorrowHome;
  }
  
  if (borrowType === 'Baca di Tempat') {
    return this.borrowingRules.borrowingOptions.canReadInLibrary;
  }
  
  return false;
};

// Method untuk update popularity (IMPROVED)
bookSchema.methods.updatePopularity = function() {
  // Formula popularity: (borrowCount * 3) + (averageRating * 2) + (totalReviews * 1) + (viewCount * 0.1)
  this.popularity = Math.round(
    (this.borrowCount * 3) + 
    (this.averageRating * 2) + 
    (this.totalReviews * 1) + 
    (this.viewCount * 0.1)
  );
  
  // Update isPopular flag
  this.libraryInfo.isPopular = this.popularity > 50;
};

// Method untuk reserve book (for future use)
bookSchema.methods.reserveBook = function() {
  if (this.availableStock > 0) {
    throw new Error('Buku masih tersedia, tidak perlu reservasi.');
  }
  
  // Logic for reservation system (to be implemented)
  return { message: 'Reservasi berhasil, Anda akan dihubungi ketika buku tersedia.' };
};

// ===== STATIC METHODS =====

// Method untuk pencarian auto-suggestion
bookSchema.statics.getSearchSuggestions = function(query, limit = 10) {
  return this.find({
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { author: { $regex: query, $options: 'i' } },
      { 'details.isbn': { $regex: query, $options: 'i' } }
    ],
    status: { $ne: 'Tidak Tersedia' }
  })
  .select('title author details.isbn category availableStock')
  .limit(limit)
  .lean();
};

// Method untuk mendapatkan buku baru
bookSchema.statics.getNewArrivals = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    $or: [
      { isNewArrival: true },
      { addedToCollectionDate: { $gte: cutoffDate } }
    ],
    status: { $ne: 'Tidak Tersedia' }
  })
  .sort({ addedToCollectionDate: -1 })
  .limit(20);
};

// Method untuk mendapatkan buku populer
bookSchema.statics.getPopularBooks = function(limit = 10) {
  return this.find({
    status: 'Tersedia',
    availableStock: { $gt: 0 }
  })
  .sort({ popularity: -1, borrowCount: -1 })
  .limit(limit);
};

// Method untuk mendapatkan statistik perpustakaan
bookSchema.statics.getLibraryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        totalStock: { $sum: '$totalStock' },
        totalAvailable: { $sum: '$availableStock' },
        totalBorrowed: { $sum: { $subtract: ['$totalStock', '$availableStock'] } },
        averageRating: { $avg: '$averageRating' },
        totalBorrows: { $sum: '$borrowCount' }
      }
    }
  ]);
};

// Method untuk mendapatkan buku berdasarkan kategori
bookSchema.statics.getBooksByCategory = function(category, limit = 20) {
  return this.find({
    category: category,
    status: 'Tersedia'
  })
  .sort({ popularity: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Book', bookSchema);