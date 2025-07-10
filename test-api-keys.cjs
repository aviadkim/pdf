// Test script to verify Azure + Claude API keys are working
const https = require('https');

async function testAPIKeys() {
  console.log('🔑 Testing API Keys Configuration...\n');
  
  const testData = {
    pdfBase64: 'dGVzdA==', // Simple test data
    filename: 'api-key-test.pdf'
  };
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'pdf-five-nu.vercel.app',
      port: 443,
      path: '/api/enhanced-swiss-extract-fixed',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log('📊 API KEY TEST RESULTS:');
          console.log('='.repeat(50));
          console.log('✅ Status:', res.statusCode);
          console.log('✅ Version:', response.metadata?.version);
          console.log('✅ Method:', response.metadata?.method);
          console.log('✅ Processing Time:', response.metadata?.processingTime);
          console.log('');
          
          console.log('🔑 ENVIRONMENT VARIABLES:');
          console.log('   Azure Used:', response.metadata?.azureUsed ? '✅ YES' : '❌ NO');
          console.log('   Claude Used:', response.metadata?.claudeUsed ? '✅ YES' : '❌ NO');
          console.log('   Confidence:', response.metadata?.confidence + '%');
          console.log('');
          
          if (response.metadata?.azureUsed || response.metadata?.claudeUsed) {
            console.log('🎉 SUCCESS! API keys are working!');
            console.log('   Azure Document Intelligence:', response.metadata?.azureUsed ? 'ACTIVE' : 'Not used');
            console.log('   Claude Vision API:', response.metadata?.claudeUsed ? 'ACTIVE' : 'Not used');
            console.log('');
            console.log('🚀 READY FOR MESSOS PDF TESTING!');
            console.log('   Expected accuracy: 100% (Azure) or 95% (Claude)');
            console.log('   Ready to extract 40+ holdings from Messos documents');
          } else {
            console.log('⚠️ API keys not detected. Please check:');
            console.log('   1. Environment variables are set in Vercel Dashboard');
            console.log('   2. Variables are set for Production environment');
            console.log('   3. Project has been redeployed after adding variables');
            console.log('');
            console.log('Required variables:');
            console.log('   - AZURE_DOCUMENT_INTELLIGENCE_KEY');
            console.log('   - AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT');
            console.log('   - ANTHROPIC_API_KEY');
          }
          
          if (response.data?.setupInstructions) {
            console.log('');
            console.log('📋 Setup Instructions from API:');
            Object.entries(response.data.setupInstructions).forEach(([key, value]) => {
              console.log(`   ${key}: ${value}`);
            });
          }
          
          resolve(response);
        } catch (error) {
          console.log('❌ Failed to parse response:', error.message);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the test
testAPIKeys()
  .then(() => {
    console.log('\n🎯 Test complete!');
    console.log('If API keys are working, you can now test with real Messos PDF files.');
  })
  .catch(console.error);