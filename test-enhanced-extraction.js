import fetch from 'node-fetch';
import fs from 'fs';

async function testEnhancedExtraction() {
  console.log('🚀 TESTING ENHANCED SWISS EXTRACTION\n');
  
  const pdfPath = '/mnt/c/Users/aviad/OneDrive/Desktop/2. Messos  - 31.03.2025.pdf';
  
  try {
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      console.log('❌ PDF file not found at:', pdfPath);
      return;
    }
    
    console.log('📄 Reading PDF file...');
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📊 PDF Info:`);
    console.log(`  Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`  Expected: 40 holdings with values and names\n`);
    
    console.log('🔬 Testing Enhanced Swiss Extraction...');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/enhanced-swiss-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'Messos-31.03.2025.pdf'
      })
    });
    
    console.log(`Response Status: ${response.status}\n`);
    
    if (response.ok) {
      const data = await response.json();
      
      console.log('✅ ENHANCED EXTRACTION RESULTS:');
      console.log('=' * 70);
      console.log(`Success: ${data.success}`);
      console.log(`Method: ${data.metadata?.method}`);
      console.log(`Processing Time: ${data.metadata?.processingTime}`);
      console.log(`Overall Confidence: ${data.metadata?.confidence}%\n`);
      
      // Detailed metrics
      console.log('📊 DETAILED ACCURACY METRICS:');
      console.log(`Total Holdings: ${data.metadata?.totalHoldings || 0}`);
      console.log(`ISIN Accuracy: ${data.metadata?.isinAccuracy || 0}% (${data.metadata?.validISINs}/${data.metadata?.totalHoldings})`);
      console.log(`Name Accuracy: ${data.metadata?.nameAccuracy || 0}% (${data.metadata?.withNames}/${data.metadata?.totalHoldings})`);
      console.log(`Value Accuracy: ${data.metadata?.valueAccuracy || 0}% (${data.metadata?.withValues}/${data.metadata?.totalHoldings})\n`);
      
      const holdings = data.data?.holdings || [];
      
      if (holdings.length > 0) {
        console.log('🎯 FIRST 15 HOLDINGS WITH ENHANCED EXTRACTION:');
        console.log('-' * 70);
        
        holdings.slice(0, 15).forEach((holding, idx) => {
          const nameStatus = holding.quality?.hasName ? '✅' : '❌';
          const valueStatus = holding.quality?.hasValue ? '✅' : '❌';
          const isinStatus = holding.isin && holding.isin.length === 12 ? '✅' : '❌';
          
          console.log(`${(idx + 1).toString().padStart(2)}. ${nameStatus} ${valueStatus} ${isinStatus}`);
          console.log(`    Name: ${holding.securityName || 'Unknown'}`);
          console.log(`    ISIN: ${holding.isin || 'Missing'}`);
          console.log(`    Value: ${formatCurrency(holding.currentValue)} ${holding.currency}`);
          console.log(`    Category: ${holding.category || 'Unknown'}`);
          console.log(`    Quality: ${holding.quality?.valueConfidence || 'unknown'} confidence`);
          console.log('');
        });
        
        if (holdings.length > 15) {
          console.log(`    ... and ${holdings.length - 15} more holdings\n`);
        }
        
        // Quality Analysis
        console.log('📈 QUALITY ANALYSIS:');
        console.log('-' * 50);
        
        const qualityMetrics = data.qualityMetrics || {};
        const qualityDist = qualityMetrics.qualityDistribution || {};
        
        console.log(`High Quality (Name + Value): ${qualityDist.highQuality || 0} holdings`);
        console.log(`Medium Quality (Name OR Value): ${qualityDist.mediumQuality || 0} holdings`);
        console.log(`Low Quality (No Name, No Value): ${qualityDist.lowQuality || 0} holdings\n`);
        
        // Compare with expected results
        console.log('🎯 COMPARISON WITH EXPECTATIONS:');
        console.log('-' * 50);
        
        const expectedHoldings = 40;
        const expectedTotal = 19461320;
        
        console.log(`Expected Holdings: ${expectedHoldings}, Found: ${holdings.length}`);
        
        if (holdings.length >= 35) {
          console.log('✅ Excellent coverage (87.5%+)');
        } else if (holdings.length >= 30) {
          console.log('✅ Good coverage (75%+)');
        } else {
          console.log('⚠️ Needs improvement (<75%)');
        }
        
        // Portfolio total comparison
        const portfolioTotal = data.data?.portfolioInfo?.portfolioTotal?.value;
        if (portfolioTotal) {
          console.log(`Expected Total: ${formatCurrency(expectedTotal)} USD`);
          console.log(`Found Total: ${formatCurrency(portfolioTotal)} USD`);
          
          const accuracy = Math.min(portfolioTotal / expectedTotal, 1) * 100;
          console.log(`Portfolio Accuracy: ${accuracy.toFixed(1)}%`);
        }
        
        // Value extraction success
        const holdingsWithValues = holdings.filter(h => h.currentValue > 0);
        const totalValueExtracted = holdingsWithValues.reduce((sum, h) => sum + h.currentValue, 0);
        
        console.log(`\nValue Extraction:`);
        console.log(`Holdings with values: ${holdingsWithValues.length}/${holdings.length}`);
        console.log(`Total value extracted: ${formatCurrency(totalValueExtracted)} USD`);
        
        // Final assessment
        console.log('\n🏆 OVERALL ASSESSMENT:');
        const overallAccuracy = data.metadata?.confidence || 0;
        
        if (overallAccuracy >= 90) {
          console.log('🎉 EXCELLENT! Ready for production use.');
        } else if (overallAccuracy >= 80) {
          console.log('✅ VERY GOOD! Minor improvements possible.');
        } else if (overallAccuracy >= 70) {
          console.log('⚠️ GOOD. Some improvements needed.');
        } else {
          console.log('❌ NEEDS WORK. Significant improvements required.');
        }
        
        console.log(`Final Score: ${overallAccuracy}%`);
        
      } else {
        console.log('❌ No holdings extracted');
      }
      
      // Portfolio info
      if (data.data?.portfolioInfo) {
        console.log('\n📋 PORTFOLIO INFORMATION:');
        const info = data.data.portfolioInfo;
        console.log(`Client: ${info.clientName || 'Not found'}`);
        console.log(`Bank: ${info.bankName || 'Not found'}`);
        console.log(`Account: ${info.accountNumber || 'Not found'}`);
        console.log(`Report Date: ${info.reportDate || 'Not found'}`);
      }
      
    } else {
      const errorData = await response.json();
      console.log('❌ ENHANCED EXTRACTION FAILED');
      console.log(`Error: ${errorData.error}`);
      console.log(`Details: ${errorData.details}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

function formatCurrency(value) {
  if (!value) return 'N/A';
  return new Intl.NumberFormat('en-US').format(value);
}

testEnhancedExtraction();