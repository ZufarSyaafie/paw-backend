const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const debugTest = async () => {
  console.log('🔍 Debug Books API Error...\n');

  try {
    // Step 1: Buat admin user dulu
    console.log('👤 Creating Admin User...');
    try {
      const adminResponse = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Admin Naratama',
        email: 'admin@naratama.com',
        password: 'admin123',
        phoneNumber: '081234567999'
      });
      console.log('✅ Admin user created');
      
      // Manually update user role to admin (since we can't do it via API)
      console.log('⚠️ Need to manually update user role to admin in database');
      
    } catch (error) {
      if (error.response?.data?.message?.includes('sudah terdaftar')) {
        console.log('✅ Admin user already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Login admin
    console.log('\n🔐 Login Admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@naratama.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    const user = loginResponse.data.data.user;
    
    console.log('User Info:', {
      name: user.name,
      role: user.role,
      isMember: user.isMember
    });

    // Step 3: Test auth dengan simple endpoint
    console.log('\n🧪 Test Auth Endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Auth working, user role:', profileResponse.data.data.user.role);

    // Step 4: Test book endpoint dengan data minimal
    console.log('\n📚 Test Add Book (Minimal Data)...');
    
    const minimalBook = {
      title: 'Test Book Simple',
      author: 'Test Author',
      format: 'Soft Cover',
      description: 'Simple test book',
      details: {
        publisher: 'Test Publisher',
        isbn: '978-0-123456-78-9',
        publishDate: '2023-01-01',
        pages: 100,
        language: 'English',
        dimensions: {
          length: 20,
          width: 13
        },
        weight: 300
      },
      category: 'Fiksi',
      rackLocation: 'A-01-01',
      totalStock: 5,
      availableStock: 5
    };

    console.log('Sending request with token...');
    
    const bookResponse = await axios.post(`${BASE_URL}/books`, minimalBook, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Book added successfully!');
    console.log('Book ID:', bookResponse.data.data.book._id);

  } catch (error) {
    console.error('\n❌ ERROR DETAILS:');
    console.error('Status Code:', error.response?.status);
    console.error('Error Message:', error.response?.data?.message);
    console.error('User Role (if available):', error.response?.data?.userRole);
    console.error('Full Response:', error.response?.data);
    
    if (error.response?.status === 403) {
      console.log('\n💡 SOLUTION: User role is not admin!');
      console.log('Need to update user role in database manually.');
    }
  }
};

debugTest();