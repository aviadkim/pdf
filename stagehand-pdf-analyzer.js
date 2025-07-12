// 🔍 STAGEHAND PDF ANALYZER - Browser-based debugging
const { Stagehand } = require('./stagehand');
const fs = require('fs');
const path = require('path');

async function analyzeMessosPDFWithBrowser() {
  console.log('🔍 STAGEHAND PDF ANALYZER - Browser-based Debugging');
  console.log('=' * 60);
  
  const stagehand = new Stagehand({
    headless: false, // Show browser window
    devtools: true,  // Enable devtools
  });
  
  try {
    await stagehand.init();
    
    console.log('🌐 Opening website...');
    await stagehand.page.goto('https://pdf-five-nu.vercel.app/api/family-office-upload');
    
    // Wait for page to load
    await stagehand.page.waitForTimeout(3000);
    
    console.log('📄 Loading PDF file...');
    const pdfPath = path.resolve('2. Messos  - 31.03.2025.pdf');
    
    // Find file input and upload PDF
    const fileInput = await stagehand.page.locator('input[type="file"]');
    await fileInput.setInputFiles(pdfPath);
    
    console.log('⏳ Waiting for processing...');
    await stagehand.page.waitForTimeout(2000);
    
    // Click upload/process button if needed
    const uploadButton = await stagehand.page.locator('button:has-text("Upload")').first();
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      console.log('🚀 Upload initiated...');
    }
    
    // Wait for results (up to 30 seconds)
    console.log('⏳ Waiting for extraction results...');
    await stagehand.page.waitForTimeout(30000);
    
    // Capture all visible data
    console.log('📊 Capturing extraction results...');
    
    // Get all text content
    const allText = await stagehand.page.locator('body').textContent();
    
    // Look for results table
    const resultsTable = await stagehand.page.locator('table, .results, #results').first();
    let tableData = '';
    if (await resultsTable.isVisible()) {
      tableData = await resultsTable.textContent();
    }
    
    // Get any JSON data that might be displayed
    const jsonElements = await stagehand.page.locator('pre, code, .json').all();
    let jsonData = '';
    for (const elem of jsonElements) {
      const text = await elem.textContent();
      jsonData += text + '\n';
    }
    
    // Take screenshot
    await stagehand.page.screenshot({ path: 'messos-extraction-screenshot.png', fullPage: true });
    
    // Extract processing status
    const statusElements = await stagehand.page.locator('.status, #status, .processing, #processing').all();
    let statusInfo = '';
    for (const elem of statusElements) {
      const text = await elem.textContent();
      statusInfo += text + '\n';
    }
    
    // Look for specific value patterns
    const valuePatterns = {
      totalValue: null,
      holdingsCount: null,
      processingTime: null,
      confidence: null
    };
    
    // Extract values using regex
    const totalValueMatch = allText.match(/Total Value[:\s]*\$?([\d,]+\.?\d*)/i);
    if (totalValueMatch) valuePatterns.totalValue = totalValueMatch[1];
    
    const holdingsMatch = allText.match(/(\d+)\s*Holdings? Found/i);
    if (holdingsMatch) valuePatterns.holdingsCount = holdingsMatch[1];
    
    const timeMatch = allText.match(/Processing Time[:\s]*(\d+\.?\d*\s*[ms]+)/i);
    if (timeMatch) valuePatterns.processingTime = timeMatch[1];
    
    const confidenceMatch = allText.match(/Confidence[:\s]*(\d+\.?\d*%?)/i);
    if (confidenceMatch) valuePatterns.confidence = confidenceMatch[1];
    
    // Save analysis results
    const analysis = {
      timestamp: new Date().toISOString(),
      websiteUrl: 'https://pdf-five-nu.vercel.app/api/family-office-upload',
      pdfFile: '2. Messos  - 31.03.2025.pdf',
      expectedTotal: 19464431,
      extraction: {
        allText: allText.substring(0, 5000), // First 5000 characters
        tableData: tableData,
        jsonData: jsonData,
        statusInfo: statusInfo,
        valuePatterns: valuePatterns
      },
      screenshots: ['messos-extraction-screenshot.png']
    };
    
    fs.writeFileSync('stagehand-analysis.json', JSON.stringify(analysis, null, 2));
    
    console.log('\n📊 BROWSER ANALYSIS RESULTS:');
    console.log(`💰 Total Value Found: $${valuePatterns.totalValue || 'Not detected'}`);
    console.log(`📊 Holdings Count: ${valuePatterns.holdingsCount || 'Not detected'}`);
    console.log(`⏱️ Processing Time: ${valuePatterns.processingTime || 'Not detected'}`);
    console.log(`🎯 Confidence: ${valuePatterns.confidence || 'Not detected'}`);
    
    // Compare with expected
    if (valuePatterns.totalValue) {
      const extractedValue = parseFloat(valuePatterns.totalValue.replace(/,/g, ''));
      const accuracy = (extractedValue / 19464431) * 100;
      console.log(`📈 Accuracy: ${accuracy.toFixed(1)}%`);
      
      if (accuracy < 50) {
        console.log('❌ CRITICAL: Extraction accuracy very low');
        console.log('🔍 ISSUE: Need to analyze PDF structure directly');
      } else if (accuracy < 90) {
        console.log('⚠️ WARNING: Extraction needs improvement');
      } else {
        console.log('✅ GOOD: Extraction accuracy acceptable');
      }
    }
    
    console.log('\n💾 Analysis saved to stagehand-analysis.json');
    console.log('📸 Screenshot saved to messos-extraction-screenshot.png');
    
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser window kept open for manual inspection...');
    console.log('Press Enter to close browser and continue analysis');
    
    // Wait for user input
    await new Promise(resolve => {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      readline.question('Press Enter to continue...', () => {
        readline.close();
        resolve();
      });
    });
    
  } catch (error) {
    console.error('❌ Browser analysis failed:', error);
  } finally {
    await stagehand.close();
  }
}

// Also create a PDF structure analyzer
async function analyzePDFStructureDirectly() {
  console.log('\n🔍 DIRECT PDF STRUCTURE ANALYSIS');
  
  const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
  
  // Basic analysis
  console.log(`📄 PDF Size: ${pdfBuffer.length} bytes`);
  
  // Look for text patterns in raw PDF
  const pdfText = pdfBuffer.toString('utf8', 0, 50000); // First 50KB as text
  
  // Search for key patterns
  const patterns = {
    currencyAmounts: pdfText.match(/\d{1,3}[',]\d{3}[',]?\d{0,3}\.?\d{0,2}/g) || [],
    isinCodes: pdfText.match(/[A-Z]{2}[A-Z0-9]{10}/g) || [],
    percentages: pdfText.match(/\d+\.?\d*%/g) || [],
    dates: pdfText.match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/g) || []
  };
  
  console.log('\n📊 PATTERNS FOUND IN RAW PDF:');
  console.log(`💰 Currency amounts: ${patterns.currencyAmounts.length}`);
  console.log(`🆔 ISIN codes: ${patterns.isinCodes.length}`);
  console.log(`📊 Percentages: ${patterns.percentages.length}`);
  console.log(`📅 Dates: ${patterns.dates.length}`);
  
  if (patterns.currencyAmounts.length > 0) {
    console.log('\n💰 Sample currency amounts found:');
    patterns.currencyAmounts.slice(0, 20).forEach((amount, i) => {
      console.log(`  ${i+1}. ${amount}`);
    });
  }
  
  // Look for the target value
  const targetPattern = /19[',]?464[',]?431/;
  const targetFound = pdfText.match(targetPattern);
  console.log(`\n🎯 Target value (19,464,431) found in raw PDF: ${targetFound ? 'YES' : 'NO'}`);
  if (targetFound) {
    console.log(`   Found as: ${targetFound[0]}`);
  }
  
  return patterns;
}

// Run both analyses
async function runCompleteAnalysis() {
  try {
    // First analyze PDF structure directly
    await analyzePDFStructureDirectly();
    
    // Then run browser analysis
    await analyzeMessosPDFWithBrowser();
    
    console.log('\n🎯 COMPLETE ANALYSIS FINISHED');
    console.log('Check the following files:');
    console.log('- stagehand-analysis.json (browser results)');
    console.log('- messos-extraction-screenshot.png (visual)');
    
  } catch (error) {
    console.error('❌ Complete analysis failed:', error);
  }
}

runCompleteAnalysis();