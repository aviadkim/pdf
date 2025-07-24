// Debug why page-by-page endpoints are returning 404
const https = require('https');

async function debugEndpoints() {
    console.log('🔍 DEBUGGING ENDPOINT AVAILABILITY');
    console.log('=================================');
    
    const baseUrl = 'pdf-production-5dis.onrender.com';
    const endpoints = [
        '/api/diagnostic',
        '/api/99-percent-processor', 
        '/api/99-percent-enhanced',
        '/api/page-by-page-processor',
        '/api/bulletproof-processor'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing ${endpoint}...`);
        
        try {
            const options = {
                hostname: baseUrl,
                port: 443,
                path: endpoint,
                method: 'GET',
                timeout: 10000
            };

            const req = https.request(options, (res) => {
                console.log(`   Status: ${res.statusCode}`);
                console.log(`   Headers: ${JSON.stringify(res.headers, null, 2)}`);
                
                if (res.statusCode === 200) {
                    console.log('   ✅ Available');
                } else if (res.statusCode === 405) {
                    console.log('   ⚠️  Method not allowed (POST expected)');
                } else if (res.statusCode === 404) {
                    console.log('   ❌ Not found');
                } else {
                    console.log(`   ⚠️  Unexpected status: ${res.statusCode}`);
                }
                
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (data.length < 200) {
                        console.log(`   Response: ${data}`);
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`   ❌ Error: ${error.message}`);
            });

            req.on('timeout', () => {
                console.log('   ⏰ Timeout');
                req.destroy();
            });

            req.end();
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.log(`   ❌ Exception: ${error.message}`);
        }
    }
}

debugEndpoints();