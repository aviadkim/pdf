// Test a simple endpoint that should work
import fetch from 'node-fetch';
import fs from 'fs';

async function testSimpleEndpoint() {
  console.log('🔧 TESTING SIMPLE ENDPOINTS');
  console.log('===========================');
  
  const baseURL = 'https://pdf-main-mvloxzj1s-aviads-projects-0f56b7ac.vercel.app';
  const pdfPath = '/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf';
  
  const endpoints = [
    '/api/test',
    '/api/upload',
    '/api/debug',
    '/api/extract-simple',
    '/api/max-plan-processor'
  ];
  
  try {
    // Load PDF data
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    console.log(`📄 PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB`);
    console.log('');
    
    for (const endpoint of endpoints) {
      const url = baseURL + endpoint;
      console.log(`🔧 Testing: ${endpoint}`);
      
      try {
        // Try POST first
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pdfBase64: pdfBase64.substring(0, 1000), // Send just first 1KB for testing
            filename: 'test.pdf'
          })
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        
        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Success: ${JSON.stringify(result).substring(0, 100)}...`);
        } else {
          const text = await response.text();
          if (text.includes('Authentication Required')) {
            console.log(`   ❌ Auth required`);
          } else {
            console.log(`   ❌ Error: ${text.substring(0, 100)}...`);
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
      
      console.log('');
    }
    
    // Test the old domain
    console.log('🔧 Testing old domain...');
    try {
      const response = await fetch('https://claude-pdf-vercel.vercel.app/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: pdfBase64.substring(0, 1000),
          filename: 'test.pdf'
        })
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Old domain works: ${JSON.stringify(result).substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Old domain failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSimpleEndpoint().catch(console.error);