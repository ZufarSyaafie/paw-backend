const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testBorrowingSystem = async () => {
  console.log('🚀 Testing Borrowing System...\n');

  try {
    // Login Admin
    console.log('🔐 Login Admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@naratama.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    const headers = { 'Authorization': `Bearer ${token}` };
    
    console.log('✅ Admin logged in:', loginResponse.data.data.user.name);

    // Get Available Books
    console.log('\n📚 Get Available Books...');
    const booksResponse = await axios.get(`${BASE_URL}/books`);
    const availableBooks = booksResponse.data.data.books.filter(book => book.availableStock > 0);
    
    if (availableBooks.length === 0) {
      console.log('❌ No available books for testing');
      return;
    }
    
    const testBook = availableBooks[0];
    console.log('✅ Found available book:', testBook.title);
    console.log('   Book ID:', testBook._id);
    console.log('   Available Stock:', testBook.availableStock);

    // Test Borrow Book
    console.log('\n📖 Test Borrow Book...');
    console.log('   Sending request with:');
    console.log('   - bookId:', testBook._id);
    console.log('   - borrowType: "Bawa Pulang"');
    
    const borrowResponse = await axios.post(`${BASE_URL}/borrowing/borrow`, {
      bookId: testBook._id,
      borrowType: 'Bawa Pulang'
    }, { headers });
    
    console.log('✅ Book borrowed successfully!');
    console.log('   Borrowing ID:', borrowResponse.data.data.borrowing.id);
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data?.message || error.message);
    
    // TAMBAHAN: Print detail error
    if (error.response?.data) {
      console.error('📋 Error Details:');
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
};

testBorrowingSystem();