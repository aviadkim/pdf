const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔮 COMPREHENSIVE MISTRAL 100% ACCURACY TEST');
console.log('============================================');
console.log('📊 Expected Portfolio Total: $19,464,431');
console.log('🎯 Ground Truth from Messos PDF Summary (Page 3)');
console.log('');

async function testMistralComplete() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/mistral-supervised',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 180000 // 3 minutes
        };
        
        console.log('🚀 Testing Mistral Supervised API...');
        console.log('📡 URL: https://pdf-fzzi.onrender.com/api/mistral-supervised');
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 Response Status:', res.statusCode);
                console.log('📏 Response Size:', data.length, 'bytes');
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        console.log('\n🎉 MISTRAL API RESULTS:');
                        console.log('======================');
                        console.log('✅ Success:', result.success);
                        console.log('📊 Securities Found:', result.securities ? result.securities.length : 0);
                        console.log('💰 Extracted Total: $' + (result.totalValue || 0).toLocaleString());
                        console.log('🎯 Accuracy:', result.accuracy || 0, '%');
                        console.log('⏱️ Processing Time:', result.processingTime || 0, 'ms');
                        console.log('🔮 Method:', result.metadata ? result.metadata.extractionMethod : 'unknown');
                        
                        // Calculate true accuracy vs expected
                        const extractedTotal = result.totalValue || 0;
                        const expectedTotal = 19464431;
                        const trueAccuracy = (extractedTotal / expectedTotal) * 100;
                        const gap = expectedTotal - extractedTotal;
                        
                        console.log('\n📈 ACCURACY ANALYSIS:');
                        console.log('====================');
                        console.log('💎 Expected Total: $' + expectedTotal.toLocaleString());
                        console.log('🔍 Extracted Total: $' + extractedTotal.toLocaleString());
                        console.log('🎯 True Accuracy: ' + trueAccuracy.toFixed(2) + '%');
                        console.log('📉 Gap to Close: $' + gap.toLocaleString());
                        
                        // Check if Mistral corrections were applied
                        console.log('\n🔮 MISTRAL SUPERVISION STATUS:');
                        console.log('==============================');
                        console.log('🔑 Mistral Available:', result.metadata ? result.metadata.mistralAvailable : 'unknown');
                        console.log('🤖 Deployment Version:', result.metadata ? result.metadata.deploymentVersion : 'unknown');
                        
                        if (result.securities && result.securities.length > 0) {
                            console.log('\n🔝 TOP 10 SECURITIES EXTRACTED:');
                            console.log('===============================');
                            
                            const topSecurities = result.securities.slice(0, 10);
                            topSecurities.forEach((sec, i) => {
                                const corrected = sec.mistralCorrected ? ' ✨ (Mistral corrected)' : '';
                                const expected = getExpectedValue(sec.isin);
                                const accuracy = expected ? ((sec.marketValue / expected) * 100).toFixed(1) + '%' : 'N/A';
                                
                                console.log(`${i + 1}. ${sec.isin}`);
                                console.log(`   💰 Extracted: $${sec.marketValue.toLocaleString()}`);
                                console.log(`   🎯 Expected: $${expected ? expected.toLocaleString() : 'Unknown'}`);
                                console.log(`   📊 Accuracy: ${accuracy}${corrected}`);
                                console.log('');
                            });
                        }
                        
                        // Final verdict
                        if (trueAccuracy >= 99.5) {
                            console.log('🎉 SUCCESS! ACHIEVED 100% ACCURACY!');
                            console.log('✅ System ready for production use');
                        } else if (trueAccuracy >= 95) {
                            console.log('📈 EXCELLENT! Near-perfect accuracy achieved');
                            console.log('✅ Very close to 100% target');
                        } else if (trueAccuracy >= 90) {
                            console.log('📊 GOOD PROGRESS! Solid accuracy improvement');
                            console.log('⚠️ Still room for improvement to reach 100%');
                        } else {
                            console.log('⚠️ NEEDS IMPROVEMENT');
                            console.log('❌ Mistral supervision may not be working optimally');
                        }
                        
                    } catch (error) {
                        console.log('❌ JSON Parse Error:', error.message);
                        console.log('📄 Raw Response (first 500 chars):');
                        console.log(data.substring(0, 500));
                    }
                } else {
                    console.log('❌ HTTP Error', res.statusCode);
                    console.log('📄 Error Response:', data.substring(0, 500));
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request Timeout (3 minutes)');
            console.log('💡 Large PDF processing may take time');
            req.destroy();
            resolve();
        });
        
        form.pipe(req);
    });
}

function getExpectedValue(isin) {
    const expectedValues = {
        'XS2105981117': 484457,   // Goldman Sachs Structured Note
        'XS2746319610': 192100,   // Societe Generale 32.46% Note
        'XS2993414619': 97700,    // RBC London 0% Notes
        'XS2252299883': 989800,   // Novus Capital Structured Notes
        'XS2407295554': 510114,   // Novus Capital Struct Note
        // Add more expected values from the PDF as needed
    };
    return expectedValues[isin] || null;
}

testMistralComplete().then(() => {
    console.log('\n🔗 API Endpoint: https://pdf-fzzi.onrender.com/api/mistral-supervised');
    console.log('📋 Test completed - Check logs above for detailed analysis');
});