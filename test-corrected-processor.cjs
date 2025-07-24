// Test the corrected processor
const fs = require('fs');
const path = require('path');

async function testCorrectedProcessor() {
  console.log('🔧 Testing CORRECTED Processor');
  
  try {
    // Load the real Messos PDF
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📄 PDF loaded: ${pdfBuffer.length} bytes`);
    
    // Test the corrected processor
    console.log('\n🎯 Testing CORRECTED Processor:');
    const response = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor-corrected', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos  - 31.03.2025.pdf'
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('\n✅ CORRECTED PROCESSOR RESULTS:');
      console.log(`📊 Holdings Found: ${result.data?.holdings?.length || 0}`);
      console.log(`💰 Total Value: $${(result.data?.portfolioInfo?.totalValue || 0).toLocaleString()}`);
      console.log(`⏱️ Processing Time: ${result.metadata?.processingTime}`);
      console.log(`🔧 Method: ${result.metadata?.extractionMethod}`);
      console.log(`✅ Validation: ${result.data?.portfolioInfo?.validation}`);
      
      const totalValue = result.data?.portfolioInfo?.totalValue || 0;
      
      if (totalValue > 40000000 && totalValue < 60000000) {
        console.log('\n🎉 SUCCESS! Value is in expected range (~46M)');
      } else if (totalValue > 90000000) {
        console.log('\n❌ STILL BROKEN: Value too high (still extracting nominal values)');
      } else {
        console.log('\n⚠️ NEEDS REVIEW: Value outside expected range');
      }
      
      // Show sample holdings
      if (result.data?.holdings?.length > 0) {
        console.log('\n📋 Sample Holdings (Corrected):');
        for (let i = 0; i < Math.min(5, result.data.holdings.length); i++) {
          const holding = result.data.holdings[i];
          console.log(`  ${i+1}. ${holding.securityName.substring(0, 50)}...`);
          console.log(`     ISIN: ${holding.isin}, Value: $${holding.currentValue?.toLocaleString()}`);
        }
      }
      
      // Save results
      fs.writeFileSync('corrected-processor-results.json', JSON.stringify(result, null, 2));
      console.log('\n💾 Results saved to corrected-processor-results.json');
      
      return {
        success: true,
        holdingsCount: result.data?.holdings?.length || 0,
        totalValue: totalValue,
        isValueCorrected: totalValue > 40000000 && totalValue < 60000000
      };
      
    } else {
      console.log(`❌ Corrected processor failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error:', errorText.substring(0, 500));
      
      return {
        success: false,
        error: 'API call failed',
        status: response.status
      };
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Also test original vs corrected side by side
async function compareProcessors() {
  console.log('\n🔍 COMPARING ORIGINAL vs CORRECTED:');
  
  try {
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // Test original
    const originalResponse = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, filename: 'test.pdf' })
    });
    
    const originalResult = await originalResponse.json();
    const originalTotal = originalResult.data?.portfolioInfo?.totalValue || 0;
    
    // Test corrected
    const correctedResponse = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor-corrected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64, filename: 'test.pdf' })
    });
    
    const correctedResult = await correctedResponse.json();
    const correctedTotal = correctedResult.data?.portfolioInfo?.totalValue || 0;
    
    console.log('\n📊 COMPARISON RESULTS:');
    console.log(`Original Total:  $${originalTotal.toLocaleString()}`);
    console.log(`Corrected Total: $${correctedTotal.toLocaleString()}`);
    console.log(`Difference:      $${Math.abs(originalTotal - correctedTotal).toLocaleString()}`);
    
    if (correctedTotal < originalTotal) {
      console.log('✅ Corrected processor shows lower total (good sign)');
    } else {
      console.log('❌ Corrected processor still shows high total');
    }
    
  } catch (error) {
    console.log('❌ Comparison failed:', error.message);
  }
}

// Run tests
testCorrectedProcessor()
  .then(result => {
    console.log('\n🎯 FINAL CORRECTED TEST RESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.isValueCorrected) {
      console.log('\n🎉 CORRECTED PROCESSOR SUCCESS!');
      console.log('✅ Values are now in expected range (~46M)');
    } else {
      console.log('\n❌ CORRECTED PROCESSOR NEEDS MORE WORK');
    }
    
    // Run comparison
    return compareProcessors();
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
  });