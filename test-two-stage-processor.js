// 🎯 Test Two-Stage Processor
import fetch from 'node-fetch';
import fs from 'fs';

async function testTwoStageProcessor() {
  console.log('🎯 TESTING TWO-STAGE PROCESSOR');
  console.log('==============================');
  
  const URL = 'http://localhost:3001/api/two-stage-processor';
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
    
    // Test two-stage processor
    console.log(`🔧 Testing: ${URL}`);
    console.log('='.repeat(80));
    
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
      
      // Show stage breakdown
      console.log('\n🔧 STAGE BREAKDOWN:');
      console.log('='.repeat(60));
      
      if (result.stages) {
        Object.entries(result.stages).forEach(([stageName, stage]) => {
          console.log(`${stageName.toUpperCase()}: ${stage.name}`);
          console.log(`   Duration: ${stage.duration}ms`);
          console.log(`   Details: ${JSON.stringify(stage, null, 2).substring(0, 200)}...`);
          console.log('');
        });
      }
      
      // Show performance breakdown
      if (result.performance) {
        console.log('⏱️  PERFORMANCE BREAKDOWN:');
        console.log('='.repeat(60));
        console.log(`Total Processing: ${result.performance.totalProcessingTime}`);
        if (result.performance.stageBreakdown) {
          Object.entries(result.performance.stageBreakdown).forEach(([stage, time]) => {
            console.log(`   ${stage}: ${time}`);
          });
        }
        console.log('');
      }
      
      // Show top securities
      if (result.data.holdings.length > 0) {
        console.log('💼 TOP 10 SECURITIES:');
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
            
            const name = holding.securityName?.substring(0, 35) || 'Unknown Security';
            const isin = holding.isin || 'No ISIN';
            const confidence = holding.confidence ? `(${holding.confidence}%)` : '';
            
            console.log(`${(idx + 1).toString().padStart(2)}. ${name.padEnd(37)} ${isin} ${value.padStart(15)} ${confidence}`);
          });
        console.log('');
      }
      
      // Calculate accuracy difference
      const difference = Math.abs(result.data.totalValue - result.data.targetValue);
      const percentOff = ((difference / result.data.targetValue) * 100).toFixed(2);
      
      console.log('🎯 ACCURACY ANALYSIS:');
      console.log('='.repeat(50));
      console.log(`Difference: $${difference.toLocaleString()} (${percentOff}% off target)`);
      
      if (result.data.success) {
        console.log('🎉 SUCCESS! Two-stage processor achieved target accuracy!');
        console.log(`✅ Extracted $${result.data.totalValue.toLocaleString()} vs target $${result.data.targetValue.toLocaleString()}`);
        console.log(`✅ Accuracy: ${result.data.accuracyPercent}% (≥99% required)`);
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
        
        // Two-stage specific analysis
        console.log('\n🔧 TWO-STAGE APPROACH ANALYSIS:');
        if (result.stages && result.stages.stage1) {
          console.log(`   • Raw Data Points: ${result.stages.stage1.dataPoints || 'N/A'}`);
          console.log(`   • Extraction Methods: ${result.stages.stage1.methods?.join(', ') || 'N/A'}`);
        }
        if (result.stages && result.stages.stage2) {
          console.log(`   • AI Construction: ${result.stages.stage2.securitiesConstructed || 'N/A'} securities built`);
          console.log(`   • AI Model: ${result.stages.stage2.aiModel || 'N/A'}`);
        }
        
        // Suggest improvements
        console.log('\n💡 SUGGESTED IMPROVEMENTS:');
        if (result.data.holdings.length < 20) {
          console.log('   • Enhance raw data extraction to capture more data points');
          console.log('   • Improve AI grouping algorithm to find more securities');
        }
        if (parseFloat(result.data.accuracyPercent) < 10) {
          console.log('   • Improve value extraction from raw data points');
          console.log('   • Enhance AI table construction logic');
        }
        if (result.data.holdings.length > 30) {
          console.log('   • Add duplicate detection in stage 2');
          console.log('   • Improve ISIN validation');
        }
      }
      
    } else {
      console.log(`❌ Status: FAILED (${responseTime}ms)`);
      console.log(`Error: ${result.error || 'Unknown error'}`);
      if (result.details) console.log(`Details: ${result.details}`);
      if (result.stage) console.log(`Failed at stage: ${result.stage}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testTwoStageProcessor().catch(console.error);