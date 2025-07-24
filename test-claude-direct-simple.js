/**
 * Simple test for Claude Direct Vision
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

async function testClaudeDirectVision() {
    console.log('🎯 TESTING CLAUDE DIRECT VISION FOR 99% ACCURACY');
    console.log('='.repeat(60));
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return false;
    }
    
    console.log('📤 Testing /api/claude-direct-vision endpoint...');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const req = https.request('https://pdf-production-5dis.onrender.com/api/claude-direct-vision', {
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                const elapsed = Math.round((Date.now() - startTime) / 1000);
                console.log(`Response: ${res.statusCode} after ${elapsed}s`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        const accuracy = parseFloat(result.accuracy || 0);
                        const securities = result.securities || [];
                        
                        console.log('✅ SUCCESS!');
                        console.log(`🎯 Accuracy: ${accuracy}%`);
                        console.log(`🔢 Securities: ${securities.length}`);
                        console.log(`💰 Total: ${result.currency || 'CHF'} ${result.totalValue?.toLocaleString() || 0}`);
                        console.log(`🔧 Method: ${result.metadata?.method || 'unknown'}`);
                        
                        if (accuracy >= 99) {
                            console.log('🎉 TARGET ACHIEVED: 99%+ ACCURACY!');
                        } else if (accuracy >= 90) {
                            console.log('🌟 EXCELLENT: 90%+ accuracy!');
                        } else if (accuracy >= 80) {
                            console.log('✅ GOOD: 80%+ accuracy!');
                        }
                        
                        resolve(accuracy >= 80);
                    } catch (e) {
                        console.log('❌ JSON parse error');
                        resolve(false);
                    }
                } else {
                    console.log(`❌ Error: ${res.statusCode}`);
                    console.log('Response:', data.substring(0, 200));
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ Request error: ${error.message}`);
            resolve(false);
        });

        req.on('timeout', () => {
            console.log('⏰ Timeout');
            req.destroy();
            resolve(false);
        });

        form.pipe(req);
    });
}

testClaudeDirectVision().then(success => {
    console.log(`\nResult: ${success ? 'SUCCESS' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
}).catch(console.error);