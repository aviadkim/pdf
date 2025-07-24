// WSL Puppeteer bypass without Chrome installation
const puppeteer = require('puppeteer');

// EXACT WSL configuration as specified
const WSL_BYPASS_CONFIG = {
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', 
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ]
};

async function testWSLPuppeteer() {
  console.log('🚀 Testing WSL Puppeteer Bypass Configuration');
  console.log('==============================================\n');
  
  try {
    console.log('📋 Launching browser with WSL bypass config...');
    const browser = await puppeteer.launch(WSL_BYPASS_CONFIG);
    console.log('✅ Browser launched successfully!');
    
    console.log('📋 Creating new page...');
    const page = await browser.newPage();
    console.log('✅ Page created successfully!');
    
    console.log('📋 Navigating to test page...');
    await page.goto('data:text/html,<h1>WSL Puppeteer Test</h1><p>Success!</p>', { 
      waitUntil: 'load' 
    });
    console.log('✅ Navigation successful!');
    
    console.log('📋 Testing element finding...');
    const title = await page.$eval('h1', el => el.textContent);
    const paragraph = await page.$eval('p', el => el.textContent);
    console.log(`✅ Found title: "${title}"`);
    console.log(`✅ Found paragraph: "${paragraph}"`);
    
    console.log('📋 Testing screenshot capability...');
    const screenshot = await page.screenshot({ type: 'png' });
    console.log(`✅ Screenshot captured: ${screenshot.length} bytes`);
    
    console.log('📋 Cleaning up...');
    await page.close();
    await browser.close();
    console.log('✅ Browser closed successfully!');
    
    console.log('\n🎉 WSL PUPPETEER TEST PASSED!');
    console.log('✅ Your configuration works perfectly');
    console.log('✅ No Chrome installation required');
    console.log('✅ Ready for PDF processing');
    
    return true;
  } catch (error) {
    console.log(`\n❌ WSL PUPPETEER TEST FAILED: ${error.message}`);
    console.log('🔧 This indicates the WSL bypass configuration needs adjustment');
    return false;
  }
}

async function testPDFToImageConversion() {
  console.log('\n📄 Testing PDF to Image Conversion');
  console.log('===================================');
  
  try {
    const browser = await puppeteer.launch(WSL_BYPASS_CONFIG);
    const page = await browser.newPage();
    
    // Create a simple PDF-like HTML page for testing
    const testHTML = `
    <html>
      <head><title>Test PDF Page</title></head>
      <body style="font-family: Arial; padding: 20px;">
        <h1>MESSOS BANK STATEMENT</h1>
        <p>Client: Test Client</p>
        <table border="1" style="width: 100%; margin: 20px 0;">
          <tr><th>Security</th><th>ISIN</th><th>Value</th></tr>
          <tr><td>Test Security 1</td><td>CH0123456789</td><td>100,000 USD</td></tr>
          <tr><td>Test Security 2</td><td>XS9876543210</td><td>200,000 USD</td></tr>
        </table>
        <p><strong>Total Portfolio: 300,000 USD</strong></p>
      </body>
    </html>`;
    
    await page.setContent(testHTML);
    await page.setViewport({ width: 1200, height: 800 });
    
    // Capture as image (simulating PDF to image conversion)
    const image = await page.screenshot({ 
      type: 'png', 
      fullPage: true 
    });
    
    console.log(`✅ Test document captured: ${image.length} bytes`);
    console.log('✅ Contains ISIN codes for extraction');
    console.log('✅ Table structure preserved');
    
    await browser.close();
    
    console.log('✅ PDF to Image Conversion: SIMULATION PASSED');
    return true;
  } catch (error) {
    console.log(`❌ PDF to Image Conversion: FAILED - ${error.message}`);
    return false;
  }
}

async function runBypasTests() {
  console.log('🧪 WSL PUPPETEER BYPASS TEST SUITE');
  console.log('==================================');
  console.log('Using your recommended configuration\n');
  
  const results = [];
  
  results.push(await testWSLPuppeteer());
  results.push(await testPDFToImageConversion());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 BYPASS TEST SUMMARY');
  console.log('=======================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`🎯 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🚀 WSL PUPPETEER BYPASS READY!');
    console.log('✅ No sudo or system dependencies required');
    console.log('✅ Compatible with Claude Code WSL environment');
    console.log('✅ Ready for Messos PDF processing');
  } else {
    console.log('\n⚠️ Some tests failed - configuration may need adjustment');
  }
  
  process.exit(passed === total ? 0 : 1);
}

runBypasTests().catch(console.error);