/**
 * Real-world Mistral Test - Live Render System
 * Testing actual 100% accuracy with Messos document
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🌍 REAL-WORLD MISTRAL ACCURACY TEST');
console.log('===================================');
console.log('🎯 Target: 100% accuracy with Messos document');
console.log('🔮 Testing: Mistral supervision integration');
console.log('📊 Baseline: 84.01% accuracy ($16.35M)');

async function realWorldTest() {
    const startTime = Date.now();
    
    // Test 1: Current system baseline
    console.log('\n🔸 STEP 1: Testing current baseline system');
    const baselineResult = await testEndpoint('/api/pdf-extract', 'Baseline System');
    
    // Test 2: Enhanced corrections
    console.log('\n🔸 STEP 2: Testing enhanced corrections (bulletproof)');
    const enhancedResult = await testEndpoint('/api/bulletproof-processor', 'Enhanced System');
    
    // Test 3: Mistral supervision (the big test!)
    console.log('\n🔸 STEP 3: Testing Mistral supervision (100% accuracy target)');
    const mistralResult = await testMistralSupervision();
    
    // Analysis
    console.log('\n📊 COMPREHENSIVE ANALYSIS');
    console.log('========================');
    
    const results = {
        baseline: baselineResult,
        enhanced: enhancedResult,
        mistral: mistralResult
    };
    
    analyzeResults(results);
    
    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️ Total test time: ${(totalTime / 1000).toFixed(1)} seconds`);
    
    // Save comprehensive results
    const reportData = {
        timestamp: new Date().toISOString(),
        testDuration: totalTime,
        target: { value: 19464431, accuracy: 100 },
        results: results,
        conclusions: generateConclusions(results)
    };
    
    fs.writeFileSync(`real-world-test-results-${Date.now()}.json`, JSON.stringify(reportData, null, 2));
    console.log('💾 Detailed report saved');
}

async function testEndpoint(path, systemName) {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        console.log(`🚀 Testing ${systemName}...`);
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: path,
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
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
                        const accuracy = parseFloat(result.accuracy || 0);
                        const totalValue = result.totalValue || 0;
                        const securities = result.securities?.length || 0;
                        
                        console.log(`✅ ${systemName}: ${accuracy}% ($${totalValue.toLocaleString()}) - ${securities} securities - ${responseTime}ms`);
                        
                        resolve({
                            success: true,
                            accuracy: accuracy,
                            totalValue: totalValue,
                            securities: securities,
                            responseTime: responseTime,
                            method: result.metadata?.extractionMethod || 'unknown',
                            rawResult: result
                        });
                        
                    } catch (error) {
                        console.log(`❌ ${systemName}: Parse error - ${error.message}`);
                        resolve({ success: false, error: 'parse_error', responseTime });
                    }
                } else {
                    console.log(`❌ ${systemName}: HTTP ${res.statusCode} - ${responseTime}ms`);
                    resolve({ success: false, error: 'http_error', statusCode: res.statusCode, responseTime });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ ${systemName}: Request error - ${error.message}`);
            resolve({ success: false, error: 'request_error' });
        });
        
        req.on('timeout', () => {
            console.log(`❌ ${systemName}: Timeout`);
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });
        
        form.pipe(req);
    });
}

async function testMistralSupervision() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        console.log('🔮 Testing Mistral Supervision (premium accuracy)...');
        
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/mistral-supervised',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000 // 2 minutes for Mistral processing
        };
        
        const startTime = Date.now();
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                
                console.log(`📊 Mistral Response: HTTP ${res.statusCode} (${(responseTime / 1000).toFixed(1)}s)`);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        const accuracy = parseFloat(result.accuracy || 0);
                        const totalValue = result.totalValue || 0;
                        const securities = result.securities?.length || 0;
                        
                        // Check Mistral-specific details
                        const mistralAvailable = result.metadata?.mistralAvailable;
                        const corrections = result.securities?.filter(s => s.mistralCorrected)?.length || 0;
                        const initialAccuracy = result.metadata?.initialAccuracy;
                        const finalAccuracy = result.metadata?.finalAccuracy;
                        
                        console.log(`🔮 Mistral Results: ${accuracy}% ($${totalValue.toLocaleString()}) - ${securities} securities`);
                        console.log(`🔑 API Available: ${mistralAvailable ? 'YES' : 'NO'}`);
                        console.log(`🔄 Corrections Applied: ${corrections}`);
                        
                        if (initialAccuracy && finalAccuracy) {
                            const improvement = parseFloat(finalAccuracy) - parseFloat(initialAccuracy);
                            console.log(`📈 Mistral Improvement: +${improvement.toFixed(2)}% (${initialAccuracy}% → ${finalAccuracy}%)`);
                        }
                        
                        if (accuracy >= 95) {
                            console.log('🏆 SUCCESS! 95%+ ACCURACY ACHIEVED WITH MISTRAL!');
                        } else if (accuracy > 90) {
                            console.log('🎉 EXCELLENT! 90%+ accuracy achieved');
                        } else if (!mistralAvailable) {
                            console.log('⚠️ Mistral API not available - using base system only');
                        }
                        
                        resolve({
                            success: true,
                            accuracy: accuracy,
                            totalValue: totalValue,
                            securities: securities,
                            responseTime: responseTime,
                            mistralAvailable: mistralAvailable,
                            corrections: corrections,
                            initialAccuracy: initialAccuracy,
                            finalAccuracy: finalAccuracy,
                            rawResult: result
                        });
                        
                    } catch (error) {
                        console.log(`❌ Mistral parse error: ${error.message}`);
                        console.log('📝 Response preview:', data.substring(0, 300));
                        resolve({ success: false, error: 'parse_error', responseTime, rawResponse: data.substring(0, 500) });
                    }
                } else {
                    console.log(`❌ Mistral HTTP Error: ${res.statusCode}`);
                    const errorPreview = data.substring(0, 300);
                    console.log('📝 Error preview:', errorPreview);
                    
                    if (errorPreview.includes('Invalid character')) {
                        console.log('🔑 ISSUE: API key format problem');
                    } else if (errorPreview.includes('Unauthorized')) {
                        console.log('🔑 ISSUE: Invalid API key');
                    }
                    
                    resolve({ 
                        success: false, 
                        error: 'http_error', 
                        statusCode: res.statusCode, 
                        responseTime,
                        errorMessage: errorPreview
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Mistral request error: ${error.message}`);
            resolve({ success: false, error: 'request_error', message: error.message });
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Mistral timeout (2 minutes) - processing complex document');
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });
        
        form.pipe(req);
    });
}

function analyzeResults(results) {
    const target = 19464431; // $19.46M target
    
    console.log('📈 ACCURACY PROGRESSION:');
    console.log('========================');
    
    if (results.baseline?.success) {
        const baselineGap = target - results.baseline.totalValue;
        console.log(`Baseline:  ${results.baseline.accuracy}% ($${results.baseline.totalValue.toLocaleString()}) Gap: $${baselineGap.toLocaleString()}`);
    }
    
    if (results.enhanced?.success) {
        const enhancedGap = target - results.enhanced.totalValue;
        console.log(`Enhanced:  ${results.enhanced.accuracy}% ($${results.enhanced.totalValue.toLocaleString()}) Gap: $${enhancedGap.toLocaleString()}`);
    }
    
    if (results.mistral?.success) {
        const mistralGap = target - results.mistral.totalValue;
        console.log(`Mistral:   ${results.mistral.accuracy}% ($${results.mistral.totalValue.toLocaleString()}) Gap: $${mistralGap.toLocaleString()}`);
        
        if (results.mistral.accuracy >= 100) {
            console.log('🎯 TARGET ACHIEVED! 100% ACCURACY!');
        } else if (results.mistral.accuracy >= 95) {
            console.log('🏆 MISSION SUCCESS! 95%+ ACCURACY ACHIEVED!');
        }
    }
}

function generateConclusions(results) {
    const conclusions = [];
    
    if (results.mistral?.success && results.mistral.mistralAvailable) {
        conclusions.push('Mistral API integration successful');
        if (results.mistral.corrections > 0) {
            conclusions.push(`Applied ${results.mistral.corrections} Mistral corrections`);
        }
    } else if (!results.mistral?.success) {
        conclusions.push('Mistral API needs configuration');
    }
    
    // Find best performing system
    const systems = ['baseline', 'enhanced', 'mistral'].filter(s => results[s]?.success);
    const bestSystem = systems.reduce((best, current) => 
        !results[best] || results[current].accuracy > results[best].accuracy ? current : best
    );
    
    if (bestSystem) {
        conclusions.push(`Best performance: ${bestSystem} with ${results[bestSystem].accuracy}%`);
    }
    
    return conclusions;
}

// Run the comprehensive test
realWorldTest().catch(error => {
    console.error('❌ Test failed:', error);
});