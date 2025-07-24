// Debug the API response to see what's actually being returned
const fs = require('fs');
const path = require('path');

async function debugApiResponse() {
  console.log('🔍 Debugging API Response');
  
  // Test the fixed processor endpoint
  const testPdf = 'JVBERi0xLjQKJeL'; // Just a sample PDF header in base64
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/fixed-messos-processor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        pdfBase64: testPdf,
        filename: 'test.pdf'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response text (first 500 chars):', responseText.substring(0, 500));
    
    // Check if it's HTML
    if (responseText.startsWith('<')) {
      console.log('❌ API returned HTML instead of JSON');
      console.log('This indicates the endpoint is not working properly');
    } else {
      console.log('✅ API returned text that looks like JSON');
    }
    
  } catch (error) {
    console.error('❌ Fetch error:', error);
  }
}

debugApiResponse();