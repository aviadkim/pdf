// 🎯 Test Bulletproof Processor via URL
import fs from 'fs';
import fetch from 'node-fetch';

async function testBulletproofURL() {
  console.log('🎯 TESTING BULLETPROOF PROCESSOR VIA URL');
  console.log('========================================');
  
  const ENDPOINTS = [
    'https://pdf-main-mvloxzj1s-aviads-projects-0f56b7ac.vercel.app/api/bulletproof-processor',
    'https://claude-pdf-vercel.vercel.app/api/bulletproof-processor'
  ];
  
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
    
    // Test each endpoint
    for (const endpoint of ENDPOINTS) {
      console.log(`🔧 Testing: ${endpoint}`);
      console.log('='.repeat(60));
      
      const startTime = Date.now();
      
      try {
        const response = await fetch(endpoint, {
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
          
          // Show extraction methods
          if (result.analysis && result.analysis.extractionMethods) {
            console.log(`🔧 Methods Used: ${result.analysis.extractionMethods.join(', ')}`);
          }
          
          // Show top securities
          if (result.data.holdings.length > 0) {
            console.log('\n💼 TOP 5 SECURITIES:');
            result.data.holdings
              .sort((a, b) => b.totalValue - a.totalValue)
              .slice(0, 5)
              .forEach((holding, idx) => {
                console.log(`${idx + 1}. ${holding.isin} - ${holding.securityName?.substring(0, 30)} - $${holding.totalValue.toLocaleString()}`);
              });
          }
          
          // Show validation results
          if (result.analysis && result.analysis.validationResults) {
            const val = result.analysis.validationResults;
            console.log('\n📊 VALIDATION RESULTS:');
            console.log(`Final Total: $${val.finalTotal.toLocaleString()}`);
            console.log(`Final Accuracy: ${(val.finalAccuracy * 100).toFixed(2)}%`);
          }
          
        } else {
          console.log(`❌ Status: FAILED (${responseTime}ms)`);
          console.log(`Error: ${result.error || 'Unknown error'}`);
          if (result.details) console.log(`Details: ${result.details}`);
        }
        
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Test other endpoints for comparison
    console.log('📊 COMPARISON WITH OTHER PROCESSORS');
    console.log('===================================');
    
    const comparisonEndpoints = [
      { name: 'Max Plan', url: 'https://pdf-main-mvloxzj1s-aviads-projects-0f56b7ac.vercel.app/api/max-plan-processor' },
      { name: 'Enhanced Messos', url: 'https://pdf-main-mvloxzj1s-aviads-projects-0f56b7ac.vercel.app/api/enhanced-messos-processor' },
      { name: 'Fusion 100', url: 'https://pdf-main-mvloxzj1s-aviads-projects-0f56b7ac.vercel.app/api/fusion-100-processor' }
    ];
    
    for (const { name, url } of comparisonEndpoints) {
      console.log(`\n🔧 Testing ${name}: ${url}`);
      
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfBase64: pdfBase64,
            filename: '2. Messos - 31.03.2025.pdf'
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          const holdings = result.data?.holdings || [];
          const totalValue = holdings.reduce((sum, h) => sum + (h.marketValue || h.totalValue || 0), 0);
          const accuracy = Math.min(totalValue, TARGET_VALUE) / Math.max(totalValue, TARGET_VALUE);
          
          console.log(`✅ Success: ${holdings.length} securities, $${totalValue.toLocaleString()} (${(accuracy * 100).toFixed(1)}% accuracy)`);
        } else {
          console.log(`❌ Failed: ${result.error || 'Unknown error'}`);
        }
        
      } catch (error) {
        console.log(`❌ Request failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBulletproofURL().catch(console.error);