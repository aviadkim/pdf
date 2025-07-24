/**
 * Test live deployment with multiple endpoints to find working version
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

async function testEndpoint(endpoint) {
    console.log(`\n🧪 Testing ${endpoint}...`);
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return null;
    }
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    return new Promise((resolve) => {
        const req = https.request(`https://pdf-production-5dis.onrender.com${endpoint}`, {
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 30000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                console.log(`📊 Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        const accuracy = parseFloat(result.accuracy || 0);
                        const securities = result.securities?.length || 0;
                        const method = result.metadata?.method || 'unknown';
                        
                        console.log(`🎯 Accuracy: ${accuracy}%`);
                        console.log(`🔢 Securities: ${securities}`);
                        console.log(`🔧 Method: ${method}`);
                        
                        resolve({ accuracy, securities, method, success: securities > 0 });
                    } catch (e) {
                        console.log('❌ JSON parse error');
                        resolve(null);
                    }
                } else {
                    console.log(`❌ Error: ${res.statusCode}`);
                    console.log(data.substring(0, 200));
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request error: ${error.message}`);
            resolve(null);
        });

        req.on('timeout', () => {
            console.log('⏰ Timeout');
            req.destroy();
            resolve(null);
        });

        form.pipe(req);
    });
}

async function main() {
    console.log('🚀 COMPREHENSIVE LIVE DEPLOYMENT TEST');
    console.log('🎯 Testing all endpoints to verify deployment status');
    console.log('='.repeat(60));
    
    const endpoints = [
        '/api/bulletproof-processor',
        '/api/99-percent-processor', 
        '/api/99-percent-enhanced',
        '/api/hybrid-extract-fixed'
    ];
    
    let bestResult = null;
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        if (result && result.success && (!bestResult || result.accuracy > bestResult.accuracy)) {
            bestResult = result;
            bestResult.endpoint = endpoint;
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🏁 DEPLOYMENT TEST RESULTS:');
    
    if (bestResult) {
        console.log('🎉 SUCCESS: Fixed extraction is working!');
        console.log(`✅ Best endpoint: ${bestResult.endpoint}`);
        console.log(`🎯 Accuracy: ${bestResult.accuracy}%`);
        console.log(`🔢 Securities: ${bestResult.securities}`);
        console.log(`🔧 Method: ${bestResult.method}`);
        
        if (bestResult.accuracy >= 70) {
            console.log('🚀 EXCELLENT: Target accuracy achieved!');
        } else if (bestResult.accuracy >= 50) {
            console.log('✅ GOOD: Major improvement from 0%');
        } else {
            console.log('🆙 PROGRESS: Some securities found');
        }
    } else {
        console.log('❌ All endpoints still returning errors');
        console.log('🔧 Deployment may still be in progress');
    }
    
    process.exit(bestResult ? 0 : 1);
}

main().catch(console.error);