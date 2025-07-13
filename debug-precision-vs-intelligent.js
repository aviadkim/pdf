#!/usr/bin/env node

// 🔍 DEBUG PRECISION VS INTELLIGENT PROCESSOR
// Compare responses to identify why precision processor isn't extracting data

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugProcessors() {
  console.log('🔍 DEBUGGING PRECISION VS INTELLIGENT PROCESSOR');
  console.log('=' * 60);

  try {
    // Load the Messos PDF
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    console.log(`📄 Loading PDF: ${pdfPath}`);
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    
    const testPayload = {
      pdfBase64: pdfBase64,
      filename: 'messos-comparison-test.pdf'
    };
    
    // Test Intelligent Processor (working)
    console.log('\n🧠 TESTING INTELLIGENT PROCESSOR (Working Baseline)');
    console.log('-' * 50);
    
    try {
      const intelligentResponse = await fetch('https://pdf-five-nu.vercel.app/api/intelligent-messos-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`📡 Intelligent Response Status: ${intelligentResponse.status}`);
      
      if (intelligentResponse.ok) {
        const intelligentResult = await intelligentResponse.json();
        
        console.log(`✅ Success: ${intelligentResult.success}`);
        console.log(`📊 Holdings: ${intelligentResult.data?.holdings?.length || 0}`);
        
        if (intelligentResult.data?.holdings?.length > 0) {
          const totalValue = intelligentResult.data.holdings.reduce((sum, h) => sum + (h.currentValue || h.marketValue || 0), 0);
          console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
          console.log(`📋 Sample holdings:`);
          
          intelligentResult.data.holdings.slice(0, 3).forEach((h, i) => {
            console.log(`  ${i + 1}. ${h.securityName || h.name}: $${(h.currentValue || h.marketValue || 0).toLocaleString()}`);
          });
          
          // Check for UBS
          const ubsStock = intelligentResult.data.holdings.find(h => 
            (h.securityName || h.name || '').toLowerCase().includes('ubs')
          );
          console.log(`🏦 UBS Stock: ${ubsStock ? '✅ Found' : '❌ Missing'}`);
        }
        
        console.log(`⏱️ Processing Time: ${intelligentResult.metadata?.processingTime || 'Unknown'}`);
        console.log(`🔧 Method: ${intelligentResult.metadata?.extractionMethod || 'Unknown'}`);
        
      } else {
        console.log(`❌ Intelligent processor failed: ${intelligentResponse.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Intelligent processor error: ${error.message}`);
    }
    
    // Test Precision Processor (debugging)
    console.log('\n🎯 TESTING PRECISION PROCESSOR (Debugging)');
    console.log('-' * 50);
    
    try {
      const precisionResponse = await fetch('https://pdf-five-nu.vercel.app/api/precision-financial-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`📡 Precision Response Status: ${precisionResponse.status}`);
      
      if (precisionResponse.ok) {
        const precisionResult = await precisionResponse.json();
        
        console.log(`✅ Success: ${precisionResult.success}`);
        console.log(`📊 Holdings: ${precisionResult.data?.holdings?.length || 0}`);
        
        // Log full response for debugging
        console.log('\n🔍 FULL PRECISION RESPONSE:');
        console.log(JSON.stringify(precisionResult, null, 2));
        
        if (precisionResult.data?.holdings?.length > 0) {
          const totalValue = precisionResult.data.holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
          console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
          
          // Check for UBS
          const ubsStock = precisionResult.data.holdings.find(h => 
            (h.name || '').toLowerCase().includes('ubs')
          );
          console.log(`🏦 UBS Stock: ${ubsStock ? '✅ Found' : '❌ Missing'}`);
        } else {
          console.log('❌ No holdings extracted by precision processor');
          
          if (precisionResult.requiresHumanReview) {
            console.log('⚠️ Quality gate failed - human review required');
            if (precisionResult.qualityIssues) {
              precisionResult.qualityIssues.forEach(issue => {
                console.log(`  ${issue.severity.toUpperCase()}: ${issue.message}`);
              });
            }
          }
        }
        
        if (precisionResult.metadata) {
          console.log(`⏱️ Processing Time: ${precisionResult.metadata.processingTime}`);
          console.log(`🏦 Institution: ${precisionResult.metadata.institution}`);
          console.log(`🔧 OCR Engines: ${precisionResult.metadata.ocrEngines?.join(', ') || 'None'}`);
        }
        
      } else {
        const errorText = await precisionResponse.text();
        console.log(`❌ Precision processor failed: ${precisionResponse.status}`);
        console.log(`Error details: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`❌ Precision processor error: ${error.message}`);
    }
    
    console.log('\n🔍 ANALYSIS COMPLETE');
    console.log('Compare the two processors to identify why precision processor is not extracting data.');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugProcessors().catch(console.error);