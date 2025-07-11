// Test the upload fix with actual API call
const fs = require('fs');
const path = require('path');

async function testUploadFix() {
  console.log('🔧 Testing Upload Fix');
  
  // Test with a minimal PDF
  const testPdfBase64 = 'JVBERi0xLjQKJeL'; // Just a sample PDF header
  
  try {
    console.log('Testing POST to family-office-upload...');
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: testPdfBase64,
        filename: 'test-upload.pdf'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success! Response structure:');
      console.log('- success:', result.success);
      console.log('- message:', result.message);
      console.log('- holdings found:', result.data?.holdings?.length || 0);
      console.log('- processing method:', result.metadata?.extractionMethod);
      console.log('- processing time:', result.metadata?.processingTime);
    } else {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

testUploadFix();