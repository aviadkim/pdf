/**
 * Quick debug of deployment issues
 */

const https = require('https');

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            timeout: 30000,
            ...options
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, raw: true });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function quickDebug() {
    const baseUrl = 'https://pdf-production-5dis.onrender.com';
    
    console.log('🔍 QUICK DEBUG OF DEPLOYMENT ISSUES');
    console.log('='.repeat(50));
    
    // Test simple endpoint
    console.log('\n1️⃣ Testing bulletproof processor with simple request...');
    try {
        const result = await makeRequest(`${baseUrl}/api/bulletproof-processor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Status: ${result.status}`);
        if (result.data.error) {
            console.log(`Error: ${result.data.error}`);
            console.log(`Details: ${result.data.details}`);
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    // Check if Claude key is really there
    console.log('\n2️⃣ Testing Claude API key...');
    try {
        const result = await makeRequest(`${baseUrl}/api/claude-test`);
        console.log(`Claude API Status: ${result.data.success ? '✅' : '❌'}`);
        if (result.data.message) {
            console.log(`Message: ${result.data.message}`);
        }
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    console.log('\n='.repeat(50));
    console.log('💡 LIKELY ISSUES:');
    console.log('1. PDF parsing still has issues with the Messos file');
    console.log('2. Render may need more time to fully deploy changes');
    console.log('3. Environment variables might not be properly configured');
    console.log('='.repeat(50));
}

quickDebug().catch(console.error);