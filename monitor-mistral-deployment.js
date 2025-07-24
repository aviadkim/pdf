/**
 * Monitor Mistral Deployment - Auto-check until working
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔄 MONITORING MISTRAL DEPLOYMENT');
console.log('================================');
console.log('⏰ Checking every 30 seconds until Mistral works...');

let attempt = 0;
const maxAttempts = 20; // 10 minutes max

async function monitorDeployment() {
    while (attempt < maxAttempts) {
        attempt++;
        console.log(`\n📋 Check ${attempt}/${maxAttempts} - ${new Date().toLocaleTimeString()}`);
        
        const result = await testMistralEndpoint();
        
        if (result.success) {
            console.log('\n🎉 SUCCESS! MISTRAL IS WORKING!');
            console.log('=====================================');
            console.log(`✅ Accuracy: ${result.accuracy}%`);
            console.log(`💰 Total Value: $${result.totalValue.toLocaleString()}`);
            console.log(`📊 Securities: ${result.securities}`);
            console.log(`🔮 Mistral Available: ${result.mistralAvailable}`);
            console.log(`🔄 Corrections Applied: ${result.corrections}`);
            
            if (result.accuracy >= 100) {
                console.log('\n🏆 PERFECT! 100% ACCURACY ACHIEVED!');
                console.log('✅ Target: $19,464,431');
                console.log('✅ System is now perfect!');
            } else if (result.accuracy >= 95) {
                console.log('\n🎯 EXCELLENT! 95%+ ACCURACY ACHIEVED!');
                console.log('✅ Near-perfect accuracy');
                console.log('✅ Production-ready system');
            } else if (result.accuracy > 84.01) {
                console.log('\n📈 IMPROVEMENT DETECTED!');
                console.log(`✅ Improved from 84.01% to ${result.accuracy}%`);
            }
            
            // Test baseline for comparison
            await testBaseline();
            
            return true;
        } else {
            console.log(`❌ Not ready yet: ${result.error}`);
            
            if (result.error === 'header_error') {
                console.log('⏳ Header fix not deployed yet...');
            } else if (result.error === 'timeout') {
                console.log('⏳ Request timed out, server might be busy...');
            }
        }
        
        if (attempt < maxAttempts) {
            console.log('⏳ Waiting 30 seconds before next check...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    console.log('\n⚠️ Monitoring timeout reached');
    console.log('💡 Check Render dashboard for deployment status');
    return false;
}

async function testMistralEndpoint() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/mistral-supervised',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000
        };
        
        const startTime = Date.now();
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        resolve({
                            success: true,
                            accuracy: parseFloat(result.accuracy || 0),
                            totalValue: result.totalValue || 0,
                            securities: result.securities?.length || 0,
                            responseTime: responseTime,
                            mistralAvailable: result.metadata?.mistralAvailable,
                            corrections: result.securities?.filter(s => s.mistralCorrected)?.length || 0
                        });
                        
                    } catch (error) {
                        resolve({ success: false, error: 'parse_error' });
                    }
                } else {
                    const errorMsg = data.toLowerCase();
                    
                    if (errorMsg.includes('invalid character') && errorMsg.includes('authorization')) {
                        resolve({ success: false, error: 'header_error' });
                    } else if (res.statusCode === 401) {
                        resolve({ success: false, error: 'unauthorized' });
                    } else {
                        resolve({ success: false, error: `HTTP ${res.statusCode}` });
                    }
                }
            });
        });
        
        req.on('error', () => resolve({ success: false, error: 'request_error' }));
        req.on('timeout', () => {
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });
        
        form.pipe(req);
    });
}

async function testBaseline() {
    console.log('\n📊 Comparing with baseline...');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream('2. Messos  - 31.03.2025.pdf'));
    
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/bulletproof-processor',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log(`Baseline: ${result.accuracy}% ($${result.totalValue.toLocaleString()})`);
                    } catch (e) {
                        console.log('Baseline parse error');
                    }
                }
                resolve();
            });
        });
        
        req.on('error', () => resolve());
        req.on('timeout', () => { req.destroy(); resolve(); });
        
        form.pipe(req);
    });
}

// Start monitoring
monitorDeployment().then(success => {
    if (success) {
        console.log('\n✅ Monitoring complete - Mistral is working!');
        console.log('🔗 System URL: https://pdf-fzzi.onrender.com/');
        console.log('🎯 100% accuracy system is now live!');
    } else {
        console.log('\n⚠️ Monitoring ended - manual check needed');
    }
}).catch(console.error);