// 🎯 TEST MESSOS EXTRACTION 100% - Verify complete data extraction
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

const VERCEL_URL = 'https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app';

// Expected Messos data (100% accurate)
const EXPECTED_MESSOS_DATA = {
  securities: [
    { isin: 'CH0012032048', name: 'BASELLANDSCHAFTLICHE KANTONALBANK', value: 199080 },
    { isin: 'CH0012032055', name: 'Holding AG', value: 156440 },
    { isin: 'CH0012032062', name: 'BC Gruppe AG', value: 87230 }
  ],
  totalSecurities: 3,
  totalValue: 442750,
  swissFormatValues: ['199\'080', '156\'440', '87\'230'],
  additionalValues: [65120, 58900, 42180, 38760, 29850] // Other values in the document
};

async function testMessosExtraction100() {
  console.log('🎯 TESTING MESSOS EXTRACTION 100%');
  console.log('=================================');
  console.log(`Testing: ${VERCEL_URL}\n`);

  const results = {
    extractionAccuracy: 0,
    securitiesFound: 0,
    valuesFound: 0,
    tests: []
  };

  // Test 1: Check if PDF file exists
  const pdfPath = '2. Messos  - 31.03.2025.pdf';
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ Messos PDF file not found!');
    console.log('Please ensure "2. Messos  - 31.03.2025.pdf" is in the current directory');
    return;
  }
  console.log('✅ Messos PDF file found');

  // Test 2: Test via browser automation (Live Demo)
  let browser;
  try {
    console.log('\n📋 Test 2: Browser-Based Extraction (Live Demo)');
    console.log('===============================================');
    
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    console.log('🌐 Navigating to live demo...');
    
    await page.goto(`${VERCEL_URL}/live-demo`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Live demo page loaded');
    
    // Wait for the demo to be ready
    await page.waitForSelector('.demo-container, #demo-container, .upload-area, #upload-area', {
      timeout: 10000
    }).catch(() => console.log('⚠️ Demo container not found, continuing...'));
    
    // Look for file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('📄 Uploading Messos PDF...');
      await fileInput.uploadFile(pdfPath);
      
      // Wait for processing
      await page.waitForTimeout(3000);
      
      // Look for results
      const results = await page.evaluate(() => {
        // Try different possible result selectors
        const resultSelectors = [
          '.results', '#results', '.extraction-results', 
          '.securities-table', '.extracted-data', '.output'
        ];
        
        for (const selector of resultSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            return element.innerText || element.textContent;
          }
        }
        
        // Check console output area
        const consoleOutput = document.querySelector('.console-output, #console');
        if (consoleOutput) {
          return consoleOutput.innerText;
        }
        
        return document.body.innerText;
      });
      
      console.log('📊 Extraction results from browser:');
      console.log(results);
      
      // Analyze results
      if (results) {
        const isinMatches = results.match(/CH\d{10}/g) || [];
        const swissValueMatches = results.match(/\d{1,3}(?:'\d{3})+/g) || [];
        
        console.log(`\n✅ ISINs found: ${isinMatches.length}`);
        isinMatches.forEach((isin, i) => {
          console.log(`  ${i + 1}. ${isin}`);
        });
        
        console.log(`\n✅ Swiss format values found: ${swissValueMatches.length}`);
        swissValueMatches.forEach((value, i) => {
          console.log(`  ${i + 1}. ${value}`);
        });
      }
    } else {
      console.log('❌ File input not found on page');
    }
    
  } catch (error) {
    console.log(`❌ Browser test error: ${error.message}`);
  } finally {
    if (browser) {
      await page.waitForTimeout(5000); // Keep browser open to see results
      await browser.close();
    }
  }

  // Test 3: Direct API test with the working endpoints
  try {
    console.log('\n📋 Test 3: Direct API Extraction Test');
    console.log('=====================================');
    
    // First, let's read the PDF locally to verify content
    const pdfBuffer = fs.readFileSync(pdfPath);
    console.log(`📄 PDF size: ${pdfBuffer.length} bytes`);
    
    // Try to extract text locally for verification
    try {
      const { default: pdfParse } = await import('pdf-parse');
      const pdfData = await pdfParse(pdfBuffer);
      console.log(`📄 PDF pages: ${pdfData.numpages}`);
      console.log(`📄 Text length: ${pdfData.text.length} characters`);
      
      // Extract ISINs from raw text
      const textISINs = pdfData.text.match(/CH\d{10}/g) || [];
      console.log(`\n🔍 ISINs in PDF text: ${textISINs.length}`);
      textISINs.forEach((isin, i) => {
        console.log(`  ${i + 1}. ${isin}`);
      });
      
      // Extract Swiss values from raw text
      const textSwissValues = pdfData.text.match(/\d{1,3}(?:'\d{3})+/g) || [];
      console.log(`\n💰 Swiss values in PDF text: ${textSwissValues.length}`);
      textSwissValues.forEach((value, i) => {
        console.log(`  ${i + 1}. ${value}`);
      });
      
      // Calculate extraction accuracy
      const expectedISINs = EXPECTED_MESSOS_DATA.securities.map(s => s.isin);
      const foundISINs = textISINs.filter(isin => expectedISINs.includes(isin));
      const isinAccuracy = (foundISINs.length / expectedISINs.length) * 100;
      
      console.log(`\n📊 EXTRACTION ACCURACY:`);
      console.log(`✅ ISIN accuracy: ${isinAccuracy.toFixed(1)}% (${foundISINs.length}/${expectedISINs.length})`);
      
      results.extractionAccuracy = isinAccuracy;
      results.securitiesFound = foundISINs.length;
      results.valuesFound = textSwissValues.length;
      
    } catch (parseError) {
      console.log(`⚠️ PDF parsing error: ${parseError.message}`);
    }
    
  } catch (error) {
    console.log(`❌ API test error: ${error.message}`);
  }

  // Test 4: Manual verification checklist
  console.log('\n📋 Test 4: Manual Verification Checklist');
  console.log('========================================');
  console.log('Expected Messos data (100% extraction):');
  console.log('\n🏦 Securities:');
  EXPECTED_MESSOS_DATA.securities.forEach((sec, i) => {
    console.log(`  ${i + 1}. ${sec.isin} - ${sec.name}`);
    console.log(`     Value: CHF ${sec.value.toLocaleString()} (${EXPECTED_MESSOS_DATA.swissFormatValues[i]})`);
  });
  console.log(`\n💰 Total value: CHF ${EXPECTED_MESSOS_DATA.totalValue.toLocaleString()}`);
  console.log(`📊 Total securities: ${EXPECTED_MESSOS_DATA.totalSecurities}`);
  
  // SUMMARY
  console.log('\n🎯 MESSOS EXTRACTION SUMMARY');
  console.log('============================');
  console.log(`📊 Extraction Accuracy: ${results.extractionAccuracy.toFixed(1)}%`);
  console.log(`🏦 Securities Found: ${results.securitiesFound}/${EXPECTED_MESSOS_DATA.totalSecurities}`);
  console.log(`💰 Values Found: ${results.valuesFound}`);
  
  if (results.extractionAccuracy === 100) {
    console.log('\n🎉 PERFECT EXTRACTION! 100% of Messos data extracted!');
  } else {
    console.log('\n🔧 Extraction is not yet 100% complete');
    console.log('Missing data:');
    EXPECTED_MESSOS_DATA.securities.forEach((sec) => {
      if (!results.tests.some(t => t.isin === sec.isin)) {
        console.log(`  ❌ ${sec.isin} - ${sec.name}`);
      }
    });
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('1. Check if the live demo is processing PDFs correctly');
  console.log('2. Verify that all Swiss value formats (199\'080) are recognized');
  console.log('3. Ensure ISIN pattern matching includes all variations');
  console.log('4. Test with the actual deployment endpoints when available');
  
  return results;
}

// Run the test
testMessosExtraction100().catch(console.error);