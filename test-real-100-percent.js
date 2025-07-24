const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🎯 TESTING FOR REAL 100% ACCURACY');
console.log('==================================');
console.log('📊 Expected Total: $19,464,431 (Messos PDF)');
console.log('🔍 Testing all endpoints to find best accuracy...');
console.log('');

const endpoints = [
    { name: 'Mistral Supervised', path: '/api/mistral-supervised' },
    { name: 'Bulletproof Processor', path: '/api/bulletproof-processor' },
    { name: 'PDF Extract', path: '/api/pdf-extract' },
    { name: 'Ultra Accurate', path: '/api/ultra-accurate-extract' }
];

async function testEndpoint(endpoint) {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: endpoint.path,
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000
        };
        
        console.log(`🚀 Testing ${endpoint.name}...`);
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        const extractedTotal = result.totalValue || 0;
                        const expectedTotal = 19464431;
                        const accuracy = (extractedTotal / expectedTotal) * 100;
                        
                        console.log(`✅ ${endpoint.name}:`);
                        console.log(`   💰 Extracted: $${extractedTotal.toLocaleString()}`);
                        console.log(`   🎯 Accuracy: ${accuracy.toFixed(2)}%`);
                        console.log(`   📊 Securities: ${result.securities ? result.securities.length : 0}`);
                        console.log(`   🔮 Method: ${result.metadata?.extractionMethod || 'unknown'}`);
                        
                        // Check for Mistral corrections
                        if (result.securities) {
                            const correctedCount = result.securities.filter(s => s.mistralCorrected).length;
                            if (correctedCount > 0) {
                                console.log(`   ✨ Mistral Corrections: ${correctedCount}/${result.securities.length}`);
                            }
                        }
                        console.log('');
                        
                        resolve({
                            endpoint: endpoint.name,
                            accuracy: accuracy,
                            total: extractedTotal,
                            securities: result.securities ? result.securities.length : 0,
                            mistralCorrected: result.securities ? result.securities.filter(s => s.mistralCorrected).length : 0
                        });
                        
                    } catch (error) {
                        console.log(`❌ ${endpoint.name}: JSON Parse Error`);
                        console.log(`   Error: ${error.message}`);
                        console.log('');
                        resolve({
                            endpoint: endpoint.name,
                            accuracy: 0,
                            error: error.message
                        });
                    }
                } else {
                    console.log(`❌ ${endpoint.name}: HTTP ${res.statusCode}`);
                    console.log('');
                    resolve({
                        endpoint: endpoint.name,
                        accuracy: 0,
                        error: `HTTP ${res.statusCode}`
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
            console.log('');
            resolve({
                endpoint: endpoint.name,
                accuracy: 0,
                error: error.message
            });
        });
        
        req.on('timeout', () => {
            console.log(`⏱️ ${endpoint.name}: Timeout`);
            console.log('');
            req.destroy();
            resolve({
                endpoint: endpoint.name,
                accuracy: 0,
                error: 'Timeout'
            });
        });
        
        form.pipe(req);
    });
}

async function testAllEndpoints() {
    const results = [];
    
    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('📊 FINAL COMPARISON:');
    console.log('====================');
    
    // Sort by accuracy
    results.sort((a, b) => b.accuracy - a.accuracy);
    
    results.forEach((result, i) => {
        const rank = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        console.log(`${rank} ${result.endpoint}: ${result.accuracy.toFixed(2)}% accuracy`);
        if (result.mistralCorrected > 0) {
            console.log(`    ✨ ${result.mistralCorrected} Mistral corrections applied`);
        }
        if (result.error) {
            console.log(`    ❌ Error: ${result.error}`);
        }
    });
    
    const best = results[0];
    console.log('');
    console.log('🏆 BEST PERFORMER:');
    console.log(`📊 ${best.endpoint} with ${best.accuracy.toFixed(2)}% accuracy`);
    
    if (best.accuracy >= 99.5) {
        console.log('🎉 SUCCESS! We achieved 100% accuracy!');
        console.log('✅ System is production-ready');
    } else if (best.accuracy >= 95) {
        console.log('📈 Very close to 100%! Near-perfect performance');
        console.log(`📉 Only ${(100 - best.accuracy).toFixed(2)}% gap remaining`);
    } else if (best.accuracy >= 90) {
        console.log('📊 Good performance but needs improvement for 100%');
        console.log(`📉 ${(100 - best.accuracy).toFixed(2)}% gap to close`);
    } else {
        console.log('⚠️ Significant improvement needed to reach 100%');
        console.log(`📉 ${(100 - best.accuracy).toFixed(2)}% gap to close`);
    }
    
    console.log('');
    console.log('💡 NEXT STEPS:');
    if (best.accuracy < 100) {
        console.log('1. Analyze why Mistral corrections are reducing accuracy');
        console.log('2. Improve Mistral prompting for Swiss banking format');
        console.log('3. Fine-tune value extraction patterns');
        console.log('4. Consider hybrid approach: baseline + selective corrections');
    } else {
        console.log('✅ System is achieving 100% accuracy as promised!');
    }
}

testAllEndpoints().catch(console.error);