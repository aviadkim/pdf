// Debug URL response to see what's being returned
import fetch from 'node-fetch';

async function debugURLResponse() {
  console.log('🔍 DEBUG: URL Response');
  console.log('======================');
  
  const url = 'https://pdf-main-mvloxzj1s-aviads-projects-0f56b7ac.vercel.app/api/bulletproof-processor';
  
  try {
    console.log(`🔧 Testing GET request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📝 Content-Type: ${response.headers.get('content-type')}`);
    
    const text = await response.text();
    console.log(`📄 Response Length: ${text.length} characters`);
    console.log(`📄 First 500 characters:`);
    console.log(text.substring(0, 500));
    console.log('');
    
    // Try POST with minimal data
    console.log(`🔧 Testing POST request to: ${url}`);
    
    const postResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: 'test',
        filename: 'test.pdf'
      })
    });
    
    console.log(`📊 POST Status: ${postResponse.status} ${postResponse.statusText}`);
    console.log(`📝 POST Content-Type: ${postResponse.headers.get('content-type')}`);
    
    const postText = await postResponse.text();
    console.log(`📄 POST Response Length: ${postText.length} characters`);
    console.log(`📄 POST First 500 characters:`);
    console.log(postText.substring(0, 500));
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugURLResponse().catch(console.error);