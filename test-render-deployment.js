// 🚀 Test Render Deployment - MCP-Enhanced PDF Processor
// Test script to verify all capabilities work on Render

const RENDER_URL = 'https://mcp-pdf-processor.onrender.com'; // Update with your actual URL

async function testRenderDeployment() {
    console.log('🚀 Testing Render MCP-Enhanced PDF Processor...');
    console.log(`📡 Target URL: ${RENDER_URL}`);
    
    const tests = [
        {
            name: '✅ Basic Health Check',
            endpoint: '/api/test',
            method: 'GET'
        },
        {
            name: '🎯 Real PDF Extractor',
            endpoint: '/api/real-pdf-extractor',
            method: 'POST',
            body: { testMode: true }
        },
        {
            name: '🚀 MCP-Enhanced Processor',
            endpoint: '/api/mcp-enhanced-processor',
            method: 'POST',
            body: { testMode: true }
        },
        {
            name: '🤖 Puppeteer Test',
            endpoint: '/api/test',
            method: 'POST',
            body: { testPuppeteer: true }
        }
    ];
    
    for (const test of tests) {
        console.log(`\n${test.name}:`);
        try {
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }
            
            const response = await fetch(`${RENDER_URL}${test.endpoint}`, options);
            const result = await response.json();
            
            if (response.ok) {
                console.log(`   ✅ SUCCESS: ${response.status}`);
                if (result.extractedData?.securities?.length > 0) {
                    console.log(`   📊 Securities found: ${result.extractedData.securities.length}`);
                    console.log(`   💰 Total value: $${result.extractedData.totalValue?.toLocaleString()}`);
                }
                if (result.mcpEnhanced) {
                    console.log(`   🔥 MCP Enhanced: ${result.mcpEnhanced}`);
                }
                if (result.playwrightUsed || result.puppeteerUsed) {
                    console.log(`   🎭 Browser automation: Playwright=${result.playwrightUsed}, Puppeteer=${result.puppeteerUsed}`);
                }
            } else {
                console.log(`   ❌ FAILED: ${response.status}`);
                console.log(`   Error: ${result.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.log(`   ❌ NETWORK ERROR: ${error.message}`);
        }
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🏁 Testing complete!');
    console.log('\n📝 Next steps:');
    console.log('1. ✅ Basic API should work immediately');
    console.log('2. 🔄 MCP/Puppeteer may take 2-3 minutes for first run (browser installation)');
    console.log('3. 📤 Upload real PDFs through the web interface');
    console.log('4. 🎯 Test with actual Messos PDF for real data extraction');
}

// Run if called directly
if (require.main === module) {
    testRenderDeployment().catch(console.error);
}

module.exports = { testRenderDeployment };