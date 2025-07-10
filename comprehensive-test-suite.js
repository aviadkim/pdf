#!/usr/bin/env node
/**
 * Comprehensive Test Suite for PDF Processing System
 * Simulates SuperClaude /test --e2e functionality
 */

import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'https://pdf-five-nu.vercel.app';
const TEST_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

class PDFProcessingTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runTest(name, testFn) {
    console.log(`\n🧪 Testing: ${name}`);
    this.results.total++;
    
    try {
      const result = await testFn();
      if (result.success) {
        console.log(`✅ PASS: ${name}`);
        this.results.passed++;
        if (result.details) console.log(`   Details: ${result.details}`);
      } else {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Reason: ${result.reason}`);
        this.results.failed++;
        this.results.errors.push({ test: name, reason: result.reason });
      }
    } catch (error) {
      console.log(`❌ ERROR: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.results.failed++;
      this.results.errors.push({ test: name, reason: error.message });
    }
  }

  async testEndpointAvailability() {
    return this.runTest('Endpoint Availability', async () => {
      const endpoints = [
        '/api/vision-upload-batch',
        '/api/single-batch-extract',
        '/api/export-csv'
      ];
      
      for (const endpoint of endpoints) {
        const response = await fetch(`${BASE_URL}${endpoint}`, { method: 'HEAD' });
        if (!response.ok && response.status !== 405) {
          return { success: false, reason: `${endpoint} returned ${response.status}` };
        }
      }
      
      return { success: true, details: 'All endpoints accessible' };
    });
  }

  async testSingleBatchProcessing() {
    return this.runTest('Single Batch Processing', async () => {
      const response = await fetch(`${BASE_URL}/api/single-batch-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: TEST_IMAGE,
          startPage: 1,
          endPage: 3,
          batchNumber: 1,
          totalBatches: 7,
          filename: 'test.pdf',
          totalPages: 19
        })
      });
      
      if (!response.ok) {
        return { success: false, reason: `API returned ${response.status}` };
      }
      
      const data = await response.json();
      
      if (!data.success || !data.metadata) {
        return { success: false, reason: 'Invalid response structure' };
      }
      
      return { 
        success: true, 
        details: `Processed in ${data.metadata.processingTime}, batch ${data.batchNumber}` 
      };
    });
  }

  async testSequentialBatchProcessing() {
    return this.runTest('Sequential Batch Processing (3 batches)', async () => {
      const batches = [
        { startPage: 1, endPage: 3, batchNumber: 1 },
        { startPage: 4, endPage: 6, batchNumber: 2 },
        { startPage: 7, endPage: 9, batchNumber: 3 }
      ];
      
      const results = [];
      
      for (const batch of batches) {
        const response = await fetch(`${BASE_URL}/api/single-batch-extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: TEST_IMAGE,
            startPage: batch.startPage,
            endPage: batch.endPage,
            batchNumber: batch.batchNumber,
            totalBatches: 3,
            filename: 'sequential-test.pdf',
            totalPages: 9
          })
        });
        
        if (!response.ok) {
          return { success: false, reason: `Batch ${batch.batchNumber} failed with ${response.status}` };
        }
        
        const data = await response.json();
        results.push(data);
        
        // Add delay like real implementation
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      return { 
        success: true, 
        details: `3 batches processed successfully, average time: ${results.reduce((sum, r) => sum + parseInt(r.metadata.processingTime), 0) / 3}ms` 
      };
    });
  }

  async testCSVExport() {
    return this.runTest('CSV Export Functionality', async () => {
      const testData = {
        portfolioInfo: {
          clientName: 'Test Client',
          bankName: 'Cornèr Banca SA',
          accountNumber: 'ACC123456',
          reportDate: '2025-01-10',
          portfolioTotal: { value: 1500000, currency: 'USD' }
        },
        holdings: [
          {
            securityName: 'EXIGENT ENHANCED INCOME FUND',
            isin: 'XD0466760473',
            quantity: 100,
            currentValue: 750000,
            currency: 'USD',
            gainLoss: 75000,
            gainLossPercent: 10,
            category: 'Bonds'
          },
          {
            securityName: 'NATIXIS STRUCTURED NOTES',
            isin: 'XS1700087403',
            quantity: 200,
            currentValue: 750000,
            currency: 'USD',
            gainLoss: -25000,
            gainLossPercent: -3.33,
            category: 'Structured Products'
          }
        ],
        assetAllocation: [
          { category: 'Bonds', value: 750000, percentage: '50%' },
          { category: 'Structured Products', value: 750000, percentage: '50%' }
        ],
        performance: {
          ytdPercent: '3.5%',
          totalGainLoss: 50000
        }
      };
      
      const response = await fetch(`${BASE_URL}/api/export-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: testData,
          filename: 'test-export'
        })
      });
      
      if (!response.ok) {
        return { success: false, reason: `CSV export failed with ${response.status}` };
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/csv')) {
        return { success: false, reason: `Wrong content type: ${contentType}` };
      }
      
      const csvContent = await response.text();
      
      // Check CSV structure
      const requiredFields = ['Security Name', 'ISIN', 'Current Value', 'PORTFOLIO SUMMARY'];
      const missingFields = requiredFields.filter(field => !csvContent.includes(field));
      
      if (missingFields.length > 0) {
        return { success: false, reason: `Missing CSV fields: ${missingFields.join(', ')}` };
      }
      
      return { 
        success: true, 
        details: `CSV generated with ${csvContent.split('\n').length} lines` 
      };
    });
  }

  async testMainInterface() {
    return this.runTest('Main Interface Accessibility', async () => {
      const response = await fetch(`${BASE_URL}/api/vision-upload-batch`);
      
      if (!response.ok) {
        return { success: false, reason: `Interface returned ${response.status}` };
      }
      
      const html = await response.text();
      
      // Check for key elements
      const requiredElements = [
        'Claude Vision PDF Extractor',
        '100% Accuracy',
        'Process PDF with 100% Accuracy',
        'sequential'
      ];
      
      const missingElements = requiredElements.filter(element => !html.includes(element));
      
      if (missingElements.length > 0) {
        return { success: false, reason: `Missing elements: ${missingElements.join(', ')}` };
      }
      
      return { success: true, details: 'All UI elements present' };
    });
  }

  async testErrorHandling() {
    return this.runTest('Error Handling', async () => {
      // Test with missing data
      const response = await fetch(`${BASE_URL}/api/single-batch-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Empty body
      });
      
      if (response.ok) {
        return { success: false, reason: 'Should have failed with empty body' };
      }
      
      if (response.status !== 400) {
        return { success: false, reason: `Expected 400, got ${response.status}` };
      }
      
      const errorData = await response.json();
      
      if (!errorData.error) {
        return { success: false, reason: 'Error response missing error field' };
      }
      
      return { success: true, details: `Proper error handling: ${errorData.error}` };
    });
  }

  async testPerformance() {
    return this.runTest('Performance Benchmarks', async () => {
      const start = Date.now();
      
      const response = await fetch(`${BASE_URL}/api/single-batch-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: TEST_IMAGE,
          startPage: 1,
          endPage: 3,
          batchNumber: 1,
          totalBatches: 1,
          filename: 'performance-test.pdf',
          totalPages: 3
        })
      });
      
      const responseTime = Date.now() - start;
      
      if (!response.ok) {
        return { success: false, reason: `Performance test failed: ${response.status}` };
      }
      
      const data = await response.json();
      const apiProcessingTime = parseInt(data.metadata.processingTime);
      
      // Check if performance is within acceptable ranges
      if (responseTime > 10000) { // 10 seconds
        return { success: false, reason: `Response too slow: ${responseTime}ms` };
      }
      
      return { 
        success: true, 
        details: `Response: ${responseTime}ms, Processing: ${apiProcessingTime}ms` 
      };
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive PDF Processing Test Suite\n');
    console.log('=' * 60);
    
    // Run all tests
    await this.testEndpointAvailability();
    await this.testMainInterface();
    await this.testSingleBatchProcessing();
    await this.testSequentialBatchProcessing();
    await this.testCSVExport();
    await this.testErrorHandling();
    await this.testPerformance();
    
    // Print summary
    console.log('\n' + '=' * 60);
    console.log('📊 TEST SUMMARY');
    console.log('=' * 60);
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed} ✅`);
    console.log(`Failed: ${this.results.failed} ❌`);
    console.log(`Success Rate: ${Math.round((this.results.passed / this.results.total) * 100)}%`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.reason}`);
      });
    }
    
    console.log('\n🎯 SYSTEM STATUS:');
    if (this.results.failed === 0) {
      console.log('🟢 ALL SYSTEMS OPERATIONAL - Ready for production use');
    } else if (this.results.failed <= 2) {
      console.log('🟡 MINOR ISSUES DETECTED - Most functionality working');
    } else {
      console.log('🔴 MAJOR ISSUES DETECTED - System needs attention');
    }
    
    return this.results;
  }
}

// Run the test suite
const testSuite = new PDFProcessingTestSuite();
testSuite.runAllTests().then(results => {
  process.exit(results.failed > 0 ? 1 : 0);
});