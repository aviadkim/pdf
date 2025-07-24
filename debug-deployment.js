/**
 * DEBUG DEPLOYMENT ISSUE
 * Find out why improvements aren't being used
 */

const https = require('https');

console.log('🔍 DEBUGGING DEPLOYMENT ISSUE');
console.log('=============================\n');

async function debugEndpoints() {
    console.log('Testing different API endpoints...\n');
    
    const endpoints = [
        '/api/pdf-extract',
        '/api/bulletproof-processor', 
        '/api/ultra-enhanced',
        '/api/system-capabilities'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`🔍 Testing: ${endpoint}`);
        
        const result = await testEndpoint(endpoint);
        console.log(`   Status: ${result.status}`);
        console.log(`   Content: ${result.content.substring(0, 100)}...`);
        console.log('');
    }
}

async function testEndpoint(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: path,
            method: 'GET',
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ status: res.statusCode, content: data });
            });
        });
        
        req.on('error', (error) => {
            resolve({ status: 'ERROR', content: error.message });
        });
        
        req.on('timeout', () => {
            resolve({ status: 'TIMEOUT', content: 'Request timeout' });
        });
        
        req.end();
    });
}

// Also check what extraction method is being returned
async function checkExtractionMethod() {
    console.log('🔍 CHECKING EXTRACTION METHOD IN USE');
    console.log('====================================');
    
    // Try to get system info
    const systemInfo = await testEndpoint('/api/system-capabilities');
    
    if (systemInfo.status === 200) {
        console.log('✅ System capabilities endpoint exists');
        try {
            const data = JSON.parse(systemInfo.content);
            console.log('📊 System info:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.log('❌ Could not parse system info');
        }
    } else {
        console.log('❌ No system capabilities endpoint');
    }
    
    console.log('\n🔍 DIAGNOSIS:');
    console.log('The extraction method should be "enhanced-precision-v3-improved"');
    console.log('But we\'re seeing "production-ready-validated"');
    console.log('This suggests the deployed system is using old code or wrong endpoint');
}

debugEndpoints().then(() => {
    checkExtractionMethod();
}).catch(console.error);