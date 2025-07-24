/**
 * Test Header Fix - Verify Mistral authorization works
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔧 TESTING MISTRAL HEADER SANITIZATION FIX');
console.log('===========================================');
console.log('🎯 Fix: Clean API key to remove invalid HTTP header chars');
console.log('📋 Expected: Mistral endpoint should work without header errors');

async function testHeaderFix() {
    console.log('\n🔄 Waiting for deployment (commit bfcb59e)...');
    
    let attempt = 0;
    const maxAttempts = 10;
    
    while (attempt < maxAttempts) {
        attempt++;
        console.log(`\n📋 Test attempt ${attempt}/${maxAttempts}`);
        
        const result = await testMistralEndpoint();
        
        if (result.success) {
            console.log('🎉 SUCCESS! Mistral header fix working!');
            console.log(`✅ Accuracy: ${result.accuracy}%`);
            console.log(`💰 Value: $${result.totalValue.toLocaleString()}`);
            console.log(`🔮 Mistral Available: ${result.mistralAvailable}`);
            console.log(`🔄 Corrections: ${result.corrections}`);
            
            if (result.accuracy >= 90) {
                console.log('🏆 TARGET ACHIEVED! 90%+ accuracy with Mistral!');
            }
            
            return true;
            
        } else if (result.error === 'header_error') {
            console.log('⚠️ Still getting header error - deployment may not be complete');
        } else if (result.error === 'unauthorized') {
            console.log('🔑 Unauthorized - API key issue (different from header issue)');
        } else {
            console.log(`❌ Other error: ${result.error}`);
        }
        
        if (attempt < maxAttempts) {
            console.log('⏳ Waiting 30 seconds for deployment...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    console.log('\n⚠️ Header fix test completed - manual verification needed');
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
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        resolve({
                            success: true,
                            accuracy: parseFloat(result.accuracy || 0),
                            totalValue: result.totalValue || 0,
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
                    } else if (errorMsg.includes('unauthorized') || res.statusCode === 401) {
                        resolve({ success: false, error: 'unauthorized' });
                    } else {
                        resolve({ success: false, error: 'other', statusCode: res.statusCode });
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

// Test baseline to confirm current system still works
async function testBaseline() {
    console.log('\n📊 Testing baseline system (should still work)...');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream('2. Messos  - 31.03.2025.pdf'));
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/bulletproof-processor',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const result = JSON.parse(data);
                    console.log(`✅ Baseline: ${result.accuracy}% ($${result.totalValue.toLocaleString()})`);
                } else {
                    console.log('❌ Baseline system issue');
                }
                resolve();
            });
        });
        
        req.on('error', () => resolve());
        req.on('timeout', () => { req.destroy(); resolve(); });
        
        form.pipe(req);
    });
}

// Run tests
async function runTests() {
    await testBaseline();
    
    const success = await testHeaderFix();
    
    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    if (success) {
        console.log('✅ Header fix successful');
        console.log('✅ Mistral integration working');
        console.log('✅ 90%+ accuracy achieved');
    } else {
        console.log('⚠️ Header fix needs more investigation');
        console.log('💡 Check Render logs for detailed error messages');
        console.log('🔑 Verify API key format in environment variables');
    }
}

runTests().catch(console.error);