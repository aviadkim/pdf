// Test Render API key configuration
const https = require('https');

async function testRenderAPIKeys() {
    console.log('🔍 Testing Render API Key Configuration...');
    
    const endpoints = [
        '/api/claude-test',
        '/api/claude-vision-extract',
        '/api/hybrid-extract',
        '/api/hybrid-extract-fixed',
        '/api/system-capabilities'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`\n📡 Testing: ${endpoint}`);
            
            const response = await fetch(`https://pdf-fzzi.onrender.com${endpoint}`, {
                method: 'GET',
                timeout: 10000
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${endpoint}: Available`);
                
                // Check for API key indicators
                const jsonStr = JSON.stringify(data);
                if (jsonStr.includes('ANTHROPIC_API_KEY')) {
                    console.log('🔑 Claude API key mentioned in response');
                }
                if (jsonStr.includes('not configured') || jsonStr.includes('not found')) {
                    console.log('⚠️ API key not configured');
                }
                if (jsonStr.includes('configured') && !jsonStr.includes('not configured')) {
                    console.log('✅ Some API key is configured');
                }
                
                // Show relevant parts of response
                if (data.environment) {
                    console.log('🌍 Environment:', JSON.stringify(data.environment, null, 2));
                }
                if (data.error && data.error.includes('API_KEY')) {
                    console.log('❌ API Key Error:', data.error);
                }
                
            } else {
                console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
}

// Also test a direct Claude Vision API call simulation
async function testDirectClaudeAPI() {
    try {
        console.log('\n🤖 Testing direct Claude API simulation...');
        
        // This simulates what our Claude Vision processor would do
        const testEndpoint = 'https://pdf-fzzi.onrender.com/api/claude-test';
        
        const response = await fetch(testEndpoint);
        const data = await response.json();
        
        console.log('📊 Claude Test Response:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.success === false && data.error?.includes('ANTHROPIC_API_KEY not configured')) {
            console.log('\n🔧 DIAGNOSIS: API key needs to be set in Render environment variables');
            console.log('📝 Required variable: ANTHROPIC_API_KEY');
            console.log('🌐 Should be set in Render dashboard > Environment Variables');
        }
        
    } catch (error) {
        console.error('❌ Direct Claude API test error:', error.message);
    }
}

testRenderAPIKeys().then(() => testDirectClaudeAPI());