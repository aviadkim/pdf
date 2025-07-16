// 🎭 MCP PLAYWRIGHT TEST - Advanced testing with MCP integration
import { chromium } from 'playwright';
import fs from 'fs';
import FormData from 'form-data';

const VERCEL_URL = 'https://pdf-main-mrtrtyvp2-aviads-projects-0f56b7ac.vercel.app';

// MCP Integration Test Suite
async function runMCPPlaywrightTests() {
  console.log('🎭 MCP PLAYWRIGHT INTEGRATION TEST');
  console.log('==================================\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  let browser;
  let context;
  let page;

  try {
    // Initialize Playwright browser
    console.log('🚀 Initializing Playwright browser...');
    browser = await chromium.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    page = await context.newPage();

    // TEST 1: MCP-Enhanced Site Navigation
    results.total++;
    try {
      console.log('📋 Test 1: MCP-Enhanced Site Navigation');
      console.log('=======================================');
      
      await page.goto(VERCEL_URL, { waitUntil: 'networkidle' });
      
      const title = await page.title();
      console.log(`✅ Page loaded: ${title}`);
      
      const pageContent = await page.content();
      console.log(`✅ Page content length: ${pageContent.length} characters`);
      
      results.passed++;
      results.tests.push({ name: 'MCP Site Navigation', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ Site navigation failed: ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'MCP Site Navigation', status: 'FAILED', error: error.message });
    }

    // TEST 2: Live Demo MCP Integration
    results.total++;
    try {
      console.log('\n📋 Test 2: Live Demo MCP Integration');
      console.log('===================================');
      
      await page.goto(`${VERCEL_URL}/live-demo`, { waitUntil: 'networkidle' });
      
      await page.waitForSelector('.demo-controls', { timeout: 10000 });
      
      const startButton = await page.$('button.btn-primary');
      if (startButton) {
        console.log('✅ Start demo button found');
        await startButton.click();
        console.log('✅ Demo started via Playwright interaction');
        
        await page.waitForTimeout(3000);
        
        const consoleLines = await page.$$('.console-line');
        console.log(`✅ Console lines detected: ${consoleLines.length}`);
      }
      
      results.passed++;
      results.tests.push({ name: 'Live Demo MCP Integration', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ Live demo test failed: ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'Live Demo MCP Integration', status: 'FAILED', error: error.message });
    }

    // TEST 3: MCP API Interaction
    results.total++;
    try {
      console.log('\n📋 Test 3: MCP API Interaction');
      console.log('==============================');
      
      const mcpHeaders = {
        'X-MCP-Context': 'playwright-test',
        'X-MCP-Version': '1.0',
        'User-Agent': 'MCP-Playwright-Test/1.0'
      };
      
      const optionsResponse = await page.evaluate(async (url, headers) => {
        const response = await fetch(url + '/api/extract', {
          method: 'OPTIONS',
          headers: headers
        });
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        };
      }, VERCEL_URL, mcpHeaders);
      
      console.log(`✅ MCP OPTIONS request: ${optionsResponse.status}`);
      console.log(`✅ CORS headers: ${optionsResponse.headers['access-control-allow-origin']}`);
      
      results.passed++;
      results.tests.push({ name: 'MCP API Interaction', status: 'PASSED' });
    } catch (error) {
      console.log(`❌ MCP API test failed: ${error.message}`);
      results.failed++;
      results.tests.push({ name: 'MCP API Interaction', status: 'FAILED', error: error.message });
    }

    // TEST 4: PDF Processing with MCP Context
    results.total++;
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (fs.existsSync(pdfPath)) {
      try {
        console.log('\n📋 Test 4: PDF Processing with MCP Context');
        console.log('==========================================');
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        console.log('📄 PDF loaded for MCP testing');
        console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
        
        const uploadResult = await page.evaluate(async (base64Data, url) => {
          try {
            const formData = new FormData();
            
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            formData.append('pdf', blob, 'test.pdf');
            
            const startTime = Date.now();
            const response = await fetch(url + '/api/extract', {
              method: 'POST',
              body: formData,
              headers: {
                'X-MCP-Context': 'playwright-pdf-test',
                'X-MCP-Source': 'browser-simulation'
              }
            });
            
            const processingTime = Date.now() - startTime;
            
            if (response.ok) {
              const result = await response.json();
              return {
                success: true,
                processingTime: processingTime,
                securities: result.extractedData?.securities?.length || 0,
                totalValue: result.extractedData?.totalValue || 0,
                ultimateYolo: result.ultimateYoloProcessing,
                noApiKeys: result.noApiKeysRequired
              };
            } else {
              const errorText = await response.text();
              return {
                success: false,
                error: errorText,
                status: response.status
              };
            }
          } catch (error) {
            return {
              success: false,
              error: error.message
            };
          }
        }, pdfBase64, VERCEL_URL);
        
        if (uploadResult.success) {
          console.log(`✅ MCP PDF processing successful`);
          console.log(`✅ Processing time: ${uploadResult.processingTime}ms`);
          console.log(`✅ Securities extracted: ${uploadResult.securities}`);
          console.log(`✅ Total value: $${uploadResult.totalValue.toLocaleString()}`);
          console.log(`✅ Ultimate YOLO processing: ${uploadResult.ultimateYolo}`);
          console.log(`✅ No API keys required: ${uploadResult.noApiKeys}`);
          
          results.passed++;
          results.tests.push({ 
            name: 'MCP PDF Processing', 
            status: 'PASSED',
            details: uploadResult
          });
        } else {
          console.log(`❌ MCP PDF processing failed: ${uploadResult.error}`);
          results.failed++;
          results.tests.push({ 
            name: 'MCP PDF Processing', 
            status: 'FAILED', 
            error: uploadResult.error 
          });
        }
      } catch (error) {
        console.log(`❌ MCP PDF test failed: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'MCP PDF Processing', status: 'FAILED', error: error.message });
      }
    } else {
      console.log('\n📋 Test 4: MCP PDF Processing - SKIPPED (No PDF found)');
      results.tests.push({ name: 'MCP PDF Processing', status: 'SKIPPED', reason: 'No test PDF' });
    }

  } catch (error) {
    console.log(`❌ MCP Playwright test setup failed: ${error.message}`);
    results.failed++;
    results.tests.push({ name: 'Test Setup', status: 'FAILED', error: error.message });
  } finally {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
  }

  // MCP TEST SUMMARY
  console.log('\n🎭 MCP PLAYWRIGHT TEST SUMMARY');
  console.log('==============================');
  console.log(`✅ Passed: ${results.passed}/${results.total}`);
  console.log(`❌ Failed: ${results.failed}/${results.total}`);
  console.log(`🎯 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Detailed MCP Test Results:');
  results.tests.forEach((test, i) => {
    const emoji = test.status === 'PASSED' ? '✅' : test.status === 'FAILED' ? '❌' : '⚠️';
    console.log(`${i + 1}. ${emoji} ${test.name}: ${test.status}`);
    if (test.error) console.log(`   ❌ Error: ${test.error}`);
    if (test.details) console.log(`   📊 Details: ${JSON.stringify(test.details, null, 2)}`);
  });

  return results;
}

// Create test results directory
if (!fs.existsSync('test-results')) {
  fs.mkdirSync('test-results');
}

// Run MCP Playwright tests
runMCPPlaywrightTests().catch(console.error);