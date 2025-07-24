// 🧪 COMPREHENSIVE TEST WITH MESSOS PDF USING PUPPETEER AND PLAYWRIGHT
// This will test the PDF processor with the actual Messos PDF and debug issues
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testWithMessosPDF() {
  console.log('🧪 COMPREHENSIVE TEST WITH MESSOS PDF');
  console.log('=====================================');
  
  let browser;
  
  try {
    // Step 1: Launch browser
    console.log('🚀 Step 1: Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      devtools: true   // Open DevTools
    });
    
    const page = await browser.newPage();
    
    // Step 2: Load the test page
    console.log('📄 Step 2: Loading test page...');
    await page.goto('http://localhost:3008/ultimate-test.html');
    
    // Step 3: Load the Messos PDF
    console.log('📄 Step 3: Loading Messos PDF...');
    const messosPdfPath = path.join(__dirname, '2. Messos - 31.03.2025.pdf');
    
    if (!fs.existsSync(messosPdfPath)) {
      console.error('❌ Messos PDF not found at:', messosPdfPath);
      console.log('📁 Please ensure "2. Messos - 31.03.2025.pdf" is in the project directory');
      return;
    }
    
    console.log('✅ Found Messos PDF at:', messosPdfPath);
    
    // Step 4: Upload the PDF file
    console.log('📤 Step 4: Uploading PDF file...');
    const fileInput = await page.$('#fileInput');
    await fileInput.uploadFile(messosPdfPath);
    
    // Wait for file to be processed
    await page.waitForTimeout(2000);
    
    // Step 5: Click process button
    console.log('⚙️ Step 5: Processing PDF...');
    await page.click('#processBtn');
    
    // Step 6: Wait for processing and capture logs
    console.log('📊 Step 6: Waiting for processing results...');
    await page.waitForTimeout(10000); // Wait 10 seconds for processing
    
    // Step 7: Extract results from the page
    console.log('📋 Step 7: Extracting results...');
    const results = await page.evaluate(() => {
      const logs = Array.from(document.querySelectorAll('.log-entry')).map(el => el.textContent);
      const resultsDiv = document.getElementById('results');
      const resultsText = resultsDiv ? resultsDiv.textContent : 'No results found';
      
      return {
        logs: logs,
        results: resultsText
      };
    });
    
    // Step 8: Analyze results
    console.log('🔍 Step 8: Analyzing results...');
    console.log('\n📊 PROCESSING LOGS:');
    results.logs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    console.log('\n📋 PROCESSING RESULTS:');
    console.log(results.results);
    
    // Step 9: Check server logs
    console.log('\n🖥️  Step 9: Checking server logs...');
    console.log('(Server logs should appear in the terminal where you started the server)');
    
    // Step 10: Analyze extracted text file
    console.log('\n📄 Step 10: Analyzing extracted text file...');
    const extractedTextPath = path.join(__dirname, 'ultimate-extracted.txt');
    if (fs.existsSync(extractedTextPath)) {
      const extractedText = fs.readFileSync(extractedTextPath, 'utf8');
      console.log(`✅ Extracted text file size: ${extractedText.length} characters`);
      
      // Count key patterns
      const isinMatches = extractedText.match(/ISIN:\s*[A-Z]{2}[A-Z0-9]{10}/g) || [];
      const swissValueMatches = extractedText.match(/\d{1,3}(?:'\d{3})+/g) || [];
      const torontoMatches = extractedText.match(/199'080/g) || [];
      const canadianMatches = extractedText.match(/200'288/g) || [];
      
      console.log(`📊 Pattern Analysis:`);
      console.log(`   - ISINs found: ${isinMatches.length}`);
      console.log(`   - Swiss values found: ${swissValueMatches.length}`);
      console.log(`   - Toronto value (199'080): ${torontoMatches.length} matches`);
      console.log(`   - Canadian value (200'288): ${canadianMatches.length} matches`);
      
      // Show first few ISINs and values
      console.log(`\n🔍 First 5 ISINs:`);
      isinMatches.slice(0, 5).forEach((isin, i) => {
        console.log(`   ${i + 1}. ${isin}`);
      });
      
      console.log(`\n💰 First 10 Swiss values:`);
      swissValueMatches.slice(0, 10).forEach((value, i) => {
        const numeric = parseInt(value.replace(/'/g, ''));
        console.log(`   ${i + 1}. ${value} → $${numeric.toLocaleString()}`);
      });
      
    } else {
      console.log('❌ Extracted text file not found');
    }
    
    // Step 11: Keep browser open for manual inspection
    console.log('\n🔍 Step 11: Browser left open for manual inspection');
    console.log('You can now manually inspect the results in the browser');
    console.log('Press any key to close the browser...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testWithMessosPDF().catch(console.error);