// 🎭 PLAYWRIGHT TEST WITH MESSOS PDF
// Alternative test using Playwright for better debugging
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function playwrightMessosTest() {
  console.log('🎭 PLAYWRIGHT TEST WITH MESSOS PDF');
  console.log('==================================');
  
  let browser;
  
  try {
    // Step 1: Launch browser
    console.log('🚀 Step 1: Launching Playwright...');
    browser = await chromium.launch({
      headless: false, // Show browser
      devtools: true   // Open DevTools
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Step 2: Load the test page
    console.log('📄 Step 2: Loading test page...');
    await page.goto('http://localhost:3008/ultimate-test.html');
    
    // Step 3: Check if Messos PDF exists
    console.log('📄 Step 3: Checking for Messos PDF...');
    let messosPdfPath = path.join(__dirname, '2. Messos - 31.03.2025.pdf');
    
    if (!fs.existsSync(messosPdfPath)) {
      console.error('❌ Messos PDF not found at:', messosPdfPath);
      console.log('📁 Please ensure "2. Messos - 31.03.2025.pdf" is in the project directory');
      
      // Try alternative locations
      const altPaths = [
        path.join(__dirname, '2. Messos  - 31.03.2025.pdf'), // Extra spaces
        path.join(__dirname, 'Messos - 31.03.2025.pdf'),
        path.join(__dirname, 'messos.pdf'),
        path.join(__dirname, '2.Messos-31.03.2025.pdf')
      ];
      
      for (const altPath of altPaths) {
        if (fs.existsSync(altPath)) {
          console.log(`✅ Found alternative PDF at: ${altPath}`);
          messosPdfPath = altPath;
          break;
        }
      }
      
      if (!fs.existsSync(messosPdfPath)) {
        console.log('📁 Available files in directory:');
        const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.pdf'));
        files.forEach(file => console.log(`   - ${file}`));
        return;
      }
    }
    
    console.log('✅ Found Messos PDF at:', messosPdfPath);
    
    // Step 4: Upload the PDF file
    console.log('📤 Step 4: Uploading PDF file...');
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(messosPdfPath);
    
    // Wait for file to be processed
    await page.waitForTimeout(2000);
    
    // Step 5: Click process button
    console.log('⚙️ Step 5: Processing PDF...');
    await page.click('#processBtn');
    
    // Step 6: Monitor logs in real-time
    console.log('📊 Step 6: Monitoring processing logs...');
    
    // Wait for processing with timeout
    await page.waitForTimeout(15000);
    
    // Step 7: Extract all logs
    console.log('📋 Step 7: Extracting all logs...');
    const logs = await page.locator('.log-entry').allTextContents();
    
    console.log('\n📊 PROCESSING LOGS:');
    logs.forEach((log, index) => {
      console.log(`   ${index + 1}. ${log}`);
    });
    
    // Step 8: Extract results
    console.log('\n📋 Step 8: Extracting results...');
    const resultsDiv = page.locator('#results');
    const resultsVisible = await resultsDiv.isVisible();
    
    if (resultsVisible) {
      const resultsText = await resultsDiv.textContent();
      console.log('\n📊 RESULTS:');
      console.log(resultsText);
    } else {
      console.log('❌ No results div found or not visible');
    }
    
    // Step 9: Check for securities data
    console.log('\n🔍 Step 9: Checking for securities data...');
    const securitiesCards = await page.locator('.security-item').count();
    console.log(`Found ${securitiesCards} security cards`);
    
    if (securitiesCards > 0) {
      const securitiesData = await page.locator('.security-item').allTextContents();
      console.log('\n💰 SECURITIES DATA:');
      securitiesData.slice(0, 10).forEach((security, index) => {
        console.log(`   ${index + 1}. ${security}`);
      });
    }
    
    // Step 10: Analyze extracted text
    console.log('\n📄 Step 10: Analyzing extracted text...');
    const extractedTextPath = path.join(__dirname, 'ultimate-extracted.txt');
    if (fs.existsSync(extractedTextPath)) {
      const extractedText = fs.readFileSync(extractedTextPath, 'utf8');
      console.log(`✅ Extracted text file size: ${extractedText.length} characters`);
      
      // Detailed analysis
      const lines = extractedText.split('\n');
      console.log(`📊 Total lines: ${lines.length}`);
      
      // Find ISINs and their line numbers
      const isinLines = [];
      const valueLines = [];
      
      lines.forEach((line, index) => {
        if (line.includes('ISIN:')) {
          isinLines.push({ line: index + 1, content: line.trim() });
        }
        if (line.match(/\d{1,3}(?:'\d{3})+/)) {
          const matches = line.match(/\d{1,3}(?:'\d{3})+/g);
          matches.forEach(match => {
            valueLines.push({ line: index + 1, value: match, content: line.trim() });
          });
        }
      });
      
      console.log(`\n🔍 DETAILED ANALYSIS:`);
      console.log(`   - ISINs found: ${isinLines.length}`);
      console.log(`   - Swiss values found: ${valueLines.length}`);
      
      // Show ISIN-value proximity
      console.log(`\n📊 ISIN-VALUE PROXIMITY ANALYSIS:`);
      isinLines.forEach(isinData => {
        const nearbyValues = valueLines.filter(valueData => 
          Math.abs(valueData.line - isinData.line) <= 10
        );
        console.log(`   ISIN at line ${isinData.line}: ${isinData.content}`);
        nearbyValues.forEach(valueData => {
          const distance = Math.abs(valueData.line - isinData.line);
          console.log(`     Value at line ${valueData.line} (distance: ${distance}): ${valueData.value}`);
        });
        console.log('');
      });
      
    } else {
      console.log('❌ Extracted text file not found');
    }
    
    // Step 11: Take screenshot for debugging
    console.log('\n📸 Step 11: Taking screenshot...');
    await page.screenshot({ path: 'messos-test-screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved as messos-test-screenshot.png');
    
    // Step 12: Keep browser open
    console.log('\n🔍 Step 12: Browser left open for manual inspection');
    console.log('You can now manually inspect the results in the browser');
    console.log('Press any key to close the browser...');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
  } catch (error) {
    console.error('❌ Playwright test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
playwrightMessosTest().catch(console.error);