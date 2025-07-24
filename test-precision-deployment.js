#!/usr/bin/env node

// 🎯 TEST PRECISION PROCESSOR DEPLOYMENT
// Test the deployed precision processor on Vercel

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPrecisionDeployment() {
  console.log('🎯 TESTING PRECISION PROCESSOR DEPLOYMENT');
  console.log('=' * 50);

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
    
    // Test the precision processor endpoint
    console.log('🌐 Testing precision processor endpoint...');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/precision-financial-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-precision-test.pdf'
      })
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('\n🎯 PRECISION PROCESSOR RESULTS');
    console.log('-' * 40);
    console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Message: ${result.message || 'No message'}`);
    
    if (result.data && result.data.holdings) {
      console.log(`📊 Holdings Extracted: ${result.data.holdings.length}`);
      
      const totalValue = result.data.holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
      console.log(`💰 Total Value: $${totalValue.toLocaleString()}`);
      console.log(`🎯 Target Value: $19,464,431`);
      
      const accuracy = Math.min(totalValue, 19464431) / Math.max(totalValue, 19464431);
      console.log(`🎯 Accuracy: ${(accuracy * 100).toFixed(3)}%`);
      
      // Check for UBS stock specifically
      const ubsStock = result.data.holdings.find(h => 
        h.name && h.name.toLowerCase().includes('ubs')
      );
      
      if (ubsStock) {
        console.log(`✅ UBS Stock Found: $${ubsStock.marketValue?.toLocaleString()}`);
      } else {
        console.log(`❌ UBS Stock Missing (Expected: $24,319)`);
      }
      
      if (result.validation) {
        console.log('\n📊 VALIDATION RESULTS');
        console.log(`Mathematical Accuracy: ${(result.validation.mathematicalAccuracy * 100).toFixed(2)}%`);
        console.log(`AI Confidence: ${(result.validation.aiConfidence * 100).toFixed(2)}%`);
        console.log(`Quality Grade: ${result.validation.qualityGrade}`);
        console.log(`Institution Specific: ${result.validation.institutionSpecific ? '✅' : '❌'}`);
      }
      
      if (result.metadata) {
        console.log('\n🔍 PROCESSING METADATA');
        console.log(`Institution: ${result.metadata.institution}`);
        console.log(`Document Type: ${result.metadata.documentType}`);
        console.log(`OCR Engines: ${result.metadata.ocrEngines?.join(', ') || 'Unknown'}`);
        console.log(`Processing Time: ${result.metadata.processingTime}`);
      }
      
      // Quality gate check
      if (result.requiresHumanReview) {
        console.log('\n⚠️ QUALITY GATE FAILED - HUMAN REVIEW REQUIRED');
        if (result.qualityIssues) {
          result.qualityIssues.forEach(issue => {
            console.log(`${issue.severity.toUpperCase()}: ${issue.message}`);
          });
        }
      } else {
        console.log('\n✅ QUALITY GATE PASSED - ENTERPRISE READY');
      }
      
      // Show sample holdings
      console.log('\n📋 SAMPLE HOLDINGS (First 5):');
      result.data.holdings.slice(0, 5).forEach((holding, i) => {
        console.log(`${i + 1}. ${holding.name || 'Unknown'}`);
        console.log(`   ISIN: ${holding.isin || 'N/A'}`);
        console.log(`   Value: $${(holding.marketValue || 0).toLocaleString()}`);
        console.log(`   Category: ${holding.category || 'Unknown'}`);
      });
      
    } else {
      console.log('❌ No holdings data returned');
      if (result.error) {
        console.log(`Error: ${result.error}`);
        console.log(`Details: ${result.details}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Fallback: Test with intelligent processor for comparison
    console.log('\n🔄 Fallback: Testing with intelligent processor...');
    try {
      const fallbackResponse = await fetch('https://pdf-five-nu.vercel.app/api/intelligent-messos-processor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: pdfBase64,
          filename: 'messos-fallback-test.pdf'
        })
      });
      
      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json();
        console.log(`✅ Intelligent processor working: ${fallbackResult.data?.holdings?.length || 0} holdings`);
        
        if (fallbackResult.data?.holdings) {
          const fallbackTotal = fallbackResult.data.holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
          console.log(`💰 Intelligent processor total: $${fallbackTotal.toLocaleString()}`);
        }
      }
    } catch (fallbackError) {
      console.log('❌ Fallback test also failed:', fallbackError.message);
    }
  }
}

// Run the test
testPrecisionDeployment().catch(console.error);