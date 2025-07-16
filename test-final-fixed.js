// Test the final fixed processor
import fs from 'fs';
import fetch from 'node-fetch';

async function testFinalFixed() {
  console.log('🧪 Testing Final Fixed Processor...\n');
  
  try {
    // Read the PDF file
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('📄 PDF loaded successfully\n');
    
    // Call the API
    console.log('🚀 Calling Final Fixed Processor API...\n');
    const response = await fetch('http://localhost:3009/api/final-fixed-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: pdfPath
      })
    });
    
    const result = await response.json();
    
    console.log('===========================================');
    console.log('🎯 FINAL FIXED PROCESSOR RESULTS');
    console.log('===========================================\n');
    
    console.log(`✅ Success: ${result.success}`);
    console.log(`📝 Message: ${result.message}`);
    console.log(`🎯 Accuracy: ${result.extractedData.accuracyPercent}%`);
    console.log(`💰 Total Value: $${result.extractedData.totalValue.toLocaleString()}`);
    console.log(`🎯 Target Value: $${result.extractedData.targetValue.toLocaleString()}`);
    console.log(`📊 Securities Count: ${result.extractedData.securities.length}`);
    console.log(`❌ Portfolio Total Excluded: ${result.portfolioTotalExcluded}\n`);
    
    console.log('===========================================');
    console.log('🔍 KEY SECURITIES CHECK');
    console.log('===========================================\n');
    
    // Check for Toronto Dominion and Canadian Imperial
    const toronto = result.extractedData.securities.find(s => s.isin === 'XS2530201644');
    const canadian = result.extractedData.securities.find(s => s.isin === 'XS2588105036');
    
    if (toronto) {
      console.log('✅ TORONTO DOMINION BANK (XS2530201644)');
      console.log(`   Value: $${toronto.value.toLocaleString()} (${toronto.swissOriginal})`);
      console.log(`   Expected: $199,080`);
      console.log(`   Correct: ${toronto.value === 199080 ? '✅ YES' : '❌ NO'}\n`);
    }
    
    if (canadian) {
      console.log('✅ CANADIAN IMPERIAL BANK (XS2588105036)');
      console.log(`   Value: $${canadian.value.toLocaleString()} (${canadian.swissOriginal})`);
      console.log(`   Expected: $200,288`);
      console.log(`   Correct: ${canadian.value === 200288 ? '✅ YES' : '❌ NO'}\n`);
    }
    
    console.log('===========================================');
    console.log('📋 ALL SECURITIES (sorted by value)');
    console.log('===========================================\n');
    
    result.extractedData.securities.forEach((sec, i) => {
      console.log(`${i + 1}. ${sec.isin}: $${sec.value.toLocaleString()} - ${sec.description}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testFinalFixed();