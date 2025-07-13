#!/usr/bin/env node

// 🎯 TEST PRECISION FINANCIAL PROCESSOR
// Validate 99.9%+ accuracy requirement with actual Messos PDF

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPrecisionProcessor() {
  console.log('🎯 TESTING PRECISION FINANCIAL PROCESSOR');
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
    
    // Test locally by importing the processor
    console.log('🔄 Testing precision processor locally...');
    const processor = await import('./api/precision-financial-processor.js');
    
    // Mock request/response for local testing
    const mockReq = {
      method: 'POST',
      body: {
        pdfBase64: pdfBase64,
        filename: 'messos-test.pdf'
      }
    };
    
    const mockRes = {
      headers: {},
      statusCode: 200,
      setHeader: function(key, value) { this.headers[key] = value; },
      status: function(code) { this.statusCode = code; return this; },
      json: function(data) { 
        this.responseData = data; 
        return this; 
      },
      end: function() { return this; }
    };
    
    console.log('⚡ Starting precision processing...');
    const startTime = Date.now();
    
    await processor.default(mockReq, mockRes);
    
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Processing completed in ${processingTime}ms`);
    
    // Analyze results
    if (mockRes.responseData) {
      const result = mockRes.responseData;
      
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
        
      } else {
        console.log('❌ No holdings data returned');
      }
      
    } else {
      console.log('❌ No response data from processor');
      console.log(`Response Status: ${mockRes.statusCode}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPrecisionProcessor().catch(console.error);