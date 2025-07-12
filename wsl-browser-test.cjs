// WSL-compatible browser automation for PDF testing
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function setupWSLBrowserTesting() {
  console.log('🌐 Setting up WSL-Compatible Browser Testing');
  
  try {
    // Method 1: Try using Chrome in WSL with headless mode
    console.log('\n🔧 Method 1: Chrome Headless in WSL');
    try {
      const chromeCheck = await execAsync('google-chrome --version');
      console.log('✅ Chrome found:', chromeCheck.stdout.trim());
      
      // Test Chrome headless
      await testWithChromeHeadless();
      
    } catch (chromeError) {
      console.log('❌ Chrome not available in WSL');
      
      // Method 2: Try Firefox
      console.log('\n🔧 Method 2: Firefox Headless in WSL');
      try {
        const firefoxCheck = await execAsync('firefox --version');
        console.log('✅ Firefox found:', firefoxCheck.stdout.trim());
        
        await testWithFirefoxHeadless();
        
      } catch (firefoxError) {
        console.log('❌ Firefox not available in WSL');
        
        // Method 3: Use Windows Chrome via WSL
        console.log('\n🔧 Method 3: Windows Chrome via WSL');
        await testWithWindowsChrome();
      }
    }
    
  } catch (error) {
    console.error('❌ Browser setup failed:', error);
  }
}

async function testWithChromeHeadless() {
  console.log('🚀 Testing with Chrome Headless');
  
  try {
    // Create a test script
    const testScript = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.goto('https://pdf-five-nu.vercel.app/api/family-office-upload');
        
        const title = await page.title();
        console.log('Page title:', title);
        
        // Take screenshot
        await page.screenshot({ path: 'wsl-test-screenshot.png' });
        console.log('Screenshot saved');
        
        await browser.close();
      })();
    `;
    
    fs.writeFileSync('temp-browser-test.js', testScript);
    
    // Install puppeteer if not available
    try {
      await execAsync('npm list puppeteer');
      console.log('✅ Puppeteer already installed');
    } catch {
      console.log('📦 Installing Puppeteer...');
      await execAsync('npm install puppeteer');
    }
    
    // Run the test
    const result = await execAsync('node temp-browser-test.js');
    console.log('✅ Chrome headless test result:', result.stdout);
    
    // Clean up
    fs.unlinkSync('temp-browser-test.js');
    
  } catch (error) {
    console.log('❌ Chrome headless failed:', error.message);
  }
}

async function testWithFirefoxHeadless() {
  console.log('🦊 Testing with Firefox Headless');
  
  try {
    // Create Firefox test script
    const testScript = `
      const puppeteer = require('puppeteer');
      
      (async () => {
        const browser = await puppeteer.launch({
          product: 'firefox',
          headless: true
        });
        
        const page = await browser.newPage();
        await page.goto('https://pdf-five-nu.vercel.app/api/family-office-upload');
        
        const title = await page.title();
        console.log('Page title:', title);
        
        await page.screenshot({ path: 'firefox-test-screenshot.png' });
        console.log('Screenshot saved');
        
        await browser.close();
      })();
    `;
    
    fs.writeFileSync('temp-firefox-test.js', testScript);
    
    const result = await execAsync('node temp-firefox-test.js');
    console.log('✅ Firefox headless test result:', result.stdout);
    
    fs.unlinkSync('temp-firefox-test.js');
    
  } catch (error) {
    console.log('❌ Firefox headless failed:', error.message);
  }
}

async function testWithWindowsChrome() {
  console.log('🪟 Testing with Windows Chrome via WSL');
  
  try {
    // Use Windows Chrome executable
    const windowsChromePath = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe';
    
    // Check if Windows Chrome exists
    if (fs.existsSync(windowsChromePath)) {
      console.log('✅ Windows Chrome found');
      
      // Create test script for Windows Chrome
      const testScript = `
        const puppeteer = require('puppeteer');
        
        (async () => {
          const browser = await puppeteer.launch({
            headless: true,
            executablePath: '${windowsChromePath}',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
          
          const page = await browser.newPage();
          await page.goto('https://pdf-five-nu.vercel.app/api/family-office-upload');
          
          const title = await page.title();
          console.log('Page title:', title);
          
          await page.screenshot({ path: 'windows-chrome-test.png' });
          console.log('Screenshot saved');
          
          await browser.close();
        })();
      `;
      
      fs.writeFileSync('temp-windows-chrome-test.js', testScript);
      
      const result = await execAsync('node temp-windows-chrome-test.js');
      console.log('✅ Windows Chrome test result:', result.stdout);
      
      fs.unlinkSync('temp-windows-chrome-test.js');
      
    } else {
      console.log('❌ Windows Chrome not found');
    }
    
  } catch (error) {
    console.log('❌ Windows Chrome failed:', error.message);
  }
}

async function testPDFValueExtraction() {
  console.log('\n📄 Testing PDF Value Extraction');
  
  try {
    // Load and analyze the PDF directly
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
    
    // Use pdftotext if available to extract raw text
    try {
      const pdfText = await execAsync(`pdftotext "${pdfPath}" -`);
      console.log('📊 PDF text extracted');
      
      // Look for total portfolio value indicators
      const lines = pdfText.stdout.split('\n');
      const totalLines = lines.filter(line => 
        line.includes('Total') || 
        line.includes('USD') || 
        line.includes('CHF') ||
        line.match(/\d{1,3}[',]\d{3}[',]\d{3}/)
      );
      
      console.log('\n💰 Lines with potential total values:');
      totalLines.slice(0, 10).forEach((line, i) => {
        console.log(`  ${i+1}. ${line.trim()}`);
      });
      
      // Look for the real total
      const possibleTotals = lines.filter(line => 
        line.includes('Total') && 
        line.match(/\d{1,3}[',]\d{3}[',]\d{3}/)
      );
      
      console.log('\n🎯 Possible total values:');
      possibleTotals.forEach((line, i) => {
        console.log(`  ${i+1}. ${line.trim()}`);
      });
      
    } catch (pdfError) {
      console.log('❌ pdftotext not available, installing...');
      try {
        await execAsync('sudo apt-get update && sudo apt-get install -y poppler-utils');
        console.log('✅ pdftotext installed');
      } catch (installError) {
        console.log('❌ Could not install pdftotext');
      }
    }
    
  } catch (error) {
    console.log('❌ PDF analysis failed:', error.message);
  }
}

async function createVisualPDFTest() {
  console.log('\n🖼️ Creating Visual PDF Test');
  
  // Create a comprehensive test that uploads the PDF and captures results
  const testScript = `
// Visual PDF Upload Test
const fs = require('fs');
const path = require('path');

async function visualPDFTest() {
  console.log('📸 Visual PDF Upload Test');
  
  try {
    // Load the PDF
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('📄 PDF loaded for visual test');
    
    // Test the API
    const response = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos  - 31.03.2025.pdf'
      })
    });
    
    const result = await response.json();
    
    console.log('\\n📊 VISUAL TEST RESULTS:');
    console.log('Holdings found:', result.data?.holdings?.length || 0);
    console.log('Total value:', result.data?.portfolioInfo?.totalValue?.toLocaleString() || 'N/A');
    console.log('Processing method:', result.metadata?.extractionMethod);
    
    // Save detailed results
    fs.writeFileSync('visual-test-results.json', JSON.stringify(result, null, 2));
    console.log('✅ Results saved to visual-test-results.json');
    
    // Check if total value is around 46M or 99M
    const totalValue = result.data?.portfolioInfo?.totalValue || 0;
    if (totalValue > 90000000) {
      console.log('⚠️  WARNING: Total value is $' + totalValue.toLocaleString() + ' (seems too high)');
      console.log('Expected: Around $46 million');
    } else if (totalValue > 40000000 && totalValue < 50000000) {
      console.log('✅ Total value looks correct: $' + totalValue.toLocaleString());
    } else {
      console.log('❌ Total value seems incorrect: $' + totalValue.toLocaleString());
    }
    
  } catch (error) {
    console.error('❌ Visual test failed:', error);
  }
}

visualPDFTest();
`;

  fs.writeFileSync('visual-pdf-test.cjs', testScript);
  console.log('✅ Visual PDF test created: visual-pdf-test.cjs');
  
  // Run the visual test
  const result = await execAsync('node visual-pdf-test.cjs');
  console.log('📊 Visual test output:', result.stdout);
}

// Run all tests
async function runAllTests() {
  console.log('🚀 YOLO MODE: Complete Browser & PDF Testing');
  
  await setupWSLBrowserTesting();
  await testPDFValueExtraction();
  await createVisualPDFTest();
  
  console.log('\n🎯 All tests completed. Check the results to verify correct value extraction.');
}

runAllTests().catch(console.error);