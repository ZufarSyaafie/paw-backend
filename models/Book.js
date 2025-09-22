const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography'],
  },
  quantityAvailable: { // Jumlah stok buku yang tersedia
    type: Number,
    required: true,
    min: 0,
  },
  totalQuantity: { // Total jumlah buku yang dimiliki
    type: Number,
    required: true,
    min: 0,
  },
  description: String,
  coverImageUrl: String,
  publishedDate: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Anda bisa menambahkan method ke skema ini untuk mempermudah.
// Contoh:
bookSchema.statics.getLibraryStats = async function() {
  return await this.aggregate([
    {
      $group: {
        _id: null,
        totalBooks: { $sum: '$totalQuantity' },
        availableBooks: { $sum: '$quantityAvailable' },
        categories: { $addToSet: '$category' }
      }
    }
  ]);
};

module.exports = mongoose.model('Book', bookSchema);