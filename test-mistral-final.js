/**
 * FINAL MISTRAL TEST - Check if 100% accuracy is achieved
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🎯 FINAL MISTRAL INTEGRATION TEST');
console.log('=================================');
console.log('🚀 Testing updated deployment...');

async function testMistralFinal() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    // Test 1: Baseline accuracy
    console.log('\n1️⃣ BASELINE TEST (Bulletproof Processor)');
    const baselineResult = await testEndpoint('/api/bulletproof-processor', 'Baseline');
    
    // Test 2: Mistral supervised (the big test!)
    console.log('\n2️⃣ MISTRAL SUPERVISED TEST (100% accuracy target)');
    const mistralResult = await testEndpoint('/api/mistral-supervised', 'Mistral');
    
    // Analysis
    console.log('\n📊 RESULTS ANALYSIS');
    console.log('===================');
    
    if (baselineResult.success) {
        console.log(`Baseline Accuracy: ${baselineResult.accuracy}% ($${baselineResult.totalValue.toLocaleString()})`);
    }
    
    if (mistralResult.success) {
        console.log(`Mistral Accuracy: ${mistralResult.accuracy}% ($${mistralResult.totalValue.toLocaleString()})`);
        
        if (mistralResult.mistralAvailable) {
            console.log('✅ Mistral API integration successful!');
            console.log(`🔮 Mistral corrections applied: ${mistralResult.corrections}`);
        }
        
        if (baselineResult.success) {
            const improvement = mistralResult.accuracy - baselineResult.accuracy;
            console.log(`📈 Improvement: +${improvement.toFixed(2)}%`);
            console.log(`💰 Additional value: +$${(mistralResult.totalValue - baselineResult.totalValue).toLocaleString()}`);
        }
        
        // Check accuracy levels
        if (mistralResult.accuracy >= 100) {
            console.log('\n🏆 PERFECT! 100% ACCURACY ACHIEVED!');
            console.log('✅ Target: $19,464,431');
            console.log('✅ Extracted: $' + mistralResult.totalValue.toLocaleString());
            console.log('🎉 MISSION ACCOMPLISHED!');
        } else if (mistralResult.accuracy >= 95) {
            console.log('\n🎉 EXCELLENT! 95%+ ACCURACY ACHIEVED!');
            console.log('✅ Near-perfect extraction accuracy');
            console.log('✅ Production-ready system');
        } else if (mistralResult.accuracy > 90) {
            console.log('\n✅ GOOD! 90%+ accuracy achieved');
            console.log('📈 Significant improvement from baseline');
        }
        
    } else if (mistralResult.error === 'header_error') {
        console.log('❌ Still getting header error - deployment may not be complete');
        console.log('💡 The fix might need a few more minutes to deploy');
    } else {
        console.log(`❌ Mistral test failed: ${mistralResult.error}`);
    }
    
    // Save final results
    const finalReport = {
        timestamp: new Date().toISOString(),
        baseline: baselineResult,
        mistral: mistralResult,
        target: { value: 19464431, accuracy: 100 },
        success: mistralResult.success && mistralResult.accuracy >= 95
    };
    
    fs.writeFileSync('final-mistral-results.json', JSON.stringify(finalReport, null, 2));
    console.log('\n💾 Results saved to final-mistral-results.json');
}

async function testEndpoint(path, name) {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        console.log(`🔄 Testing ${name} endpoint...`);
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: path,
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
                
                console.log(`📊 ${name} Response: HTTP ${res.statusCode} (${responseTime}ms)`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        const response = {
                            success: true,
                            accuracy: parseFloat(result.accuracy || 0),
                            totalValue: result.totalValue || 0,
                            securities: result.securities?.length || 0,
                            responseTime: responseTime,
                            mistralAvailable: result.metadata?.mistralAvailable,
                            corrections: result.securities?.filter(s => s.mistralCorrected)?.length || 0,
                            method: result.metadata?.extractionMethod
                        };
                        
                        console.log(`✅ ${name} Success: ${response.accuracy}% accuracy`);
                        resolve(response);
                        
                    } catch (error) {
                        console.log(`❌ ${name} Parse error: ${error.message}`);
                        resolve({ success: false, error: 'parse_error' });
                    }
                } else {
                    const errorMsg = data.substring(0, 200);
                    
                    if (errorMsg.includes('Invalid character') && errorMsg.includes('Authorization')) {
                        console.log('❌ Authorization header error (fix not deployed yet)');
                        resolve({ success: false, error: 'header_error' });
                    } else {
                        console.log(`❌ ${name} Error: ${errorMsg}`);
                        resolve({ success: false, error: 'other', statusCode: res.statusCode });
                    }
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${name} Request error: ${error.message}`);
            resolve({ success: false, error: 'request_error' });
        });
        
        req.on('timeout', () => {
            console.log(`⏱️ ${name} Timeout`);
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });
        
        form.pipe(req);
    });
}

// Run the final test
testMistralFinal().then(() => {
    console.log('\n🔗 System URL: https://pdf-fzzi.onrender.com/');
    console.log('📋 Endpoints tested:');
    console.log('   - /api/bulletproof-processor (baseline)');
    console.log('   - /api/mistral-supervised (100% accuracy)');
}).catch(console.error);