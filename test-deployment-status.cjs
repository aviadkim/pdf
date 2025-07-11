// Test deployment status and debug the issue
async function testDeploymentStatus() {
  console.log('🔍 Testing Deployment Status');
  
  // Test different endpoints
  const endpoints = [
    'https://pdf-five-nu.vercel.app/api/family-office-upload',
    'https://pdf-five-nu.vercel.app/api/fixed-messos-processor',
    'https://pdf-five-nu.vercel.app/api/multiline-messos-processor'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfBase64: 'JVBERi0xLjQKJeL',
          filename: 'test.pdf'
        })
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Success - Holdings: ${result.data?.holdings?.length || 0}, Method: ${result.metadata?.extractionMethod || 'N/A'}`);
      } else {
        const error = await response.text();
        console.log(`❌ Error: ${error.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
  }
  
  // Test browser access
  console.log('\n📱 Testing Browser Access:');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload', {
      method: 'GET'
    });
    
    console.log(`GET Status: ${response.status}`);
    console.log(`GET Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const html = await response.text();
      console.log(`✅ HTML length: ${html.length}`);
      console.log(`HTML contains upload area: ${html.includes('upload-area')}`);
    }
  } catch (error) {
    console.log(`❌ Browser test error: ${error.message}`);
  }
}

testDeploymentStatus();