import fetch from 'node-fetch';

async function testLiveDeployment() {
  console.log('Testing Live Deployment...\n');
  
  // Test 1: Test single batch endpoint with small image
  console.log('1. Testing single-batch-extract with small test image...');
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
        endPage: 3,
        batchNumber: 1,
        totalBatches: 7,
        filename: 'test-19page.pdf',
        totalPages: 19
      })
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Single batch processing works!');
      console.log('Processing time:', data.metadata.processingTime);
      console.log('Image size handled:', data.metadata.imageSize);
      console.log('Batch info:', data.metadata.batchInfo);
    } else {
      const errorData = await response.json();
      console.log('❌ Single batch failed');
      console.log('Error:', errorData.error);
      console.log('Details:', errorData.details);
    }
  } catch (error) {
    console.error('❌ Single batch test error:', error.message);
  }
  
  // Test 2: Check CSV export endpoint
  console.log('\n2. Testing CSV export...');
  const sampleData = {
    portfolioInfo: {
      clientName: 'Test Client',
      bankName: 'Cornèr Banca SA',
      portfolioTotal: { value: 1000000, currency: 'USD' }
    },
    holdings: [
      {
        securityName: 'Test Security',
        isin: 'US0000000001',
        currentValue: 500000,
        currency: 'USD'
      }
    ]
  };
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/export-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: sampleData,
        filename: 'test-export'
      })
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.ok && response.headers.get('content-type')?.includes('text/csv')) {
      console.log('✅ CSV export working!');
    } else {
      console.log('❌ CSV export failed');
    }
  } catch (error) {
    console.error('❌ CSV export test error:', error.message);
  }
  
  console.log('\n🔗 Live URLs:');
  console.log('Main Interface: https://pdf-five-nu.vercel.app/api/vision-upload-batch');
  console.log('Single Batch API: https://pdf-five-nu.vercel.app/api/single-batch-extract');
  console.log('CSV Export: https://pdf-five-nu.vercel.app/api/export-csv');
}

testLiveDeployment();