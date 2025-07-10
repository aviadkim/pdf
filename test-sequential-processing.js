import fs from 'fs';
import fetch from 'node-fetch';

async function testSequentialProcessing() {
  console.log('Testing Sequential Batch Processing...\n');
  
  // Test 1: Check if single-batch endpoint is accessible
  console.log('1. Testing single-batch-extract endpoint...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/single-batch-extract', {
      method: 'OPTIONS'
    });
    console.log('✅ Single batch extract endpoint accessible');
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Single batch extract OPTIONS failed:', error.message);
  }
  
  // Test 2: Test single batch processing
  console.log('\n2. Testing single batch processing...');
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/single-batch-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: testImageBase64,
        startPage: 1,
        endPage: 5,
        batchNumber: 1,
        totalBatches: 4,
        filename: 'test-sequential.pdf',
        totalPages: 19
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Single batch processing successful');
      console.log('Batch number:', data.batchNumber);
      console.log('Processing time:', data.metadata.processingTime);
      console.log('Method:', data.metadata.method);
      console.log('Holdings found:', data.data?.holdings?.length || 0);
      console.log('Image size:', data.metadata.imageSize);
    } else {
      console.log('❌ Single batch processing failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.error('❌ Single batch test error:', error.message);
  }
  
  // Test 3: Test sequential processing with multiple batches
  console.log('\n3. Testing sequential processing simulation...');
  
  const batches = [
    { startPage: 1, endPage: 5, batchNumber: 1 },
    { startPage: 6, endPage: 10, batchNumber: 2 },
    { startPage: 11, endPage: 15, batchNumber: 3 },
    { startPage: 16, endPage: 19, batchNumber: 4 }
  ];
  
  const results = [];
  
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Processing batch ${batch.batchNumber} (pages ${batch.startPage}-${batch.endPage})...`);
    
    try {
      const response = await fetch('https://pdf-five-nu.vercel.app/api/single-batch-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: testImageBase64,
          startPage: batch.startPage,
          endPage: batch.endPage,
          batchNumber: batch.batchNumber,
          totalBatches: batches.length,
          filename: 'test-sequential-multi.pdf',
          totalPages: 19
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ Batch ${batch.batchNumber} successful - ${data.data?.holdings?.length || 0} holdings`);
        results.push(data);
      } else {
        console.log(`❌ Batch ${batch.batchNumber} failed: ${data.error}`);
      }
      
      // Add delay between batches (like in real implementation)
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`❌ Batch ${batch.batchNumber} error:`, error.message);
    }
  }
  
  console.log(`\n📊 Sequential Processing Results:`);
  console.log(`Total batches processed: ${results.length} of ${batches.length}`);
  console.log(`Total holdings found: ${results.reduce((sum, r) => sum + (r.data?.holdings?.length || 0), 0)}`);
  
  // Test 4: Check new upload interface
  console.log('\n4. Testing updated batch upload interface...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/vision-upload-batch');
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Updated batch upload interface accessible');
      const html = await response.text();
      console.log('Sequential processing found:', html.includes('Processing each batch sequentially'));
    } else {
      console.log('❌ Updated batch upload interface not accessible');
    }
  } catch (error) {
    console.error('❌ Updated batch upload interface test error:', error.message);
  }
}

testSequentialProcessing();