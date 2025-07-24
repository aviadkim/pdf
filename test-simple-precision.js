#!/usr/bin/env node

// 🎯 TEST SIMPLIFIED PRECISION PROCESSOR
// Test the new simplified precision processor

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSimplePrecision() {
  console.log('🎯 TESTING SIMPLIFIED PRECISION PROCESSOR');
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
    
    // Test the simplified precision processor
    console.log('\n🎯 TESTING SIMPLIFIED PRECISION PROCESSOR');
    console.log('-' * 50);
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/precision-financial-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: 'messos-simple-precision-test.pdf'
      })
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      console.log(`Error details: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('\n🎯 SIMPLIFIED PRECISION RESULTS');
    console.log('-' * 40);
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Holdings: ${result.data?.holdings?.length || 0}`);
    
    if (result.data?.holdings?.length > 0) {
      const totalValue = result.data.totalValue || 0;
      const targetValue = result.data.targetValue || 19464431;
      const accuracy = result.data.accuracy || 0;
      
      console.log(`💰 Extracted Total: $${totalValue.toLocaleString()}`);
      console.log(`🎯 Target Total: $${targetValue.toLocaleString()}`);
      console.log(`📊 Accuracy: ${(accuracy * 100).toFixed(3)}%`);
      
      // Check for UBS stock
      const ubsStock = result.data.holdings.find(h => 
        (h.securityName || h.name || '').toLowerCase().includes('ubs')
      );
      
      console.log(`🏦 UBS Stock: ${ubsStock ? '✅ Found' : '❌ Missing'}`);
      if (ubsStock) {
        console.log(`   Value: $${(ubsStock.marketValue || 0).toLocaleString()}`);
      }
      
      if (result.validation) {
        console.log('\n📊 VALIDATION RESULTS');
        console.log(`Financial Accuracy: ${(result.validation.financialAccuracy * 100).toFixed(3)}%`);
        console.log(`Quality Grade: ${result.validation.qualityGrade}`);
        console.log(`Passes Financial Threshold: ${result.validation.passesFinancialThreshold ? '✅' : '❌'}`);
        console.log(`UBS Stock Detected: ${result.validation.ubsStockDetected ? '✅' : '❌'}`);
      }
      
      if (result.metadata) {
        console.log('\n🔍 METADATA');
        console.log(`Institution: ${result.metadata.institution}`);
        console.log(`Processing Time: ${result.metadata.processingTime}`);
        console.log(`Extraction Method: ${result.metadata.extractionMethod}`);
        console.log(`Financial Grade: ${result.metadata.financialServicesGrade}`);
      }
      
      // Show sample holdings
      console.log('\n📋 SAMPLE HOLDINGS (First 5):');
      result.data.holdings.slice(0, 5).forEach((holding, i) => {
        console.log(`${i + 1}. ${holding.securityName || holding.name || 'Unknown'}`);
        console.log(`   ISIN: ${holding.isin || 'N/A'}`);
        console.log(`   Value: $${(holding.marketValue || holding.currentValue || 0).toLocaleString()}`);
        console.log(`   Category: ${holding.category || 'Unknown'}`);
        if (holding.calibrationApplied) {
          console.log(`   📊 Calibrated: ${holding.calibrationFactor}x factor applied`);
        }
      });
      
    } else {
      console.log('❌ No holdings extracted');
    }
    
    // Quality issues
    if (result.requiresHumanReview) {
      console.log('\n⚠️ QUALITY GATE FAILED - HUMAN REVIEW REQUIRED');
      if (result.validation?.qualityIssues) {
        result.validation.qualityIssues.forEach(issue => {
          console.log(`${issue.severity.toUpperCase()}: ${issue.message}`);
          console.log(`  Recommendation: ${issue.recommendation}`);
        });
      }
    } else {
      console.log('\n✅ QUALITY GATE PASSED - FINANCIAL SERVICES READY');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSimplePrecision().catch(console.error);