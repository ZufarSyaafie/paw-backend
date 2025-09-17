const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testBookAPI = async () => {
  try {
    console.log('🌐 Testing Book API with Updated Model...\n');

    // Test 1: Get all books
    console.log('📚 Test 1: Get All Books...');
    const booksResponse = await axios.get(`${BASE_URL}/books`);
    console.log('✅ Books retrieved:', booksResponse.data.data.pagination.totalBooks, 'books');
    
    if (booksResponse.data.data.books.length > 0) {
      const firstBook = booksResponse.data.data.books[0];
      console.log('   First book:', firstBook.title);
      console.log('   Available:', firstBook.availableStock + '/' + firstBook.totalStock);
      console.log('   Status:', firstBook.status);
    }

    // Test 2: Get book detail
    if (booksResponse.data.data.books.length > 0) {
      const bookId = booksResponse.data.data.books[0]._id;
      console.log('\n📖 Test 2: Get Book Detail...');
      const detailResponse = await axios.get(`${BASE_URL}/books/${bookId}`);
      const book = detailResponse.data.data.book;
      
      console.log('✅ Book detail retrieved:', book.title);
      console.log('   Author:', book.author);
      console.log('   Language:', book.details.language);
      console.log('   Borrow rules:', {
        commitmentFee: book.borrowingRules.commitmentFee,
        maxBorrowDays: book.borrowingRules.maxBorrowDays,
        finePerDay: book.borrowingRules.finePerDay
      });
    }

    // Test 3: Search suggestions
    console.log('\n🔍 Test 3: Search Suggestions...');
    const suggestionsResponse = await axios.get(`${BASE_URL}/books/search-suggestions?q=test`);
    console.log('✅ Search suggestions:', suggestionsResponse.data.data.suggestions.length, 'results');

    // Test 4: Popular books
    console.log('\n🔥 Test 4: Popular Books...');
    const popularResponse = await axios.get(`${BASE_URL}/books/popular`);
    console.log('✅ Popular books:', popularResponse.data.data.books.length, 'books');

    console.log('\n🎉 Book API Tests Completed!');

  } catch (error) {
    console.error('❌ API Error:', error.response?.data?.message || error.message);
  }
};

testBookAPI();