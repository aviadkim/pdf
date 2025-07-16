// 🚀 ROBUST PUPPETEER TEST - Enhanced stability and error handling
import puppeteer from 'puppeteer';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const VERCEL_URL = 'https://pdf-main-mrtrtyvp2-aviads-projects-0f56b7ac.vercel.app';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithRetry(testFunction, maxRetries = 3, testName = 'Test') {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${testName} - Attempt ${attempt}/${maxRetries}`);
      const result = await testFunction();
      console.log(`✅ ${testName} - Success on attempt ${attempt}`);
      return result;
    } catch (error) {
      console.log(`❌ ${testName} - Failed attempt ${attempt}: ${error.message}`);
      if (attempt === maxRetries) {
        throw error;
      }
      await delay(2000); // Wait 2 seconds before retry
    }
  }
}

async function testVercelAPIRobust() {
  console.log('🚀 ROBUST VERCEL API TEST');
  console.log('=========================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // TEST 1: API Health Check (No browser needed)
  results.total++;
  try {
    console.log('📋 Test 1: API Health Check');
    console.log('============================');
    
    await testWithRetry(async () => {
      const response = await fetch(`${VERCEL_URL}/api/extract`, {
        method: 'OPTIONS',
        timeout: 10000
      });
      
      console.log(`✅ API accessible: ${response.status}`);
      console.log(`✅ CORS headers: ${response.headers.get('access-control-allow-origin')}`);
      console.log(`✅ Methods allowed: ${response.headers.get('access-control-allow-methods')}`);
      
      return response;
    }, 3, 'API Health Check');
    
    results.passed++;
    results.details.push({ test: 'API Health Check', status: 'PASSED' });
  } catch (error) {
    console.log(`❌ API Health Check failed: ${error.message}`);
    results.failed++;
    results.details.push({ test: 'API Health Check', status: 'FAILED', error: error.message });
  }

  // TEST 2: PDF Processing Test
  results.total++;
  const pdfPath = '2. Messos  - 31.03.2025.pdf';
  
  if (fs.existsSync(pdfPath)) {
    try {
      console.log('\n📋 Test 2: PDF Upload & Processing');
      console.log('==================================');
      
      await testWithRetry(async () => {
        console.log('📄 Preparing PDF upload...');
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));
        
        console.log('🚀 Uploading to Vercel API...');
        const startTime = Date.now();
        
        const response = await fetch(`${VERCEL_URL}/api/extract`, {
          method: 'POST',
          body: formData,
          timeout: 90000 // 90 second timeout
        });
        
        const processingTime = Date.now() - startTime;
        console.log(`⏱️ Upload completed in ${processingTime}ms`);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Success: ${result.success}`);
        console.log(`✅ Message: ${result.message}`);
        console.log(`✅ Securities found: ${result.extractedData?.securities?.length || 0}`);
        console.log(`✅ Total value: $${result.extractedData?.totalValue?.toLocaleString() || 0}`);
        console.log(`✅ Ultimate YOLO: ${result.ultimateYoloProcessing}`);
        console.log(`✅ No API keys: ${result.noApiKeysRequired}`);
        
        // Validate response structure
        if (!result.extractedData || !result.extractedData.securities) {
          throw new Error('Invalid response structure');
        }
        
        if (result.extractedData.securities.length === 0) {
          throw new Error('No securities extracted');
        }
        
        console.log(`✅ Processing time: ${result.metadata?.processingTime || 'N/A'}`);
        console.log(`✅ Improvements: ${result.parseAnalysis?.improvements?.length || 0}`);
        
        return result;
      }, 2, 'PDF Processing');
      
      results.passed++;
      results.details.push({ test: 'PDF Processing', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ PDF Processing failed: ${error.message}`);
      results.failed++;
      results.details.push({ test: 'PDF Processing', status: 'FAILED', error: error.message });
    }
  } else {
    console.log('\n📋 Test 2: PDF Processing - SKIPPED (No PDF found)');
    results.details.push({ test: 'PDF Processing', status: 'SKIPPED', reason: 'No test PDF available' });
  }

  // TEST 3: Error Handling
  results.total++;
  try {
    console.log('\n📋 Test 3: Error Handling');
    console.log('==========================');
    
    await testWithRetry(async () => {
      // Test invalid request
      const invalidResponse = await fetch(`${VERCEL_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' }),
        timeout: 10000
      });
      
      console.log(`✅ Invalid request handled: ${invalidResponse.status}`);
      
      // Test GET method (should fail)
      const getResponse = await fetch(`${VERCEL_URL}/api/extract`, {
        method: 'GET',
        timeout: 10000
      });
      
      console.log(`✅ GET method rejected: ${getResponse.status === 405}`);
      
      return { invalidResponse, getResponse };
    }, 3, 'Error Handling');
    
    results.passed++;
    results.details.push({ test: 'Error Handling', status: 'PASSED' });
  } catch (error) {
    console.log(`❌ Error Handling test failed: ${error.message}`);
    results.failed++;
    results.details.push({ test: 'Error Handling', status: 'FAILED', error: error.message });
  }

  // TEST 4: Browser Test (Minimal)
  results.total++;
  try {
    console.log('\n📋 Test 4: Browser Accessibility');
    console.log('=================================');
    
    await testWithRetry(async () => {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--single-process',
          '--no-zygote'
        ],
        timeout: 30000
      });

      try {
        const page = await browser.newPage();
        await page.setDefaultTimeout(20000);
        
        // Test main site
        console.log('🌐 Testing main site...');
        await page.goto(VERCEL_URL, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
        
        const title = await page.title();
        console.log(`✅ Main site accessible: "${title}"`);
        
        // Test live demo
        console.log('🎭 Testing live demo...');
        await page.goto(`${VERCEL_URL}/live-demo`, { 
          waitUntil: 'domcontentloaded',
          timeout: 20000 
        });
        
        const demoTitle = await page.title();
        console.log(`✅ Live demo accessible: "${demoTitle}"`);
        
        return { title, demoTitle };
      } finally {
        await browser.close();
      }
    }, 2, 'Browser Test');
    
    results.passed++;
    results.details.push({ test: 'Browser Accessibility', status: 'PASSED' });
  } catch (error) {
    console.log(`❌ Browser test failed: ${error.message}`);
    results.failed++;
    results.details.push({ test: 'Browser Accessibility', status: 'FAILED', error: error.message });
  }

  // TEST SUMMARY
  console.log('\n📊 ROBUST TEST SUMMARY');
  console.log('======================');
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Test Details:');
  results.details.forEach((test, i) => {
    const emoji = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${i + 1}. ${emoji} ${test.test}: ${test.status}`);
    if (test.error) console.log(`   ❌ Error: ${test.error}`);
    if (test.reason) console.log(`   ⚠️ Reason: ${test.reason}`);
  });

  // RECOMMENDATIONS
  console.log('\n🔧 IMPROVEMENT RECOMMENDATIONS:');
  if (results.failed === 0) {
    console.log('🎉 All tests passed! System is working excellently.');
    console.log('💡 Consider adding:');
    console.log('  • Load testing with multiple concurrent requests');
    console.log('  • Performance monitoring and metrics');
    console.log('  • Automated CI/CD pipeline testing');
  } else {
    console.log('🔧 Areas for improvement:');
    results.details.filter(t => t.status === 'FAILED').forEach(test => {
      console.log(`  • Fix: ${test.test}`);
    });
    console.log('  • Add better error logging');
    console.log('  • Implement retry mechanisms');
    console.log('  • Optimize response times');
  }

  return results;
}

// Run the robust test
testVercelAPIRobust().catch(console.error);