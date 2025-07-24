const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔒 SECURE FINAL ACCURACY TEST');
console.log('=============================');
console.log('🔑 API key kept secure - not in code');
console.log('📋 Testing both enhanced system and Mistral integration');

async function secureAccuracyTest() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    console.log('\\n🎯 TESTING CURRENT SYSTEM');
    console.log('=========================');
    
    // Test main endpoint
    const mainResult = await testEndpoint('/api/pdf-extract', 'Main System');
    
    // Test Mistral endpoint
    const mistralResult = await testEndpoint('/api/mistral-supervised', 'Mistral System');
    
    // Compare results
    console.log('\\n📊 COMPARISON:');
    console.log('==============');
    
    if (mainResult && mistralResult) {
        console.log('Main System:    ' + mainResult.accuracy + '% ($' + mainResult.totalValue.toLocaleString() + ')');
        console.log('Mistral System: ' + mistralResult.accuracy + '% ($' + mistralResult.totalValue.toLocaleString() + ')');
        
        const improvement = mistralResult.accuracy - mainResult.accuracy;
        const valueGain = mistralResult.totalValue - mainResult.totalValue;
        
        if (improvement > 0) {
            console.log('\\n🎉 MISTRAL IMPROVEMENT:');
            console.log('✅ Accuracy gain: +' + improvement.toFixed(2) + '%');
            console.log('💰 Value gain: +$' + valueGain.toLocaleString());
            
            if (mistralResult.accuracy >= 95) {
                console.log('🏆 SUCCESS! 95%+ ACCURACY ACHIEVED!');
            }
        }
    } else if (mainResult) {
        console.log('Main System: ' + mainResult.accuracy + '% ($' + mainResult.totalValue.toLocaleString() + ')');
        console.log('Mistral: Need to update API key in Render dashboard');
    }
}

async function testEndpoint(path, name) {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: path,
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 ' + name + ' Status:', res.statusCode);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        const accuracy = parseFloat(result.accuracy || 0);
                        const totalValue = result.totalValue || 0;
                        
                        console.log('✅ ' + name + ': ' + accuracy + '% ($' + totalValue.toLocaleString() + ')');
                        
                        if (name.includes('Mistral')) {
                            const mistralAvailable = result.metadata?.mistralAvailable;
                            const corrections = result.securities?.filter(s => s.mistralCorrected)?.length || 0;
                            console.log('🔑 API Available: ' + (mistralAvailable ? 'Yes' : 'No'));
                            console.log('🔮 Corrections: ' + corrections);
                        }
                        
                        resolve({ accuracy, totalValue, securities: result.securities?.length || 0 });
                        
                    } catch (error) {
                        console.log('❌ ' + name + ' parse error');
                        resolve(null);
                    }
                } else {
                    console.log('❌ ' + name + ' failed: ' + res.statusCode);
                    if (name.includes('Mistral') && res.statusCode === 500) {
                        console.log('💡 Likely need to update API key in Render');
                    }
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
        form.pipe(req);
    });
}

secureAccuracyTest().then(() => {
    console.log('\\n🔒 SECURITY NOTES:');
    console.log('===================');
    console.log('✅ No API keys exposed in code');
    console.log('✅ Keys stored securely in Render environment');
    console.log('💡 Update environment variables via Render dashboard only');
    
    console.log('\\n🎯 NEXT STEPS:');
    console.log('===============');
    console.log('1. Update MISTRAL_API_KEY in Render (if needed)');
    console.log('2. Test system for 95%+ accuracy');
    console.log('3. Deploy to production');
});