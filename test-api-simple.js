/**
 * Simple test to check if multi-agent API is working
 */

const https = require('https');

function testMultiAgentAPI() {
    console.log('🚀 Testing Multi-Agent API endpoint...');
    
    // Test without file first to see if endpoint exists
    const postData = JSON.stringify({});
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        port: 443,
        path: '/api/multi-agent-extract',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = https.request(options, (res) => {
        console.log(`📊 Status Code: ${res.statusCode}`);
        console.log(`📋 Headers:`, res.headers);
        
        let body = '';
        res.on('data', (chunk) => {
            body += chunk;
        });
        
        res.on('end', () => {
            console.log('📄 Response Body:', body);
            
            if (res.statusCode === 400) {
                console.log('✅ Endpoint exists! (Expected 400 without file)');
            } else if (res.statusCode === 404) {
                console.log('❌ Multi-agent endpoint not found');
            } else {
                console.log(`ℹ️ Unexpected response: ${res.statusCode}`);
            }
        });
    });
    
    req.on('error', (e) => {
        console.error('❌ Request failed:', e.message);
    });
    
    req.write(postData);
    req.end();
}

testMultiAgentAPI();