// 🎯 Test Bulletproof Processor - Validate against Messos PDF
// Target: $19,464,431 with 100% accuracy

import fs from 'fs';
import path from 'path';

async function testBulletproofProcessor() {
  console.log('🎯 TESTING BULLETPROOF PROCESSOR');
  console.log('================================');
  
  const TARGET_VALUE = 19464431;
  const PDF_PATH = '/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf';
  
  try {
    // Check if PDF exists
    if (!fs.existsSync(PDF_PATH)) {
      console.error(`❌ PDF not found at: ${PDF_PATH}`);
      return;
    }
    
    console.log(`📄 Loading PDF: ${PDF_PATH}`);
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log(`🎯 Target Total: $${TARGET_VALUE.toLocaleString()}`);
    console.log('');
    
    // Import the bulletproof processor
    const { default: bulletproofProcessor } = await import('./api/bulletproof-processor.js');
    
    // Create mock request/response objects
    const mockReq = {
      method: 'POST',
      body: {
        pdfBase64: pdfBase64,
        filename: '2. Messos - 31.03.2025.pdf'
      }
    };
    
    const mockRes = {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader: function(name, value) {
        this.headers[name] = value;
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.body = data;
        return this;
      },
      end: function() {
        return this;
      }
    };
    
    console.log('🚀 Starting bulletproof processing...');
    const startTime = Date.now();
    
    // Run the processor
    await bulletproofProcessor(mockReq, mockRes);
    
    const processingTime = Date.now() - startTime;
    const result = mockRes.body;
    
    console.log('');
    console.log('📊 RESULTS ANALYSIS');
    console.log('==================');
    
    if (result && result.success) {
      const { data, analysis, debug } = result;
      
      console.log(`✅ Processing Status: SUCCESS`);
      console.log(`⏱️  Processing Time: ${processingTime}ms`);
      console.log(`📊 Total Value: $${data.totalValue.toLocaleString()}`);
      console.log(`🎯 Target Value: $${data.targetValue.toLocaleString()}`);
      console.log(`📈 Accuracy: ${data.accuracyPercent}%`);
      console.log(`🏆 Success Criteria: ${data.success ? 'MET' : 'NOT MET'}`);
      console.log(`📋 Securities Found: ${data.holdings.length}`);
      console.log('');
      
      console.log('🔧 EXTRACTION METHODS USED:');
      analysis.extractionMethods.forEach(method => {
        console.log(`   • ${method}`);
      });
      console.log('');
      
      console.log('🔄 REFINEMENT DETAILS:');
      console.log(`   • Iterations: ${analysis.iterationsPerformed}`);
      console.log(`   • PDF Type: ${analysis.pdfType.type} (${analysis.pdfType.confidence}% confidence)`);
      console.log('');
      
      if (data.holdings.length > 0) {
        console.log('💼 TOP 10 SECURITIES:');
        console.log('==================');
        const topSecurities = data.holdings
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 10);
          
        topSecurities.forEach((holding, idx) => {
          const value = holding.totalValue.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          });
          
          console.log(`${(idx + 1).toString().padStart(2)}. ${holding.securityName?.substring(0, 40).padEnd(40)} ${holding.isin} ${value.padStart(12)}`);
        });
        console.log('');
      }
      
      // Detailed analysis
      if (debug && debug.refinementSteps) {
        console.log('🔧 REFINEMENT STEPS:');
        debug.refinementSteps.forEach((step, idx) => {
          console.log(`   Step ${step.iteration}: $${step.beforeTotal.toLocaleString()} → $${step.afterTotal.toLocaleString()} (+${(step.improvement * 100).toFixed(2)}%)`);
          if (step.appliedFixes.length > 0) {
            step.appliedFixes.forEach(fix => {
              console.log(`      • ${fix}`);
            });
          }
        });
        console.log('');
      }
      
      // Success/Failure analysis
      if (data.success) {
        console.log('🎉 SUCCESS! Bulletproof processor achieved target accuracy!');
        console.log(`✅ Extracted $${data.totalValue.toLocaleString()} vs target $${data.targetValue.toLocaleString()}`);
        console.log(`✅ Accuracy: ${data.accuracyPercent}% (>99% required)`);
      } else {
        console.log('⚠️  TARGET NOT MET - Analysis:');
        const difference = Math.abs(data.totalValue - data.targetValue);
        const percentOff = ((difference / data.targetValue) * 100).toFixed(2);
        console.log(`   • Missing/Excess: $${difference.toLocaleString()} (${percentOff}% off)`);
        console.log(`   • Current accuracy: ${data.accuracyPercent}%`);
        console.log(`   • Securities found: ${data.holdings.length} (may need more)`);
        
        if (data.totalValue < data.targetValue) {
          console.log('   • Likely missing securities or undervalued positions');
        } else {
          console.log('   • Likely overvalued positions or duplicate entries');
        }
      }
      
    } else {
      console.log('❌ Processing failed:');
      if (result) {
        console.log(`   Error: ${result.error}`);
        console.log(`   Details: ${result.details}`);
      } else {
        console.log('   No response received');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testBulletproofProcessor().catch(console.error);