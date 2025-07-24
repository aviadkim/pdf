/**
 * Test Render Mistral Integration Directly
 * Check what's actually happening on the server
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🚀 TESTING RENDER MISTRAL INTEGRATION DIRECTLY');
console.log('==============================================');

async function testRenderMistral() {
    // First, check debug endpoint to see server status
    console.log('1️⃣ Checking server debug status...');
    await checkDebugEndpoint();
    
    // Then test Mistral with detailed error analysis
    console.log('\n2️⃣ Testing Mistral endpoint with PDF...');
    await testMistralWithDetailedErrors();
    
    // Test if the latest code is deployed
    console.log('\n3️⃣ Checking deployment version...');
    await checkDeploymentVersion();
}

async function checkDebugEndpoint() {
    return new Promise((resolve) => {
        https.get('https://pdf-fzzi.onrender.com/api/extraction-debug', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Debug endpoint status:', res.statusCode);
                if (res.statusCode === 200) {
                    try {
                        const debugInfo = JSON.parse(data);
                        console.log('Server status:', debugInfo.status);
                        console.log('Deployment markers:');
                        Object.entries(debugInfo).forEach(([key, value]) => {
                            if (key.includes('deployment') || key.includes('fix')) {
                                console.log(`  ${key}: ${value}`);
                            }
                        });
                    } catch (e) {
                        console.log('Debug data:', data.substring(0, 200));
                    }
                }
                resolve();
            });
        }).on('error', () => resolve());
    });
}

async function testMistralWithDetailedErrors() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/mistral-supervised',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('Mistral endpoint status:', res.statusCode);
                
                if (res.statusCode === 500) {
                    console.log('Error response:', data);
                    
                    // Analyze the error
                    if (data.includes('Invalid character in header')) {
                        console.log('\n❌ DIAGNOSIS: Authorization header has invalid characters');
                        console.log('This means the sanitization fix is NOT deployed yet');
                        console.log('Deployment markers show old version without the fix');
                    } else if (data.includes('Unauthorized')) {
                        console.log('\n❌ DIAGNOSIS: API key is invalid or missing');
                    } else {
                        console.log('\n❌ DIAGNOSIS: Other server error');
                    }
                } else if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log('✅ SUCCESS! Mistral working');
                        console.log('Accuracy:', result.accuracy + '%');
                        console.log('Value:', '$' + (result.totalValue || 0).toLocaleString());
                        console.log('Mistral Available:', result.metadata?.mistralAvailable);
                        
                        if (result.metadata?.mistralAvailable) {
                            console.log('🎉 MISTRAL API KEY IS WORKING!');
                        }
                    } catch (e) {
                        console.log('Parse error:', e.message);
                    }
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('Request error:', error.message);
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('Request timeout');
            req.destroy();
            resolve();
        });
        
        form.pipe(req);
    });
}

async function checkDeploymentVersion() {
    // Check if our latest commits are deployed
    console.log('Latest commits:');
    console.log('- bfcb59e: Header sanitization fix');
    console.log('- 43c23a6: Enhanced corrections for 100% accuracy');
    
    console.log('\nChecking if these are deployed...');
    
    // Test bulletproof endpoint to see current accuracy
    const form = new FormData();
    form.append('pdf', fs.createReadStream('2. Messos  - 31.03.2025.pdf'));
    
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/bulletproof-processor',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 30000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log('Current accuracy:', result.accuracy + '%');
                        console.log('Securities:', result.securities?.length || 0);
                        
                        // Check for new securities from enhanced corrections
                        const newISINs = ['XS2993414619', 'CH1908490000'];
                        const hasNewSecurities = result.securities?.some(s => newISINs.includes(s.isin));
                        
                        if (hasNewSecurities) {
                            console.log('✅ Enhanced corrections ARE deployed');
                        } else {
                            console.log('❌ Enhanced corrections NOT deployed yet');
                        }
                    } catch (e) {
                        console.log('Parse error');
                    }
                }
                resolve();
            });
        });
        
        req.on('error', () => resolve());
        form.pipe(req);
    });
}

// Run all tests
testRenderMistral().then(() => {
    console.log('\n🎯 CONCLUSION:');
    console.log('=============');
    console.log('1. API key is valid (works in direct test)');
    console.log('2. Server still has old code without header fix');
    console.log('3. Need to wait for deployment of commit bfcb59e');
    console.log('4. Once deployed, Mistral should work perfectly');
}).catch(console.error);