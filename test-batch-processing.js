import fs from 'fs';
import fetch from 'node-fetch';

async function testBatchProcessing() {
  console.log('Testing Batch Processing System...\n');
  
  // Test 1: Check if batch endpoint is accessible
  console.log('1. Testing batch-vision-extract endpoint...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/batch-vision-extract', {
      method: 'OPTIONS'
    });
    console.log('✅ Batch vision extract endpoint accessible');
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Batch vision extract OPTIONS failed:', error.message);
  }
  
  // Test 2: Test batch processing with multiple small images
  console.log('\n2. Testing batch processing with 2 batches...');
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/batch-vision-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBatches: [
          {
            imageBase64: testImageBase64,
            startPage: 1,
            endPage: 5,
            sizeKB: 1,
            sizeMB: 0.001
          },
          {
            imageBase64: testImageBase64,
            startPage: 6,
            endPage: 10,
            sizeKB: 1,
            sizeMB: 0.001
          }
        ],
        filename: 'test-batch-processing.pdf',
        totalPages: 10
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Batch processing successful');
      console.log('Total processing time:', data.metadata.totalProcessingTime);
      console.log('Average time per batch:', data.metadata.averageTimePerBatch);
      console.log('Total batches:', data.metadata.totalBatches);
      console.log('Holdings found:', data.data?.summary?.totalHoldings || 0);
    } else {
      console.log('❌ Batch processing failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.error('❌ Batch processing test error:', error.message);
  }
  
  // Test 3: Test CSV export endpoint
  console.log('\n3. Testing CSV export endpoint...');
  const testData = {
    portfolioInfo: {
      clientName: 'Test Client',
      bankName: 'Test Bank',
      accountNumber: '123456',
      reportDate: '2025-01-10',
      portfolioTotal: {
        value: 1000000,
        currency: 'USD'
      }
    },
    holdings: [
      {
        securityName: 'Test Security 1',
        isin: 'US0000000001',
        quantity: 100,
        currentValue: 500000,
        currency: 'USD',
        gainLoss: 50000,
        gainLossPercent: 10,
        category: 'Stocks'
      },
      {
        securityName: 'Test Security 2',
        isin: 'US0000000002',
        quantity: 200,
        currentValue: 500000,
        currency: 'USD',
        gainLoss: -25000,
        gainLossPercent: -5,
        category: 'Bonds'
      }
    ],
    assetAllocation: [
      { category: 'Stocks', value: 500000, percentage: '50%' },
      { category: 'Bonds', value: 500000, percentage: '50%' }
    ],
    performance: {
      ytdPercent: '5%',
      totalGainLoss: 25000
    }
  };
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/export-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: testData,
        filename: 'test-export'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.ok && response.headers.get('content-type')?.includes('text/csv')) {
      console.log('✅ CSV export working correctly');
      const csvContent = await response.text();
      console.log('CSV preview (first 200 chars):', csvContent.substring(0, 200) + '...');
    } else {
      console.log('❌ CSV export failed');
      const errorData = await response.json();
      console.log('Error:', errorData.error);
    }
  } catch (error) {
    console.error('❌ CSV export test error:', error.message);
  }
  
  // Test 4: Check new upload interface
  console.log('\n4. Testing new batch upload interface...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/vision-upload-batch');
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Batch upload interface accessible');
      const html = await response.text();
      console.log('Interface title found:', html.includes('100% Accuracy'));
    } else {
      console.log('❌ Batch upload interface not accessible');
    }
  } catch (error) {
    console.error('❌ Batch upload interface test error:', error.message);
  }
}

testBatchProcessing();