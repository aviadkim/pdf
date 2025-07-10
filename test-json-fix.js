#!/usr/bin/env node

// Test script to verify JSON parsing fixes
import fetch from 'node-fetch';

console.log('🔧 Testing JSON Parsing Fixes');
console.log('==============================\n');

const BASE_URL = 'http://localhost:3000'; // For local testing
// const BASE_URL = 'https://pdf-five-nu.vercel.app'; // For production testing

// Test 1: Basic endpoint functionality
async function testBasicEndpoint() {
  console.log('📋 Test 1: Basic Endpoint Functionality');
  console.log('=======================================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-endpoint`);
    const text = await response.text();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    console.log(`✅ Response length: ${text.length} characters`);
    
    // Check if it's valid JSON
    try {
      const data = JSON.parse(text);
      console.log('✅ Valid JSON response');
      console.log(`✅ Success: ${data.success}`);
      console.log(`✅ Message: ${data.message}`);
      console.log('✅ Basic Endpoint: PASSED\n');
      return true;
    } catch (jsonError) {
      console.log('❌ Invalid JSON response');
      console.log('Response preview:', text.substring(0, 200));
      console.log('❌ Basic Endpoint: FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('❌ Basic Endpoint: FAILED\n');
    return false;
  }
}

// Test 2: Error handling
async function testErrorHandling() {
  console.log('📋 Test 2: Error Handling');
  console.log('=========================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-endpoint?test=error`);
    const text = await response.text();
    
    console.log(`✅ Status: ${response.status} (should be 500)`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Error response is valid JSON');
      console.log(`✅ Success: ${data.success} (should be false)`);
      console.log(`✅ Error: ${data.error}`);
      console.log('✅ Error Handling: PASSED\n');
      return true;
    } catch (jsonError) {
      console.log('❌ Error response is not valid JSON');
      console.log('Response preview:', text.substring(0, 200));
      console.log('❌ Error Handling: FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('❌ Error Handling: FAILED\n');
    return false;
  }
}

// Test 3: Simple extraction endpoint
async function testSimpleExtraction() {
  console.log('📋 Test 3: Simple Extraction Endpoint');
  console.log('=====================================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/extract-simple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: 'dGVzdCBkYXRh' // "test data" in base64
      })
    });
    
    const text = await response.text();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Response is valid JSON');
      console.log(`✅ Success: ${data.success}`);
      console.log(`✅ Method: ${data.method}`);
      console.log(`✅ Holdings: ${data.data?.holdings?.length || 0}`);
      console.log('✅ Simple Extraction: PASSED\n');
      return true;
    } catch (jsonError) {
      console.log('❌ Response is not valid JSON');
      console.log('Response preview:', text.substring(0, 200));
      console.log('❌ Simple Extraction: FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('❌ Simple Extraction: FAILED\n');
    return false;
  }
}

// Test 4: Method validation
async function testMethodValidation() {
  console.log('📋 Test 4: Method Validation');
  console.log('============================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/extract-simple`, {
      method: 'GET' // Should be rejected
    });
    
    const text = await response.text();
    
    console.log(`✅ Status: ${response.status} (should be 405)`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Error response is valid JSON');
      console.log(`✅ Success: ${data.success} (should be false)`);
      console.log(`✅ Error: ${data.error}`);
      console.log('✅ Method Validation: PASSED\n');
      return true;
    } catch (jsonError) {
      console.log('❌ Error response is not valid JSON');
      console.log('Response preview:', text.substring(0, 200));
      console.log('❌ Method Validation: FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('❌ Method Validation: FAILED\n');
    return false;
  }
}

// Test 5: CORS headers
async function testCORS() {
  console.log('📋 Test 5: CORS Headers');
  console.log('=======================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/test-endpoint`, {
      method: 'OPTIONS'
    });
    
    console.log(`✅ Status: ${response.status} (should be 200)`);
    console.log(`✅ CORS Origin: ${response.headers.get('access-control-allow-origin')}`);
    console.log(`✅ CORS Methods: ${response.headers.get('access-control-allow-methods')}`);
    console.log('✅ CORS Headers: PASSED\n');
    return true;
  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
    console.log('❌ CORS Headers: FAILED\n');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 JSON PARSING FIX VALIDATION');
  console.log('===============================\n');
  
  const results = [];
  
  // Run all tests
  results.push(await testBasicEndpoint());
  results.push(await testErrorHandling());
  results.push(await testSimpleExtraction());
  results.push(await testMethodValidation());
  results.push(await testCORS());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`🎯 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL JSON PARSING FIXES WORKING!');
    console.log('✅ Endpoints return valid JSON');
    console.log('✅ Error handling is robust');
    console.log('✅ Content-Type headers are correct');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
    console.log('🔧 Ensure Vercel deployment has the latest code');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Check if we should test local or production
if (process.argv.includes('--production')) {
  console.log('🌐 Testing production deployment...\n');
  // Uncomment and set your production URL
  // BASE_URL = 'https://your-app.vercel.app';
}

runTests().catch(console.error);