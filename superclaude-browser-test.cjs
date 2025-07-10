// SuperClaude MCP Browser Automation - Real Website Testing
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SuperClaudeBrowserTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'https://pdf-five-nu.vercel.app';
    this.errors = [];
    this.testResults = [];
  }

  async initialize() {
    console.log('🚀 SuperClaude Browser Automation Starting...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Show browser so we can see what's happening
      defaultViewport: { width: 1400, height: 900 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Capture console errors and network failures
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`🌐 Browser ${type}:`, text);
      
      if (type === 'error') {
        this.errors.push({ type: 'console', message: text, timestamp: new Date() });
      }
    });

    this.page.on('response', response => {
      if (response.status() >= 400) {
        const error = {
          type: 'network',
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          timestamp: new Date()
        };
        console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
        this.errors.push(error);
      }
    });

    this.page.on('requestfailed', request => {
      const error = {
        type: 'request_failed',
        url: request.url(),
        failure: request.failure()?.errorText,
        timestamp: new Date()
      };
      console.log(`🚫 Request failed: ${request.url()} - ${request.failure()?.errorText}`);
      this.errors.push(error);
    });
  }

  async testUploadInterface() {
    console.log('\n📋 Testing Upload Interface...');
    
    try {
      // Navigate to upload page
      await this.page.goto(this.baseUrl + '/api/upload', { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      
      // Take screenshot
      await this.page.screenshot({ path: 'screenshots/upload-page.png', fullPage: true });
      
      // Check for upload elements
      const uploadArea = await this.page.$('.upload-area');
      const fileInput = await this.page.$('#fileInput');
      const extractBtn = await this.page.$('#extractBtn');
      
      console.log('✅ Upload area found:', !!uploadArea);
      console.log('✅ File input found:', !!fileInput);
      console.log('✅ Extract button found:', !!extractBtn);
      
      // Check for JavaScript errors in page
      const jsErrors = await this.page.evaluate(() => {
        return window.errors || [];
      });
      
      this.testResults.push({
        test: 'upload_interface',
        success: !!(uploadArea && fileInput && extractBtn),
        errors: jsErrors
      });
      
      return !!(uploadArea && fileInput && extractBtn);
      
    } catch (error) {
      console.log('❌ Upload interface test failed:', error.message);
      this.testResults.push({
        test: 'upload_interface',
        success: false,
        error: error.message
      });
      return false;
    }
  }

  async testPDFUpload() {
    console.log('\n📋 Testing PDF Upload Process...');
    
    try {
      // Create a test PDF file
      const testPdfPath = await this.createTestPDF();
      
      // Upload the file
      const fileInput = await this.page.$('#fileInput');
      if (!fileInput) {
        throw new Error('File input not found');
      }
      
      await fileInput.uploadFile(testPdfPath);
      console.log('✅ File uploaded to input');
      
      // Wait for file to be processed by the form
      await this.page.waitForTimeout(2000);
      
      // Check if extract button is enabled
      const extractBtn = await this.page.$('#extractBtn');
      const isDisabled = await this.page.evaluate(btn => btn.disabled, extractBtn);
      
      console.log('✅ Extract button enabled:', !isDisabled);
      
      if (!isDisabled) {
        // Click extract button and monitor network requests
        console.log('🚀 Clicking extract button...');
        
        // Monitor for the API call
        const responsePromise = this.page.waitForResponse(response => 
          response.url().includes('extract') && response.request().method() === 'POST'
        );
        
        await extractBtn.click();
        
        try {
          const response = await responsePromise;
          const status = response.status();
          const responseText = await response.text();
          
          console.log(`📡 API Response: ${status}`);
          console.log(`📄 Response body: ${responseText.substring(0, 200)}...`);
          
          this.testResults.push({
            test: 'pdf_upload',
            success: status === 200,
            status: status,
            response: responseText.substring(0, 500)
          });
          
          // Take screenshot after processing
          await this.page.screenshot({ path: 'screenshots/after-upload.png', fullPage: true });
          
        } catch (responseError) {
          console.log('❌ No response received or timeout');
          this.testResults.push({
            test: 'pdf_upload',
            success: false,
            error: 'No response or timeout'
          });
        }
      }
      
      // Clean up test file
      fs.unlinkSync(testPdfPath);
      
    } catch (error) {
      console.log('❌ PDF upload test failed:', error.message);
      this.testResults.push({
        test: 'pdf_upload',
        success: false,
        error: error.message
      });
    }
  }

  async testAPIEndpointsDirect() {
    console.log('\n📋 Testing API Endpoints Directly...');
    
    const endpoints = [
      '/api/production-ready-extract',
      '/api/enhanced-swiss-extract-fixed',
      '/api/debug-env'
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing ${endpoint}`);
        
        const response = await this.page.evaluate(async (url) => {
          try {
            const response = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                pdfBase64: 'dGVzdA==',
                filename: 'browser-test.pdf'
              })
            });
            
            return {
              status: response.status,
              statusText: response.statusText,
              data: await response.text()
            };
          } catch (error) {
            return {
              error: error.message
            };
          }
        }, this.baseUrl + endpoint);
        
        console.log(`   Status: ${response.status || 'Error'}`);
        console.log(`   Response: ${(response.data || response.error || '').substring(0, 100)}...`);
        
        this.testResults.push({
          test: `api_${endpoint.replace('/api/', '')}`,
          success: response.status === 200,
          status: response.status,
          response: response.data || response.error
        });
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        this.testResults.push({
          test: `api_${endpoint.replace('/api/', '')}`,
          success: false,
          error: error.message
        });
      }
    }
  }

  async createTestPDF() {
    const testPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 100 700 Td(Test PDF for upload)Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000189 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref 285
%%EOF`;
    
    const testPath = path.join(__dirname, 'test-upload.pdf');
    fs.writeFileSync(testPath, testPdfContent);
    return testPath;
  }

  async generateReport() {
    console.log('\n📊 SUPERCLAUDE BROWSER TEST REPORT');
    console.log('='.repeat(50));
    
    console.log('\n🔍 ERRORS DETECTED:');
    if (this.errors.length === 0) {
      console.log('   ✅ No errors detected');
    } else {
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.type}: ${error.message || error.url}`);
        if (error.status) console.log(`      Status: ${error.status}`);
      });
    }
    
    console.log('\n📋 TEST RESULTS:');
    this.testResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.test}: ${result.success ? 'PASSED' : 'FAILED'}`);
      if (result.error) console.log(`      Error: ${result.error}`);
      if (result.status) console.log(`      HTTP Status: ${result.status}`);
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    
    // Analyze specific issues
    const hasConsoleErrors = this.errors.some(e => e.type === 'console');
    const has500Errors = this.errors.some(e => e.status === 500);
    const hasNetworkErrors = this.errors.some(e => e.type === 'network');
    
    if (has500Errors) {
      console.log('   🚨 CRITICAL: 500 server errors detected');
      console.log('      → Check API endpoint implementation');
      console.log('      → Verify environment variables');
      console.log('      → Check server logs for detailed errors');
    }
    
    if (hasConsoleErrors) {
      console.log('   ⚠️ Frontend JavaScript errors detected');
      console.log('      → Check browser console for details');
      console.log('      → Verify API endpoint URLs');
    }
    
    if (hasNetworkErrors) {
      console.log('   🌐 Network connectivity issues');
      console.log('      → Check CORS configuration');
      console.log('      → Verify endpoint availability');
    }
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Fix identified 500 errors');
    console.log('   2. Implement page-splitting PDF approach');
    console.log('   3. Test with real Messos PDF');
    console.log('   4. Validate 40+ holdings extraction');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run comprehensive browser testing
async function runBrowserTests() {
  const tester = new SuperClaudeBrowserTester();
  
  try {
    await tester.initialize();
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // Run all tests
    await tester.testUploadInterface();
    await tester.testPDFUpload();
    await tester.testAPIEndpointsDirect();
    
    // Generate comprehensive report
    await tester.generateReport();
    
  } catch (error) {
    console.error('❌ Browser testing failed:', error);
  } finally {
    await tester.cleanup();
  }
  
  console.log('\n🎉 Browser testing complete!');
  console.log('Check screenshots/ folder for visual evidence');
}

runBrowserTests().catch(console.error);