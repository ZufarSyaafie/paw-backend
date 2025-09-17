const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';
let authToken = '';

// Test 1: Login untuk dapat token
const testLogin = async () => {
  try {
    console.log('🔐 Testing Login to get token...');
    
    const response = await axios.post(`${BASE_URL}/login`, {
      email: 'jane@example.com',  // user yang sudah dibuat sebelumnya
      password: '123456'
    });

    authToken = response.data.data.token;
    console.log('✅ Login successful, token received');
    console.log('Token length:', authToken.length);
    
    return authToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
};

// Test 2: Access protected route WITH token
const testProtectedWithToken = async () => {
  try {
    console.log('\n🛡️ Testing protected route WITH token...');
    
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Protected route accessed successfully:');
    console.log({
      message: response.data.message,
      user: response.data.data.user
    });

  } catch (error) {
    console.error('❌ Protected route failed:', error.response?.data || error.message);
  }
};

// Test 3: Access protected route WITHOUT token
const testProtectedWithoutToken = async () => {
  try {
    console.log('\n🚫 Testing protected route WITHOUT token...');
    
    await axios.get(`${BASE_URL}/profile`);

  } catch (error) {
    console.log('✅ Correctly blocked access without token:', error.response?.data?.message);
  }
};

// Test 4: Access with invalid token
const testInvalidToken = async () => {
  try {
    console.log('\n🔒 Testing with invalid token...');
    
    await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token-123'
      }
    });

  } catch (error) {
    console.log('✅ Correctly rejected invalid token:', error.response?.data?.message);
  }
};

// Test 5: Update profile (protected PUT request)
const testUpdateProfile = async () => {
  try {
    console.log('\n📝 Testing update profile...');
    
    const response = await axios.put(`${BASE_URL}/profile`, {
      name: 'Jane Smith Updated'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    console.log('✅ Profile updated successfully:');
    console.log({
      message: response.data.message,
      updatedName: response.data.data.user.name
    });

  } catch (error) {
    console.error('❌ Update profile failed:', error.response?.data || error.message);
  }
};

// Run all middleware tests
const runMiddlewareTests = async () => {
  await testLogin();
  
  if (authToken) {
    await testProtectedWithToken();
    await testProtectedWithoutToken();
    await testInvalidToken();
    await testUpdateProfile();
  }
  
  console.log('\n🎉 All middleware tests completed!');
};

runMiddlewareTests();