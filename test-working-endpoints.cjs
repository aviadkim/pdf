const puppeteer = require('puppeteer');
const fs = require('fs');
const FormData = require('form-data');

// Test the working endpoints from our local test
async function testWorkingEndpoints() {
  console.log('🚀 TESTING WORKING ENDPOINTS ON VERCEL');
  console.log('=====================================');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Test public-extract endpoint specifically
  console.log('\n📋 Test 1: Public Extract Endpoint');
  console.log('=================================');
  
  try {
    // Create a simple PDF buffer for testing
    const testPDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n235\n%%EOF');
    
    const formData = new FormData();
    formData.append('pdf', testPDF, 'test.pdf');
    
    const response = await fetch('https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app/api/public-extract', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const responseText = await response.text();
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response length: ${responseText.length}`);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(responseText);
        console.log(`✅ Success: ${data.success}`);
        console.log(`✅ Message: ${data.message}`);
        console.log(`✅ Public API: ${data.publicAPI}`);
        if (data.data) {
          console.log(`✅ ISINs found: ${data.data.isins?.length || 0}`);
          console.log(`✅ Values found: ${data.data.values?.length || 0}`);
        }
      } catch (parseError) {
        console.log(`⚠️  Response not JSON: ${responseText.substring(0, 200)}...`);
      }
    } else {
      console.log(`❌ Error response: ${responseText.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  // Test true-100-percent-extractor endpoint
  console.log('\n📋 Test 2: True 100% Extractor Endpoint');
  console.log('======================================');
  
  try {
    const testPDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(ISIN: CH0012345678 Value: 199\\'080) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n235\n%%EOF');
    
    const formData = new FormData();
    formData.append('pdf', testPDF, 'test.pdf');
    
    const response = await fetch('https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app/api/true-100-percent-extractor', {
      method: 'POST',
      body: formData,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const responseText = await response.text();
    console.log(`✅ Response status: ${response.status}`);
    console.log(`✅ Response length: ${responseText.length}`);
    
    if (response.status === 200) {
      try {
        const data = JSON.parse(responseText);
        console.log(`✅ Success: ${data.success}`);
        console.log(`✅ Message: ${data.message}`);
        if (data.data) {
          console.log(`✅ Securities found: ${data.data.securities?.length || 0}`);
          console.log(`✅ Total value: ${data.data.totalValue || 0}`);
        }
      } catch (parseError) {
        console.log(`⚠️  Response not JSON: ${responseText.substring(0, 200)}...`);
      }
    } else {
      console.log(`❌ Error response: ${responseText.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  // Test all endpoints to find working ones
  console.log('\n📋 Test 3: Test All Endpoints');
  console.log('============================');
  
  const endpoints = [
    'test',
    'extract', 
    'public-extract',
    'true-100-percent-extractor',
    'bulletproof-processor',
    'max-plan-processor',
    'mcp'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app/api/${endpoint}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`${endpoint}: ${response.status}`);
      
      if (response.status === 200) {
        const text = await response.text();
        console.log(`  ✅ Success: ${text.substring(0, 100)}...`);
      } else if (response.status === 405) {
        console.log(`  ⚠️  Method not allowed (endpoint exists)`);
      } else {
        const text = await response.text();
        console.log(`  ❌ Error: ${text.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`${endpoint}: ❌ ${error.message}`);
    }
  }
  
  await browser.close();
  
  console.log('\n🎯 TESTING COMPLETE');
  console.log('===================');
}

testWorkingEndpoints().catch(console.error);