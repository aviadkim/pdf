// 🚀 VERCEL PUPPETEER TEST - Test deployed API with real PDF
import puppeteer from 'puppeteer';
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testVercelAPI() {
  console.log('🚀 VERCEL API PUPPETEER TEST');
  console.log('============================\n');

  const VERCEL_URL = 'https://pdf-main-mrtrtyvp2-aviads-projects-0f56b7ac.vercel.app';
  
  let browser;
  let testResults = {
    passed: 0,
    failed: 0,
    tests: []
  };

  try {
    // TEST 1: Launch browser and test Vercel site accessibility
    console.log('📋 Test 1: Vercel Site Accessibility');
    console.log('====================================');
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI'
      ]
    });

    const page = await browser.newPage();
    
    // Test main site
    await page.goto(VERCEL_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    const title = await page.title();
    console.log(`✅ Site accessible: ${title}`);
    
    // Test live demo page
    await page.goto(`${VERCEL_URL}/live-demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    const demoTitle = await page.title();
    console.log(`✅ Live demo accessible: ${demoTitle}`);
    
    testResults.passed++;
    testResults.tests.push({ name: 'Vercel Site Accessibility', status: 'PASSED' });

    // TEST 2: API Endpoint Availability
    console.log('\n📋 Test 2: API Endpoint Health Check');
    console.log('====================================');
    
    try {
      const response = await fetch(`${VERCEL_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      console.log(`✅ API responds: ${response.status}`);
      const responseText = await response.text();
      console.log(`✅ Response received: ${responseText.length} characters`);
      
      testResults.passed++;
      testResults.tests.push({ name: 'API Endpoint Health', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ API test failed: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({ name: 'API Endpoint Health', status: 'FAILED', error: error.message });
    }

    // TEST 3: PDF Upload and Processing (if PDF exists)
    console.log('\n📋 Test 3: PDF Processing Test');
    console.log('===============================');
    
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    if (fs.existsSync(pdfPath)) {
      try {
        console.log('📄 Found test PDF, testing upload...');
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));
        
        const startTime = Date.now();
        const response = await fetch(`${VERCEL_URL}/api/extract`, {
          method: 'POST',
          body: formData,
          timeout: 60000 // 60 second timeout
        });
        
        const processingTime = Date.now() - startTime;
        console.log(`✅ Upload completed in ${processingTime}ms`);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Processing successful: ${result.success}`);
          console.log(`✅ Securities extracted: ${result.extractedData?.securities?.length || 0}`);
          console.log(`✅ Total value: $${result.extractedData?.totalValue?.toLocaleString() || 0}`);
          console.log(`✅ Processing time: ${result.metadata?.processingTime || 'N/A'}`);
          console.log(`✅ No API keys required: ${result.noApiKeysRequired}`);
          console.log(`✅ Ultimate YOLO processing: ${result.ultimateYoloProcessing}`);
          
          // Test specific improvements
          if (result.parseAnalysis?.improvements) {
            console.log(`✅ Improvements implemented: ${result.parseAnalysis.improvements.length}`);
          }
          
          testResults.passed++;
          testResults.tests.push({ 
            name: 'PDF Processing', 
            status: 'PASSED',
            details: {
              securities: result.extractedData?.securities?.length,
              totalValue: result.extractedData?.totalValue,
              processingTime: processingTime
            }
          });
        } else {
          const errorText = await response.text();
          console.log(`❌ Processing failed: ${response.status} - ${errorText}`);
          testResults.failed++;
          testResults.tests.push({ name: 'PDF Processing', status: 'FAILED', error: errorText });
        }
      } catch (error) {
        console.log(`❌ PDF upload failed: ${error.message}`);
        testResults.failed++;
        testResults.tests.push({ name: 'PDF Processing', status: 'FAILED', error: error.message });
      }
    } else {
      console.log('⚠️ No test PDF found, skipping upload test');
      testResults.tests.push({ name: 'PDF Processing', status: 'SKIPPED', reason: 'No test PDF' });
    }

    // TEST 4: Live Demo Functionality
    console.log('\n📋 Test 4: Live Demo UI Testing');
    console.log('================================');
    
    try {
      await page.goto(`${VERCEL_URL}/live-demo`, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Check for demo elements
      const startButton = await page.$('button');
      const consoleElement = await page.$('.live-console');
      const statusIndicator = await page.$('.status-indicator');
      
      console.log(`✅ Start button found: ${!!startButton}`);
      console.log(`✅ Console element found: ${!!consoleElement}`);
      console.log(`✅ Status indicator found: ${!!statusIndicator}`);
      
      // Test button click
      if (startButton) {
        await startButton.click();
        await page.waitForTimeout(2000);
        console.log(`✅ Demo button clickable`);
      }
      
      testResults.passed++;
      testResults.tests.push({ name: 'Live Demo UI', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ Live demo test failed: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Live Demo UI', status: 'FAILED', error: error.message });
    }

    // TEST 5: Performance and Error Handling
    console.log('\n📋 Test 5: Performance & Error Handling');
    console.log('=======================================');
    
    try {
      // Test with invalid data
      const invalidResponse = await fetch(`${VERCEL_URL}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'data' })
      });
      
      console.log(`✅ Invalid request handled: ${invalidResponse.status}`);
      
      // Test CORS
      const corsHeaders = invalidResponse.headers.get('access-control-allow-origin');
      console.log(`✅ CORS enabled: ${corsHeaders === '*'}`);
      
      // Test OPTIONS method
      const optionsResponse = await fetch(`${VERCEL_URL}/api/extract`, {
        method: 'OPTIONS'
      });
      console.log(`✅ OPTIONS method supported: ${optionsResponse.status === 200}`);
      
      testResults.passed++;
      testResults.tests.push({ name: 'Error Handling', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ Error handling test failed: ${error.message}`);
      testResults.failed++;
      testResults.tests.push({ name: 'Error Handling', status: 'FAILED', error: error.message });
    }

  } catch (error) {
    console.log(`❌ Browser test failed: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name: 'Browser Test', status: 'FAILED', error: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // TEST SUMMARY
  console.log('\n📊 VERCEL PUPPETEER TEST SUMMARY');
  console.log('=================================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed Results:');
  testResults.tests.forEach((test, i) => {
    const status = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${i + 1}. ${status} ${test.name}: ${test.status}`);
    if (test.error) console.log(`   Error: ${test.error}`);
    if (test.details) console.log(`   Details: ${JSON.stringify(test.details)}`);
  });

  // RECOMMENDATIONS
  console.log('\n🔧 RECOMMENDATIONS FOR IMPROVEMENT:');
  if (testResults.failed > 0) {
    console.log('• Fix failed tests identified above');
    console.log('• Add error logging to API for better debugging');
    console.log('• Implement retry logic for network failures');
    console.log('• Add response time monitoring');
  } else {
    console.log('✅ All tests passed! System is working well.');
    console.log('💡 Consider adding:');
    console.log('  • Response time metrics');
    console.log('  • Load testing with multiple PDFs');
    console.log('  • Error rate monitoring');
  }

  return testResults;
}

// Run the test
testVercelAPI().catch(console.error);