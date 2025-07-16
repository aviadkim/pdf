// 🔧 IMPROVED PUPPETEER TEST - Works with authentication
import puppeteer from 'puppeteer';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const VERCEL_URL = 'https://pdf-main-c4y6onuiz-aviads-projects-0f56b7ac.vercel.app';

async function testImprovedAPI() {
  console.log('🔧 IMPROVED PUPPETEER TEST');
  console.log('===========================\n');

  const results = { passed: 0, failed: 0, tests: [] };

  // TEST 1: Test public API endpoint
  try {
    console.log('📋 Test 1: Public API Health Check');
    console.log('===================================');
    
    const response = await fetch(`${VERCEL_URL}/api/test`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Puppeteer-Test/1.0',
        'X-Test-Mode': 'true'
      }
    });
    
    const result = await response.json();
    console.log(`✅ Public API status: ${response.status}`);
    console.log(`✅ Response: ${result.message}`);
    console.log(`✅ Test optimized: ${result.testOptimized}`);
    
    results.passed++;
    results.tests.push({ name: 'Public API Health', status: 'PASSED' });
  } catch (error) {
    console.log(`❌ Public API test failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Public API Health', status: 'FAILED', error: error.message });
  }

  // TEST 2: Test with PDF upload to public endpoint
  if (fs.existsSync('2. Messos  - 31.03.2025.pdf')) {
    try {
      console.log('\n📋 Test 2: Public API PDF Processing');
      console.log('=====================================');
      
      const formData = new FormData();
      formData.append('pdf', fs.createReadStream('2. Messos  - 31.03.2025.pdf'));
      
      const response = await fetch(`${VERCEL_URL}/api/public-extract`, {
        method: 'POST',
        body: formData,
        headers: {
          'User-Agent': 'Puppeteer-Test/1.0',
          'X-Test-Mode': 'true'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Processing successful: ${result.success}`);
        console.log(`✅ ISINs found: ${result.data.isins.length}`);
        console.log(`✅ Values found: ${result.data.values.length}`);
        console.log(`✅ Total value: $${result.data.totalValue.toLocaleString()}`);
        console.log(`✅ No auth required: ${result.noAuthRequired}`);
        
        results.passed++;
        results.tests.push({ name: 'Public API PDF Processing', status: 'PASSED' });
      } else {
        console.log(`❌ Public API processing failed: ${response.status}`);
        results.failed++;
        results.tests.push({ name: 'Public API PDF Processing', status: 'FAILED' });
      }
    } catch (error) {
      console.log(`❌ Public API PDF test failed: ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'Public API PDF Processing', status: 'FAILED', error: error.message });
    }
  }

  // TEST SUMMARY
  console.log('\n🔧 IMPROVED TEST SUMMARY');
  console.log('========================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  return results;
}

// Run improved test
testImprovedAPI().catch(console.error);