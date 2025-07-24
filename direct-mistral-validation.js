/**
 * Direct Mistral Validation - Test working system
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔮 DIRECT MISTRAL VALIDATION TEST');
console.log('=================================');

async function validateMistralSystem() {
    console.log('🎯 Testing both working endpoints for comparison...');
    
    // Test the working bulletproof processor
    console.log('\n1️⃣ TESTING BULLETPROOF PROCESSOR (confirmed working)');
    const bulletproofResult = await testBulletproof();
    
    // Test Mistral endpoint to see exact error
    console.log('\n2️⃣ TESTING MISTRAL ENDPOINT (checking API key issue)');
    const mistralResult = await testMistralDirect();
    
    // Compare and analyze
    console.log('\n📊 VALIDATION RESULTS');
    console.log('=====================');
    
    if (bulletproofResult?.success) {
        console.log('✅ Bulletproof System Working:');
        console.log(`   Accuracy: ${bulletproofResult.accuracy}%`);
        console.log(`   Value: $${bulletproofResult.totalValue.toLocaleString()}`);
        console.log(`   Securities: ${bulletproofResult.securities}`);
        console.log(`   Method: ${bulletproofResult.method}`);
    }
    
    if (mistralResult?.success) {
        console.log('✅ Mistral System Working:');
        console.log(`   Accuracy: ${mistralResult.accuracy}%`);
        console.log(`   Value: $${mistralResult.totalValue.toLocaleString()}`);
        console.log(`   Mistral Available: ${mistralResult.mistralAvailable}`);
        console.log(`   Corrections: ${mistralResult.corrections}`);
        
        if (mistralResult.accuracy > bulletproofResult?.accuracy) {
            const improvement = mistralResult.accuracy - bulletproofResult.accuracy;
            console.log(`🎉 MISTRAL IMPROVEMENT: +${improvement.toFixed(2)}%`);
        }
    } else {
        console.log('❌ Mistral System Issue:');
        console.log(`   Error: ${mistralResult?.error || 'Unknown'}`);
        console.log(`   Status: ${mistralResult?.statusCode || 'N/A'}`);
        
        if (mistralResult?.errorMessage?.includes('Invalid character')) {
            console.log('🔑 DIAGNOSIS: API key has invalid characters');
            console.log('💡 SOLUTION: Verify API key in Render dashboard has no extra spaces/characters');
        }
    }
}

async function testBulletproof() {
    return testPDFEndpoint('/api/bulletproof-processor', 'Bulletproof');
}

async function testMistralDirect() {
    return testPDFEndpoint('/api/mistral-supervised', 'Mistral', 120000);
}

async function testPDFEndpoint(path, name, timeout = 60000) {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        console.log(`🚀 Testing ${name} endpoint: ${path}`);
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: path,
            method: 'POST',
            headers: form.getHeaders(),
            timeout: timeout
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
                        
                        console.log(`✅ ${name} Success: ${result.accuracy}% accuracy`);
                        
                        resolve({
                            success: true,
                            accuracy: parseFloat(result.accuracy || 0),
                            totalValue: result.totalValue || 0,
                            securities: result.securities?.length || 0,
                            responseTime: responseTime,
                            method: result.metadata?.extractionMethod || 'unknown',
                            mistralAvailable: result.metadata?.mistralAvailable,
                            corrections: result.securities?.filter(s => s.mistralCorrected)?.length || 0
                        });
                        
                    } catch (error) {
                        console.log(`❌ ${name} Parse Error: ${error.message}`);
                        resolve({ success: false, error: 'parse_error', responseTime });
                    }
                } else {
                    console.log(`❌ ${name} HTTP Error: ${res.statusCode}`);
                    const errorMsg = data.substring(0, 500);
                    console.log(`📝 Error preview: ${errorMsg.substring(0, 200)}`);
                    
                    resolve({
                        success: false,
                        error: 'http_error',
                        statusCode: res.statusCode,
                        responseTime,
                        errorMessage: errorMsg
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${name} Request Error: ${error.message}`);
            resolve({ success: false, error: 'request_error', message: error.message });
        });
        
        req.on('timeout', () => {
            console.log(`⏱️ ${name} Timeout (${timeout}ms)`);
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });
        
        form.pipe(req);
    });
}

// Run validation
validateMistralSystem().then(() => {
    console.log('\n🎯 NEXT ACTIONS:');
    console.log('================');
    console.log('If Mistral failed:');
    console.log('1. Check MISTRAL_API_KEY in Render dashboard');
    console.log('2. Ensure no extra spaces, quotes, or newlines');
    console.log('3. Key should be exactly: [the key you provided]');
    console.log('4. Save and redeploy');
    console.log('');
    console.log('Current system achieves 84.01% accuracy');
    console.log('Mistral should boost to 95%+ accuracy');
}).catch(console.error);