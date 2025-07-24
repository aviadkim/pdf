const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMCPEndpoint() {
  console.log('🔥 TESTING MCP ENDPOINT ON LIVE DEPLOYMENT');
  console.log('==========================================');
  
  try {
    // Test GET request (health check)
    console.log('📋 Testing MCP Health Check...');
    const healthResponse = await fetch('https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app/api/mcp', {
      method: 'GET',
      headers: {
        'User-Agent': 'MCP-Test/1.0',
        'X-MCP-Context': 'test-context'
      }
    });
    
    console.log(`Status: ${healthResponse.status}`);
    const healthText = await healthResponse.text();
    
    if (healthResponse.status === 200) {
      try {
        const healthData = JSON.parse(healthText);
        console.log('✅ MCP Health Check PASSED!');
        console.log(`✅ Message: ${healthData.message}`);
        console.log(`✅ MCP Version: ${healthData.mcp?.version}`);
        console.log(`✅ Capabilities: ${healthData.mcp?.capabilities?.join(', ')}`);
      } catch (parseError) {
        console.log('⚠️  Response not JSON:', healthText.substring(0, 200));
      }
    } else {
      console.log(`❌ Health check failed: ${healthText.substring(0, 200)}`);
    }
    
    // Test POST request with MCP action
    console.log('\\n📋 Testing MCP Process PDF Action...');
    const processResponse = await fetch('https://pdf-main-dj1iqj4v4-aviads-projects-0f56b7ac.vercel.app/api/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCP-Test/1.0',
        'X-MCP-Context': 'pdf-processing',
        'X-MCP-Version': '1.0'
      },
      body: JSON.stringify({
        action: 'process_pdf',
        data: {
          file_path: 'test.pdf',
          options: { extract_type: 'securities' }
        }
      })
    });
    
    console.log(`Status: ${processResponse.status}`);
    const processText = await processResponse.text();
    
    if (processResponse.status === 200) {
      try {
        const processData = JSON.parse(processText);
        console.log('✅ MCP Process PDF PASSED!');
        console.log(`✅ Action: ${processData.action}`);
        console.log(`✅ Processing Method: ${processData.result?.processing_method}`);
        console.log(`✅ MCP Context: ${processData.mcp_context}`);
      } catch (parseError) {
        console.log('⚠️  Response not JSON:', processText.substring(0, 200));
      }
    } else {
      console.log(`❌ Process PDF failed: ${processText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
  
  console.log('\\n🎯 MCP ENDPOINT TEST COMPLETE');
}

testMCPEndpoint().catch(console.error);