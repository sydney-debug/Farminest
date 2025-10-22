require('dotenv').config();
const fetch = require('node-fetch');

const API = 'http://localhost:3001/api';
const testEmail = 'test@example.com';
let token = null;

async function testEndpoints() {
  try {
    console.log('Testing backend endpoints...\n');

    // 1. Test root endpoint
    console.log('1. Testing root endpoint...');
    const root = await fetch('http://localhost:3001/');
    console.log('Root endpoint:', root.status === 200 ? 'OK' : 'Failed');

    // 2. Test login
    console.log('\n2. Testing login...');
    const loginRes = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log('Login:', loginData.token ? 'OK' : 'Failed');

    // 3. Test vets endpoint (public)
    console.log('\n3. Testing vets endpoint...');
    const vetsRes = await fetch(`${API}/vets`);
    const vetsData = await vetsRes.json();
    console.log('Vets endpoint:', vetsRes.status === 200 ? 'OK' : 'Failed');
    console.log('Vets data:', vetsData);

    if (!token) {
      console.log('\nNo token received, skipping authenticated endpoints');
      return;
    }

    // 4. Test animals endpoint (authenticated)
    console.log('\n4. Testing animals endpoint...');
    const animalsRes = await fetch(`${API}/animals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const animalsData = await animalsRes.json();
    console.log('Animals endpoint:', animalsRes.status === 200 ? 'OK' : 'Failed');
    console.log('Animals data:', animalsData);

  } catch (err) {
    console.error('Error during tests:', err.message);
  }
}

testEndpoints();