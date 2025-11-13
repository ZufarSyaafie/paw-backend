const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String,
  publisher: String,
  year: Number,
  category: String,
  stock: { type: Number, default: 1 },
  location: String, // lokasi rak
  synopsis: String,
  isbn: String,
  cover: String,
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Book', bookSchema);
