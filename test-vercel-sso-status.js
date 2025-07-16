// 🔐 Test Vercel SSO Status - Check if authentication is blocking
import fetch from 'node-fetch';

const VERCEL_URL = 'https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app';

async function testVercelSSOStatus() {
  console.log('🔐 TESTING VERCEL SSO STATUS');
  console.log('============================');
  console.log(`Testing: ${VERCEL_URL}\n`);

  // Test 1: Check main site
  try {
    console.log('📋 Test 1: Main Site Access');
    console.log('===========================');
    
    const response = await fetch(VERCEL_URL);
    const isBlocked = response.status === 401;
    const contentType = response.headers.get('content-type');
    
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`SSO Status: ${isBlocked ? '🔒 BLOCKED' : '✅ OPEN'}`);
    
    if (isBlocked) {
      console.log('❌ SSO authentication is ACTIVE');
      console.log('🔧 Need to disable in Vercel dashboard');
    } else {
      console.log('✅ Site is accessible without authentication');
    }
    
  } catch (error) {
    console.log(`❌ Error testing main site: ${error.message}`);
  }

  // Test 2: Check API endpoints
  console.log('\n📋 Test 2: API Endpoints');
  console.log('========================');
  
  const endpoints = ['/api/test', '/api/public-extract', '/api/health'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${VERCEL_URL}${endpoint}`);
      const isBlocked = response.status === 401;
      
      console.log(`${endpoint}: ${response.status} ${isBlocked ? '🔒 BLOCKED' : '✅ OPEN'}`);
      
      if (!isBlocked && endpoint === '/api/test') {
        try {
          const data = await response.json();
          console.log(`  ✅ Response: ${data.message}`);
        } catch (e) {
          console.log(`  ⚠️  Non-JSON response`);
        }
      }
    } catch (error) {
      console.log(`${endpoint}: ❌ ERROR - ${error.message}`);
    }
  }

  // Test 3: Check headers for SSO indicators
  console.log('\n📋 Test 3: SSO Headers Analysis');
  console.log('===============================');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/test`);
    const headers = response.headers;
    
    const ssoHeaders = [
      'set-cookie',
      'x-frame-options', 
      'x-robots-tag',
      'strict-transport-security'
    ];
    
    console.log('SSO-related headers:');
    ssoHeaders.forEach(header => {
      const value = headers.get(header);
      if (value) {
        console.log(`  ${header}: ${value}`);
      }
    });
    
    // Check for SSO nonce in cookie
    const cookies = headers.get('set-cookie');
    if (cookies && cookies.includes('_vercel_sso_nonce')) {
      console.log('🔒 SSO nonce detected - authentication is ACTIVE');
    }
    
  } catch (error) {
    console.log(`❌ Error checking headers: ${error.message}`);
  }

  // Test 4: Provide solution steps
  console.log('\n🚀 SOLUTION STEPS');
  console.log('=================');
  
  console.log('To fix the SSO authentication issue:');
  console.log('');
  console.log('1. 🌐 Go to: https://vercel.com/aviads-projects-0f56b7ac/pdf-main/settings');
  console.log('2. 🔧 Click "Security" or "Protection" tab');
  console.log('3. 🔓 Find "Vercel Authentication" toggle');
  console.log('4. ❌ Turn OFF authentication for this project');
  console.log('5. 💾 Save changes');
  console.log('6. ⏱️  Wait 1-2 minutes for propagation');
  console.log('7. 🧪 Run this test again to verify');
  console.log('');
  console.log('Expected result after fix:');
  console.log('✅ Status: 200 OK');
  console.log('✅ Content-Type: application/json');
  console.log('✅ SSO Status: OPEN');
  console.log('');
  console.log('Then run: node test-complete-solution.js');
  console.log('Expected: 100% success rate! 🎯');
}

// Run the test
testVercelSSOStatus().catch(console.error);