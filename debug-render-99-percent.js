/**
 * Debug Render 99% Accuracy Endpoint
 * Identify why the 500 error is happening
 */

const https = require('https');
const fs = require('fs');

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            timeout: 60000,
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

        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function debugRender99Percent() {
    const baseUrl = 'https://pdf-production-5dis.onrender.com';
    
    console.log('🔍 DEBUGGING RENDER 99% ACCURACY ENDPOINT');
    console.log('='.repeat(60));

    // Test 1: Check if service is responsive
    console.log('1️⃣ Testing basic health...');
    try {
        const health = await makeRequest(`${baseUrl}/health`);
        console.log(`   Status: ${health.status}`);
        if (health.data.status) {
            console.log(`   Health: ${health.data.status}`);
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }

    // Test 2: Check diagnostic details
    console.log('\n2️⃣ Getting detailed diagnostics...');
    try {
        const diagnostic = await makeRequest(`${baseUrl}/api/diagnostic`);
        console.log(`   Status: ${diagnostic.status}`);
        if (diagnostic.data) {
            console.log(`   Claude Vision: ${diagnostic.data.claudeVisionAvailable ? '✅' : '❌'}`);
            console.log(`   Page-by-Page: ${diagnostic.data.pageByPageAvailable ? '✅' : '❌'}`);
            console.log(`   Endpoints:`, Object.keys(diagnostic.data.endpoints || {}));
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
    }

    // Test 3: Test different endpoints with small PDF
    console.log('\n3️⃣ Testing different endpoints...');
    
    const endpoints = [
        '/api/bulletproof-processor',
        '/api/99-percent-processor', 
        '/api/99-percent-enhanced',
        '/api/page-by-page-processor'
    ];

    // Create a minimal test PDF if available
    const testPdfPath = './test-upload.pdf';
    if (!fs.existsSync(testPdfPath)) {
        console.log('   ⚠️  No test PDF found, testing with Messos PDF...');
    }

    const pdfPath = fs.existsSync(testPdfPath) ? testPdfPath : './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('   ❌ No PDF file found for testing');
        return;
    }

    for (const endpoint of endpoints) {
        console.log(`\n   Testing ${endpoint}...`);
        
        try {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('pdf', fs.createReadStream(pdfPath));

            const result = await new Promise((resolve, reject) => {
                const req = https.request(`${baseUrl}${endpoint}`, {
                    method: 'POST',
                    headers: form.getHeaders(),
                    timeout: 90000
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve({ status: res.statusCode, data: JSON.parse(data) });
                        } catch (e) {
                            resolve({ status: res.statusCode, data: data, raw: true });
                        }
                    });
                });

                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Upload timeout'));
                });

                form.pipe(req);
            });

            console.log(`     Status: ${result.status}`);
            
            if (result.status === 200 && result.data.success) {
                console.log(`     Success: ✅`);
                console.log(`     Accuracy: ${result.data.accuracy}%`);
                console.log(`     Method: ${result.data.metadata?.method || 'unknown'}`);
                console.log(`     Securities: ${result.data.securities?.length || 0}`);
                console.log(`     Total Value: CHF ${result.data.totalValue?.toLocaleString() || 0}`);
                
                if (result.data.metadata?.totalCost) {
                    console.log(`     Cost: $${result.data.metadata.totalCost}`);
                }
                
                if (result.data.accuracy >= 99) {
                    console.log(`     🎉 99%+ ACCURACY ACHIEVED!`);
                }
            } else if (result.status === 500) {
                console.log(`     Error: ❌ 500 Internal Server Error`);
                if (result.data.error) {
                    console.log(`     Details: ${result.data.error}`);
                }
                if (result.data.details) {
                    console.log(`     Stack: ${result.data.details}`);
                }
            } else {
                console.log(`     Error: ❌ HTTP ${result.status}`);
                if (result.data) {
                    console.log(`     Details:`, JSON.stringify(result.data, null, 2).substring(0, 200));
                }
            }
            
        } catch (error) {
            console.log(`     Error: ❌ ${error.message}`);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n='.repeat(60));
    console.log('🎯 SUMMARY:');
    console.log('- If any endpoint shows 99%+ accuracy: SUCCESS! 🎉');
    console.log('- If all show 500 errors: Server-side issue needs debugging');
    console.log('- If all show 92%: Claude Vision not being used');
    console.log('='.repeat(60));
}

debugRender99Percent().catch(console.error);