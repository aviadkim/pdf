import fs from 'fs';
import fetch from 'node-fetch';

async function testSmartVisionExtraction() {
  console.log('Testing Smart Vision Extraction API...\n');
  
  // Test 1: Check if endpoint is accessible
  console.log('1. Testing smart-vision-extract endpoint...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/smart-vision-extract', {
      method: 'OPTIONS'
    });
    console.log('✅ Smart vision extract endpoint accessible');
    console.log('Status:', response.status);
  } catch (error) {
    console.error('❌ Smart vision extract OPTIONS failed:', error.message);
  }
  
  // Test 2: Test with oversized image (should return error)
  console.log('\n2. Testing oversized image handling...');
  // Create a large base64 string (simulating > 5MB image)
  const largeImageBase64 = 'A'.repeat(10000000); // ~10MB worth of data
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/smart-vision-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: largeImageBase64,
        filename: 'large-test.pdf',
        imageInfo: {
          totalPages: 19,
          sizeKB: 10000,
          sizeMB: 10.0
        }
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (response.status === 413) {
      console.log('✅ Large image correctly rejected');
      console.log('Error:', data.error);
      console.log('Suggestions:', data.suggestions);
    } else {
      console.log('❌ Large image not handled correctly');
      console.log('Response:', data);
    }
  } catch (error) {
    console.error('❌ Large image test error:', error.message);
  }
  
  // Test 3: Test with valid small image
  console.log('\n3. Testing valid small image...');
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/smart-vision-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: testImageBase64,
        filename: 'test-small.pdf',
        imageInfo: {
          totalPages: 1,
          sizeKB: 1,
          sizeMB: 0.001
        }
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Small image processed successfully');
      console.log('Processing time:', data.metadata.processingTime);
      console.log('Method:', data.metadata.method);
      console.log('Image size info:', data.metadata.imageSize);
    } else {
      console.log('❌ Small image processing failed');
      console.log('Error:', data.error);
      console.log('Details:', data.details);
    }
  } catch (error) {
    console.error('❌ Small image test error:', error.message);
  }
}

testSmartVisionExtraction();