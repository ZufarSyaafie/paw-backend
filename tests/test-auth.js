const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

const testNaratamaAuth = async () => {
  console.log('🚀 Testing Perpustakaan Naratama Auth System...\n');

  try {
    // Test 1: Register Member
    console.log('📝 Testing Member Registration...');
    const memberResponse = await axios.post(`${BASE_URL}/register`, {
      name: 'Olivia',
      email: 'olivia@gmail.com',
      password: '123456',
      phoneNumber: '081234567890'
    });
    console.log('✅ Member registration:', memberResponse.data.message);
    const memberToken = memberResponse.data.data.token;

    // Test 2: Guest Login (Non-Member)
    console.log('\n🎭 Testing Guest Login...');
    const guestResponse = await axios.post(`${BASE_URL}/guest-login`, {
      name: 'Manda',
      phoneNumber: '082345678901'
    });
    console.log('✅ Guest login:', guestResponse.data.message);
    const guestToken = guestResponse.data.data.token;

    // Test 3: Member Login
    console.log('\n🔐 Testing Member Login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'olivia@gmail.com',
      password: '123456'
    });
    console.log('✅ Member login:', loginResponse.data.message);

    // Test 4: Get Member Profile
    console.log('\n👤 Testing Member Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${memberToken}` }
    });
    console.log('✅ Member profile:', {
      name: profileResponse.data.data.user.name,
      isMember: profileResponse.data.data.user.isMember,
      membershipDate: profileResponse.data.data.user.membershipDate
    });

    // Test 5: Get Guest Profile
    console.log('\n🎭 Testing Guest Profile...');
    const guestProfileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: { 'Authorization': `Bearer ${guestToken}` }
    });
    console.log('✅ Guest profile:', {
      name: guestProfileResponse.data.data.user.name,
      isMember: guestProfileResponse.data.data.user.isMember,
      phoneNumber: guestProfileResponse.data.data.user.phoneNumber
    });

    // Test 6: Upgrade Guest to Member
    console.log('\n⬆️ Testing Membership Upgrade...');
    const upgradeResponse = await axios.post(`${BASE_URL}/upgrade-membership`, {
      email: 'manda@gmail.com',
      password: '123456'
    }, {
      headers: { 'Authorization': `Bearer ${guestToken}` }
    });
    console.log('✅ Membership upgrade:', upgradeResponse.data.message);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
  }

  console.log('\n🎉 Naratama Auth System Testing Completed!');
};

testNaratamaAuth();