#!/usr/bin/env node

// 🔄 DIRECT BASELINE TEST: Testing hybrid-precise-processor directly
// This will tell us if the issue is in routing or in the processor itself

import fs from 'fs';
import fetch from 'node-fetch';

async function testBaselineDirect() {
  console.log('🔄 DIRECT BASELINE TEST: Testing hybrid-precise-processor');
  console.log('========================================================');
  
  const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
  const pdfBase64 = pdfBuffer.toString('base64');
  
  console.log(`📄 Testing with: ${(pdfBuffer.length / 1024).toFixed(1)}KB PDF`);
  console.log('🧪 Calling hybrid-precise-processor directly...\n');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/hybrid-precise-processor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'baseline-direct-test.pdf'
      }),
      timeout: 60000
    });
    
    const processingTime = Date.now() - startTime;
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('✅ HYBRID PRECISE PROCESSOR DIRECT TEST');
      console.log('======================================');
      console.log(`⏱️ Processing Time: ${processingTime}ms`);
      console.log(`📊 Securities Found: ${result.data?.holdings?.length || 0}`);
      console.log(`💰 Total Value: $${(result.data?.totalValue || 0).toLocaleString()}`);
      console.log(`🎯 Accuracy: ${((result.data?.accuracy || 0) * 100).toFixed(2)}%`);
      console.log(`🏆 Quality Grade: ${result.validation?.qualityGrade || 'Unknown'}`);
      console.log(`🔧 Extraction Method: ${result.metadata?.extractionMethod || 'Unknown'}`);
      
      if (result.data?.holdings && result.data.holdings.length > 0) {
        console.log('\n📊 ACTUAL HOLDINGS FOUND:');
        console.log('========================');
        result.data.holdings.forEach((holding, idx) => {
          console.log(`${idx + 1}. ${holding.name || holding.securityName || 'Unknown Security'}`);
          console.log(`   ISIN: ${holding.isin || 'N/A'}`);
          console.log(`   Value: $${(holding.marketValue || holding.currentValue || 0).toLocaleString()}`);
          console.log(`   Category: ${holding.category || 'Unknown'}`);
          if (holding.correctionApplied) {
            console.log(`   🔧 Correction: ${holding.correctionReason}`);
          }
          console.log('');
        });
        
        console.log('🎉 BASELINE CONCLUSION:');
        console.log('=======================');
        console.log(`✅ Holdings extraction: WORKING (${result.data.holdings.length} securities)`);
        console.log(`✅ Value calculation: WORKING ($${(result.data.totalValue || 0).toLocaleString()})`);
        console.log(`✅ Quality assessment: ${result.validation?.qualityGrade || 'Unknown'}`);
        console.log('🔍 ISSUE: Problem is in the Intelligence Router, not the base processor!');
        
      } else {
        console.log('\n❌ NO HOLDINGS FOUND - PROBLEM IN BASE PROCESSOR');
        console.log('===============================================');
        console.log('🚨 The baseline processor itself is failing to extract holdings');
        console.log('🔍 This indicates a fundamental extraction issue');
        
        // Check if there's any extracted text
        if (result.debug?.extractedText) {
          console.log('📝 Extracted text sample:');
          console.log(result.debug.extractedText.substring(0, 500) + '...');
        }
      }
      
      return result;
      
    } else {
      const error = await response.text();
      console.log(`❌ Baseline processor failed: HTTP ${response.status}`);
      console.log(`Error: ${error}`);
      return null;
    }
    
  } catch (error) {
    console.log(`❌ Direct test failed: ${error.message}`);
    return null;
  }
}

testBaselineDirect().catch(console.error);