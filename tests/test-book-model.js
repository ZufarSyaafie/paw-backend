const mongoose = require('mongoose');
const Book = require('../models/Book');
require('dotenv').config();

const testBookModel = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/perpustakaan_naratama');
    console.log('🔍 Testing Updated Book Model...\n');

    // Test 1: Get existing book
    console.log('📚 Test 1: Get Existing Book...');
    const existingBook = await Book.findOne({ title: 'Test Book Simple' });
    if (existingBook) {
      console.log('✅ Found book:', existingBook.title);
      console.log('   Available Stock:', existingBook.availableStock);
      console.log('   Total Stock:', existingBook.totalStock);
      console.log('   Is Available (virtual):', existingBook.isAvailable);
      console.log('   Detailed Status:', existingBook.detailedStatus);
      console.log('   Availability %:', existingBook.availabilityPercentage, '%');
    }

    // Test 2: Test borrowBook method
    console.log('\n📖 Test 2: Test Borrow Book...');
    if (existingBook && existingBook.canBorrow('Bawa Pulang')) {
      console.log('✅ Can borrow - testing borrowBook method...');
      
      // Simpan stock awal
      const initialStock = existingBook.availableStock;
      
      // Coba pinjam
      await existingBook.borrowBook('Bawa Pulang');
      console.log('✅ Book borrowed successfully!');
      console.log('   Stock before:', initialStock);
      console.log('   Stock after:', existingBook.availableStock);
      console.log('   Borrow count:', existingBook.borrowCount);
      
    } else {
      console.log('❌ Cannot borrow book');
    }

    // Test 3: Test returnBook method
    console.log('\n📚 Test 3: Test Return Book...');
    if (existingBook) {
      try {
        const initialStock = existingBook.availableStock;
        await existingBook.returnBook();
        console.log('✅ Book returned successfully!');
        console.log('   Stock before:', initialStock);
        console.log('   Stock after:', existingBook.availableStock);
      } catch (error) {
        console.log('⚠️ Return error (expected if nothing borrowed):', error.message);
      }
    }

    // Test 4: Add new book dengan language enum baru
    console.log('\n📖 Test 4: Add Book with New Language Enum...');
    const newBook = new Book({
      title: 'Harry Potter and the Sorcerer Stone',
      author: 'J.K. Rowling',
      format: 'Hard Cover',
      description: 'A young wizard discovers his magical heritage',
      details: {
        publisher: 'Scholastic',
        isbn: '978-0-439-70818-8',
        publishDate: new Date('1997-06-26'),
        pages: 309,
        language: 'English', // ⬅️ Test enum baru
        dimensions: {
          length: 20,
          width: 13
        },
        weight: 450
      },
      category: 'Fiksi',
      rackLocation: 'B-01-01',
      totalStock: 5,
      availableStock: 5
    });

    await newBook.save();
    console.log('✅ New book added with English language!');
    console.log('   Title:', newBook.title);
    console.log('   Language:', newBook.details.language);
    console.log('   Can borrow home:', newBook.canBorrow('Bawa Pulang'));
    console.log('   Can read in library:', newBook.canBorrow('Baca di Tempat'));

    // Test 5: Static methods
    console.log('\n📊 Test 5: Static Methods...');
    
    // Search suggestions
    const suggestions = await Book.getSearchSuggestions('har', 5);
    console.log('✅ Search suggestions for "har":', suggestions.length, 'results');
    
    // Popular books
    const popularBooks = await Book.getPopularBooks(3);
    console.log('✅ Popular books:', popularBooks.length, 'results');
    
    // Library stats
    const stats = await Book.getLibraryStats();
    console.log('✅ Library stats:', stats[0]);

    // Test 6: Test virtual properties
    console.log('\n⚡ Test 6: Virtual Properties...');
    const testBook = await Book.findOne().limit(1);
    if (testBook) {
      console.log('Book:', testBook.title);
      console.log('   isAvailable (virtual):', testBook.isAvailable);
      console.log('   detailedStatus (virtual):', testBook.detailedStatus);
      console.log('   publishYear (virtual):', testBook.publishYear);
      console.log('   availabilityPercentage (virtual):', testBook.availabilityPercentage + '%');
    }

    console.log('\n🎉 All Book Model Tests Completed Successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

testBookModel();