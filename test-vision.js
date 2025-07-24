import fs from 'fs';
import fetch from 'node-fetch';

async function testVisionExtraction() {
  console.log('Testing Vision Extraction API...\n');
  
  // Test 1: Check if endpoint is accessible
  console.log('1. Testing vision-test endpoint...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/vision-test');
    const data = await response.json();
    console.log('✅ Vision test endpoint:', data.status);
    console.log('✅ API Key available:', data.hasApiKey);
  } catch (error) {
    console.error('❌ Vision test failed:', error.message);
  }
  
  // Test 2: Create a simple test image (1x1 pixel PNG)
  console.log('\n2. Testing vision-extract with simple image...');
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/vision-extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: testImageBase64,
        filename: 'test-image.png'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    
    if (response.ok) {
      console.log('✅ Vision extraction works!');
      console.log('Processing time:', data.metadata.processingTime);
      console.log('Method:', data.metadata.method);
      console.log('Response preview:', JSON.stringify(data.data).substring(0, 200) + '...');
    } else {
      console.error('❌ Vision extraction failed:', data.error);
      console.error('Details:', data.details);
    }
  } catch (error) {
    console.error('❌ Vision extraction error:', error.message);
  }
  
  // Test 3: Check current deployment status
  console.log('\n3. Checking deployment status...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/debug');
    const data = await response.json();
    console.log('✅ Debug endpoint working');
    console.log('Claude API status:', data.anthropic.apiCall);
    console.log('Environment:', data.environment.nodeVersion);
  } catch (error) {
    console.error('❌ Debug endpoint failed:', error.message);
  }
}

testVisionExtraction();