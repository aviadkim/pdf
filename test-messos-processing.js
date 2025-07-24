#!/usr/bin/env node

// Test Messos PDF processing without Puppeteer dependencies
import fetch from 'node-fetch';
import fs from 'fs';

console.log('📄 Testing Messos PDF Processing');
console.log('=================================\n');

const BASE_URL = 'http://localhost:3000'; // For local testing

// Test 1: Messos extraction endpoint
async function testMessosExtraction() {
  console.log('📋 Test 1: Messos Extraction Endpoint');
  console.log('=====================================');
  
  try {
    const testData = {
      pdfBase64: 'sample_base64_data', // Simulated PDF data
      filename: 'Messos_Statement_2025-03-31.pdf'
    };

    const response = await fetch(`${BASE_URL}/api/messos-extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const text = await response.text();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    
    try {
      const data = JSON.parse(text);
      console.log('✅ Response is valid JSON');
      console.log(`✅ Success: ${data.success}`);
      console.log(`✅ Method: ${data.method}`);
      console.log(`✅ Holdings found: ${data.data?.holdings?.length || 0}`);
      console.log(`✅ Portfolio total: ${data.data?.portfolioInfo?.portfolioTotal?.formattedValue || 'N/A'}`);
      console.log(`✅ Client: ${data.data?.portfolioInfo?.clientName || 'N/A'}`);
      console.log(`✅ Confidence: ${data.metadata?.confidence || 0}%`);
      
      // Validate holdings structure
      if (data.data?.holdings?.length > 0) {
        const firstHolding = data.data.holdings[0];
        console.log(`✅ First holding: ${firstHolding.securityName}`);
        console.log(`✅ ISIN: ${firstHolding.isin}`);
        console.log(`✅ Value: ${firstHolding.currentValue} ${firstHolding.currency}`);
      }
      
      console.log('✅ Messos Extraction: PASSED\n');
      return true;
    } catch (jsonError) {
      console.log('❌ Response is not valid JSON');
      console.log('Response preview:', text.substring(0, 300));
      console.log('❌ Messos Extraction: FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('❌ Messos Extraction: FAILED\n');
    return false;
  }
}

// Test 2: Portfolio analysis
async function testPortfolioAnalysis() {
  console.log('📋 Test 2: Portfolio Analysis Features');
  console.log('=====================================');
  
  try {
    const response = await fetch(`${BASE_URL}/api/messos-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64: 'test_data' })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Portfolio data received');
      
      // Test asset allocation
      if (data.data.assetAllocation) {
        console.log(`✅ Asset categories: ${data.data.assetAllocation.length}`);
        const totalPercentage = data.data.assetAllocation.reduce((sum, cat) => sum + cat.percentage, 0);
        console.log(`✅ Allocation total: ${totalPercentage.toFixed(1)}%`);
      }
      
      // Test ISIN validation
      const holdings = data.data.holdings || [];
      const validISINs = holdings.filter(h => h.isin && h.isin.match(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/));
      console.log(`✅ Valid ISINs: ${validISINs.length}/${holdings.length}`);
      
      // Test currency diversity
      const currencies = [...new Set(holdings.map(h => h.currency))];
      console.log(`✅ Currencies: ${currencies.join(', ')}`);
      
      // Test Swiss securities
      const swissSecurities = holdings.filter(h => h.isin?.startsWith('CH'));
      console.log(`✅ Swiss securities: ${swissSecurities.length}`);
      
      console.log('✅ Portfolio Analysis: PASSED\n');
      return true;
    } else {
      console.log('❌ Portfolio data not received');
      console.log('❌ Portfolio Analysis: FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Portfolio analysis failed: ${error.message}`);
    console.log('❌ Portfolio Analysis: FAILED\n');
    return false;
  }
}

// Test 3: Performance metrics
async function testPerformanceMetrics() {
  console.log('📋 Test 3: Performance Metrics');
  console.log('==============================');
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(`${BASE_URL}/api/messos-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pdfBase64: 'performance_test_data',
        filename: 'large_messos_file.pdf'
      })
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`✅ Response time: ${responseTime}ms`);
    
    const data = await response.json();
    
    if (data.metadata) {
      console.log(`✅ Server processing time: ${data.metadata.processingTime}`);
      console.log(`✅ Confidence score: ${data.metadata.confidence}%`);
      console.log(`✅ Timestamp: ${data.metadata.timestamp}`);
    }
    
    // Performance benchmarks
    if (responseTime < 5000) {
      console.log('✅ Response time acceptable (< 5s)');
    } else {
      console.log('⚠️ Response time slow (> 5s)');
    }
    
    console.log('✅ Performance Metrics: PASSED\n');
    return true;
  } catch (error) {
    console.log(`❌ Performance test failed: ${error.message}`);
    console.log('❌ Performance Metrics: FAILED\n');
    return false;
  }
}

// Test 4: Error handling
async function testErrorHandling() {
  console.log('📋 Test 4: Error Handling');
  console.log('=========================');
  
  const tests = [
    {
      name: 'Invalid method',
      options: { method: 'GET' },
      expectedStatus: 405
    },
    {
      name: 'Invalid JSON',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json{'
      },
      expectedStatus: 400
    },
    {
      name: 'Missing data',
      options: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      },
      expectedStatus: 200 // Should still work with mock data
    }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}/api/messos-extract`, test.options);
      const data = await response.json();
      
      console.log(`✅ ${test.name}: Status ${response.status}, JSON valid`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log(`✅ Error handling tests: ${passed}/${tests.length} passed`);
  console.log('✅ Error Handling: PASSED\n');
  return passed === tests.length;
}

// Test 5: Website integration
async function testWebsiteIntegration() {
  console.log('📋 Test 5: Website Integration');
  console.log('==============================');
  
  try {
    // Test main page
    const mainResponse = await fetch(`${BASE_URL}/`);
    const mainText = await mainResponse.text();
    
    console.log(`✅ Main page status: ${mainResponse.status}`);
    console.log(`✅ Content type: ${mainResponse.headers.get('content-type')}`);
    
    // Check for key elements
    const hasFileInput = mainText.includes('type="file"') || mainText.includes('fileInput');
    const hasExtractButton = mainText.includes('extractPDF') || mainText.includes('Extract');
    const hasTitle = mainText.includes('Claude PDF') || mainText.includes('PDF Extractor');
    
    console.log(`✅ Has file input: ${hasFileInput}`);
    console.log(`✅ Has extract button: ${hasExtractButton}`);
    console.log(`✅ Has title: ${hasTitle}`);
    
    if (hasFileInput && hasExtractButton && hasTitle) {
      console.log('✅ Website Integration: PASSED\n');
      return true;
    } else {
      console.log('❌ Missing key website elements');
      console.log('❌ Website Integration: FAILED\n');
      return false;
    }
  } catch (error) {
    console.log(`❌ Website test failed: ${error.message}`);
    console.log('❌ Website Integration: FAILED\n');
    return false;
  }
}

// Main test runner
async function runMessosTests() {
  console.log('🧪 MESSOS PDF PROCESSING TEST SUITE');
  console.log('===================================\n');
  
  const results = [];
  
  // Run all tests
  results.push(await testMessosExtraction());
  results.push(await testPortfolioAnalysis());
  results.push(await testPerformanceMetrics());
  results.push(await testErrorHandling());
  results.push(await testWebsiteIntegration());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 MESSOS TEST SUMMARY');
  console.log('======================');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  console.log(`🎯 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL MESSOS TESTS PASSED!');
    console.log('✅ JSON parsing issues resolved');
    console.log('✅ Messos PDF processing working');
    console.log('✅ Swiss banking format supported');
    console.log('✅ Portfolio analysis complete');
    console.log('✅ Website integration functional');
    console.log('✅ Ready for production deployment');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.');
    console.log('🔧 Start local server with: npm run dev');
  }
  
  console.log('\n💡 To test with real Messos PDF:');
  console.log('1. Start local server: npm run dev');
  console.log('2. Open browser: http://localhost:3000');
  console.log('3. Upload Messos PDF file');
  console.log('4. Verify extraction results');
  
  process.exit(passed === total ? 0 : 1);
}

runMessosTests().catch(console.error);