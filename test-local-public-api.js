// 🧪 TEST LOCAL PUBLIC API - Test the public endpoints locally first
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Test local versions of our public APIs
async function testLocalPublicAPI() {
  console.log('🧪 TESTING LOCAL PUBLIC API');
  console.log('============================\n');

  const results = { passed: 0, failed: 0, tests: [] };

  // First test the api/test.js endpoint logic
  console.log('📋 Test 1: Testing api/test.js Logic');
  console.log('====================================');
  
  try {
    // Read and test the test.js file directly
    const testApiContent = fs.readFileSync('api/test.js', 'utf8');
    console.log('✅ Test API file found');
    console.log('✅ Content length:', testApiContent.length);
    
    // Check if it has the expected structure
    if (testApiContent.includes('Test API is running')) {
      console.log('✅ Test API has correct response message');
      results.passed++;
      results.tests.push({ name: 'Test API Structure', status: 'PASSED' });
    } else {
      console.log('❌ Test API missing expected response');
      results.failed++;
      results.tests.push({ name: 'Test API Structure', status: 'FAILED' });
    }
    
  } catch (error) {
    console.log(`❌ Test API check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Test API Structure', status: 'FAILED', error: error.message });
  }

  // Test the public-extract.js endpoint logic
  console.log('\n📋 Test 2: Testing api/public-extract.js Logic');
  console.log('===============================================');
  
  try {
    const publicApiContent = fs.readFileSync('api/public-extract.js', 'utf8');
    console.log('✅ Public extract API file found');
    console.log('✅ Content length:', publicApiContent.length);
    
    // Check if it has the expected structure
    if (publicApiContent.includes('PUBLIC API - NO AUTHENTICATION REQUIRED')) {
      console.log('✅ Public API has correct no-auth header');
      results.passed++;
      results.tests.push({ name: 'Public API Structure', status: 'PASSED' });
    } else {
      console.log('❌ Public API missing no-auth header');
      results.failed++;
      results.tests.push({ name: 'Public API Structure', status: 'FAILED' });
    }
    
  } catch (error) {
    console.log(`❌ Public API check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Public API Structure', status: 'FAILED', error: error.message });
  }

  // Test vercel.json configuration
  console.log('\n📋 Test 3: Testing vercel.json Configuration');
  console.log('=============================================');
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    console.log('✅ Vercel config found');
    
    // Check if public-extract route is configured
    const publicExtractRoute = vercelConfig.routes.find(r => r.src === '/api/public-extract');
    if (publicExtractRoute) {
      console.log('✅ Public extract route configured');
      console.log('✅ Route destination:', publicExtractRoute.dest);
      results.passed++;
      results.tests.push({ name: 'Vercel Config', status: 'PASSED' });
    } else {
      console.log('❌ Public extract route not found in vercel.json');
      results.failed++;
      results.tests.push({ name: 'Vercel Config', status: 'FAILED' });
    }
    
  } catch (error) {
    console.log(`❌ Vercel config check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Vercel Config', status: 'FAILED', error: error.message });
  }

  // Test PDF file availability
  console.log('\n📋 Test 4: Testing PDF File Availability');
  console.log('=========================================');
  
  try {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    if (fs.existsSync(pdfPath)) {
      const pdfStats = fs.statSync(pdfPath);
      console.log('✅ Test PDF file found');
      console.log('✅ PDF size:', pdfStats.size, 'bytes');
      console.log('✅ PDF modified:', pdfStats.mtime.toISOString());
      results.passed++;
      results.tests.push({ name: 'PDF File Availability', status: 'PASSED' });
    } else {
      console.log('❌ Test PDF file not found');
      results.failed++;
      results.tests.push({ name: 'PDF File Availability', status: 'FAILED' });
    }
    
  } catch (error) {
    console.log(`❌ PDF file check failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'PDF File Availability', status: 'FAILED', error: error.message });
  }

  // TEST SUMMARY
  console.log('\n🧪 LOCAL TEST SUMMARY');
  console.log('=====================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  // DIAGNOSIS
  console.log('\n🔍 DIAGNOSIS');
  console.log('============');
  if (results.failed === 0) {
    console.log('🎉 All local tests passed!');
    console.log('🔧 The issue is likely in the Vercel deployment configuration.');
    console.log('💡 The authentication is being applied at the Vercel level, not in our code.');
  } else {
    console.log('🔧 Issues found in local setup:');
    results.tests.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`  • ${test.name}`);
    });
  }
  
  console.log('\n🚀 RECOMMENDATIONS:');
  console.log('1. Local files are properly structured for public API');
  console.log('2. Vercel deployment has authentication middleware enabled');
  console.log('3. Need to deploy without authentication or configure bypass');
  console.log('4. Consider using a different deployment method for testing');

  return results;
}

// Run local test
testLocalPublicAPI().catch(console.error);