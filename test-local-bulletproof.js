// Test bulletproof processor on local server
import fetch from 'node-fetch';
import fs from 'fs';

async function testLocalBulletproof() {
  console.log('🎯 TESTING LOCAL BULLETPROOF PROCESSOR');
  console.log('=====================================');
  
  const URL = 'http://localhost:3001/api/bulletproof-processor';
  const PDF_PATH = '/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf';
  const TARGET_VALUE = 19464431;
  
  try {
    // Load PDF
    console.log(`📄 Loading PDF: ${PDF_PATH}`);
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`🎯 Target Total: $${TARGET_VALUE.toLocaleString()}`);
    console.log('');
    
    // Test local server
    console.log(`🔧 Testing: ${URL}`);
    console.log('='.repeat(60));
    
    const startTime = Date.now();
    
    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos - 31.03.2025.pdf'
      })
    });
    
    const responseTime = Date.now() - startTime;
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Status: SUCCESS (${responseTime}ms)`);
      console.log(`📊 Total Value: $${result.data.totalValue.toLocaleString()}`);
      console.log(`🎯 Target Value: $${result.data.targetValue.toLocaleString()}`);
      console.log(`📈 Accuracy: ${result.data.accuracyPercent}%`);
      console.log(`🏆 Success Criteria: ${result.data.success ? 'MET' : 'NOT MET'}`);
      console.log(`📋 Securities Found: ${result.data.holdings.length}`);
      
      // Calculate accuracy difference
      const difference = Math.abs(result.data.totalValue - result.data.targetValue);
      const percentOff = ((difference / result.data.targetValue) * 100).toFixed(2);
      
      console.log(`💰 Difference: $${difference.toLocaleString()} (${percentOff}% off target)`);
      
      // Show extraction methods
      if (result.analysis && result.analysis.extractionMethods) {
        console.log(`🔧 Methods Used: ${result.analysis.extractionMethods.join(', ')}`);
      }
      
      // Show PDF type detection
      if (result.analysis && result.analysis.pdfType) {
        console.log(`📋 PDF Type: ${result.analysis.pdfType.type} (${result.analysis.pdfType.confidence}% confidence)`);
      }
      
      // Show top securities
      if (result.data.holdings.length > 0) {
        console.log('\n💼 TOP 10 SECURITIES:');
        console.log('='.repeat(80));
        result.data.holdings
          .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
          .slice(0, 10)
          .forEach((holding, idx) => {
            const value = (holding.totalValue || 0).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            });
            
            const name = holding.securityName?.substring(0, 40) || 'Unknown Security';
            const isin = holding.isin || 'No ISIN';
            
            console.log(`${(idx + 1).toString().padStart(2)}. ${name.padEnd(42)} ${isin} ${value.padStart(15)}`);
          });
      }
      
      // Show validation results
      if (result.analysis && result.analysis.validationResults) {
        const val = result.analysis.validationResults;
        console.log('\n📊 DETAILED VALIDATION:');
        console.log('='.repeat(50));
        console.log(`Iterations Performed: ${result.analysis.iterationsPerformed}`);
        console.log(`Final Total: $${val.finalTotal.toLocaleString()}`);
        console.log(`Final Accuracy: ${(val.finalAccuracy * 100).toFixed(3)}%`);
        console.log(`Securities Found: ${val.securitiesFound}`);
      }
      
      // Summary analysis
      console.log('\n🎯 SUMMARY ANALYSIS:');
      console.log('='.repeat(50));
      
      if (result.data.success) {
        console.log('🎉 SUCCESS! Bulletproof processor achieved target accuracy!');
        console.log(`✅ Extracted $${result.data.totalValue.toLocaleString()} vs target $${result.data.targetValue.toLocaleString()}`);
        console.log(`✅ Accuracy: ${result.data.accuracyPercent}% (>99% required)`);
      } else {
        console.log('⚠️  TARGET NOT MET - Analysis:');
        console.log(`   • Missing/Excess: $${difference.toLocaleString()} (${percentOff}% off)`);
        console.log(`   • Current accuracy: ${result.data.accuracyPercent}%`);
        console.log(`   • Securities found: ${result.data.holdings.length}`);
        
        if (result.data.totalValue < result.data.targetValue) {
          console.log('   • Status: Likely missing securities or undervalued positions');
        } else {
          console.log('   • Status: Likely overvalued positions or duplicate entries');
        }
        
        // Suggest next steps
        console.log('\n🔧 SUGGESTED IMPROVEMENTS:');
        if (result.data.holdings.length < 20) {
          console.log('   • Enhance ISIN detection to find more securities');
        }
        if (parseFloat(result.data.accuracyPercent) < 10) {
          console.log('   • Fix value extraction (may be extracting wrong value fields)');
        }
        if (result.data.holdings.length > 30) {
          console.log('   • Check for duplicate entries or invalid ISINs');
        }
      }
      
    } else {
      console.log(`❌ Status: FAILED (${responseTime}ms)`);
      console.log(`Error: ${result.error || 'Unknown error'}`);
      if (result.details) console.log(`Details: ${result.details}`);
      if (result.debug) {
        console.log('\n🐛 DEBUG INFO:');
        console.log(JSON.stringify(result.debug, null, 2));
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLocalBulletproof().catch(console.error);