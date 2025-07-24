// 🏦 PADDLE FINANCIAL PROCESSOR TEST
// Test the integrated PaddleOCR processor with FastAPI

import fs from 'fs';
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';
const PDF_PATH = './2. Messos  - 31.03.2025.pdf';

async function testPaddleProcessor() {
  console.log('🏦 PADDLE FINANCIAL PROCESSOR TEST');
  console.log('📋 Testing PaddleOCR 3.0 integration with FinanceAI Pro');
  console.log('');
  
  try {
    // Check if PDF exists
    if (!fs.existsSync(PDF_PATH)) {
      console.error(`❌ PDF not found: ${PDF_PATH}`);
      return;
    }
    
    console.log(`📄 Loading PDF: ${PDF_PATH}`);
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`📊 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log('');
    
    // Test server connectivity
    console.log('🔗 Testing server connectivity...');
    try {
      const healthCheck = await fetch(`${SERVER_URL}/`);
      const healthData = await healthCheck.json();
      console.log('✅ Server connected:', healthData.message);
      console.log('📋 Available endpoints:', healthData.endpoints);
      console.log('');
    } catch (error) {
      console.error('❌ Server not running. Start with: npm run local-server');
      return;
    }
    
    // Run Paddle Financial processor
    console.log('🏦 LAUNCHING PADDLE FINANCIAL PROCESSOR...');
    console.log('🔧 PaddleOCR 3.0 with PP-StructureV3');
    console.log('📊 Table recognition and financial entity extraction');
    console.log('🔍 OCR text analysis with spatial relationships');
    console.log('');
    
    const startTime = Date.now();
    
    const response = await fetch(`${SERVER_URL}/api/paddle-financial-processor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: pdfBase64,
        filename: '2. Messos - 31.03.2025.pdf'
      })
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error ${response.status}:`, errorText);
      return;
    }
    
    const result = await response.json();
    
    console.log('🏦 PADDLE FINANCIAL PROCESSING COMPLETE');
    console.log('='.repeat(80));
    
    if (result.success) {
      console.log(`✅ SUCCESS: ${result.message}`);
      console.log(`🔧 Processor: ${result.processor}`);
      console.log('');
      
      // Analysis Results
      console.log('📊 EXTRACTION ANALYSIS:');
      console.log(`🏦 Institution: ${result.data.institution || 'Unknown'}`);
      console.log(`📄 Document Type: ${result.data.documentType || 'Unknown'}`);
      console.log(`💰 Total Value Extracted: $${result.data.totalValue?.toLocaleString() || 'N/A'}`);
      console.log(`📈 Securities Found: ${result.data.securitiesCount || 0}`);
      console.log(`🎯 Confidence: ${(result.data.confidence * 100).toFixed(1)}%`);
      console.log(`⏱️  Processing Time: ${processingTime}ms`);
      console.log('');
      
      // Holdings Summary
      if (result.data.holdings && result.data.holdings.length > 0) {
        console.log(`📋 HOLDINGS EXTRACTED: ${result.data.holdings.length} securities`);
        console.log('');
        
        // Show sample holdings
        console.log('🔍 SAMPLE HOLDINGS:');
        result.data.holdings.slice(0, 5).forEach((holding, index) => {
          console.log(`${index + 1}. ${holding.securityName || 'Unknown Security'}`);
          if (holding.isin) console.log(`   ISIN: ${holding.isin}`);
          if (holding.symbol) console.log(`   Symbol: ${holding.symbol}`);
          if (holding.quantity && holding.price) {
            console.log(`   Qty: ${holding.quantity.toLocaleString()} @ $${holding.price.toFixed(2)}`);
          }
          if (holding.totalValue) {
            console.log(`   Value: $${holding.totalValue.toLocaleString()}`);
          }
          if (holding.currency) console.log(`   Currency: ${holding.currency}`);
          console.log('');
        });
        
        if (result.data.holdings.length > 5) {
          console.log(`... and ${result.data.holdings.length - 5} more securities`);
          console.log('');
        }
      }
      
      // PaddleOCR Performance Details
      if (result.analysis?.paddleOCR) {
        console.log('🏦 PADDLEOCR PERFORMANCE DETAILS:');
        console.log(`   Version: ${result.analysis.paddleOCR.version || 'N/A'}`);
        console.log(`   Structure Parser: ${result.analysis.paddleOCR.structure_parser || 'N/A'}`);
        console.log(`   Processing Time: ${result.analysis.paddleOCR.processing_time || 'N/A'}s`);
        console.log(`   Confidence: ${(result.analysis.paddleOCR.confidence * 100).toFixed(1)}%`);
        console.log(`   Tables Found: ${result.analysis.paddleOCR.tables_found || 0}`);
        console.log(`   Accounts Found: ${result.analysis.paddleOCR.accounts_found || 0}`);
        console.log('');
      }
      
      // Extraction Methods
      if (result.analysis?.extraction_methods) {
        console.log('🔧 EXTRACTION METHODS:');
        result.analysis.extraction_methods.forEach(method => {
          console.log(`   • ${method}`);
        });
        console.log('');
      }
      
      // Raw Data Preview
      if (result.raw_data?.full_text) {
        console.log('📝 TEXT SAMPLE:');
        const textSample = result.raw_data.full_text.substring(0, 300);
        console.log(`"${textSample}${result.raw_data.full_text.length > 300 ? '...' : ''}"`);
        console.log('');
      }
      
      // Tables Information
      if (result.raw_data?.tables && result.raw_data.tables.length > 0) {
        console.log(`📋 TABLES PROCESSED: ${result.raw_data.tables.length}`);
        result.raw_data.tables.forEach((table, index) => {
          console.log(`   Table ${index + 1}: ${table.rows || 0} rows, ${table.columns || 0} columns`);
        });
        console.log('');
      }
      
    } else {
      console.log(`❌ FAILURE: ${result.error}`);
      if (result.details) {
        if (Array.isArray(result.details)) {
          result.details.forEach(detail => console.log(`💬 ${detail}`));
        } else {
          console.log(`💬 Details: ${result.details}`);
        }
      }
      
      if (result.analysis?.paddleOCR?.error) {
        console.log(`🏦 PaddleOCR Error: ${result.analysis.paddleOCR.error}`);
      }
    }
    
    console.log('='.repeat(80));
    console.log('🏦 PADDLE FINANCIAL PROCESSOR TEST COMPLETE');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPaddleProcessor();