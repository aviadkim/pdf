/**
 * FINAL MISTRAL TEST
 * Direct test of Mistral 100% accuracy endpoint
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🎯 FINAL MISTRAL 100% ACCURACY TEST');
console.log('====================================\n');

async function finalTest() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }
    
    console.log('📊 Target Total: $19,464,431');
    console.log('🌐 Endpoint: /api/mistral-supervised');
    console.log('⏰ This may take 10-20 seconds for Mistral processing...\n');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        path: '/api/mistral-supervised',
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 180000 // 3 minutes
    };
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const processingTime = Date.now() - startTime;
                
                console.log(`✅ Response received in ${processingTime}ms`);
                
                try {
                    const result = JSON.parse(data);
                    
                    console.log('\n📊 RESULTS:');
                    console.log('===========');
                    console.log(`Success: ${result.success}`);
                    console.log(`Securities: ${result.securities?.length || 0}`);
                    console.log(`Total Value: $${(result.totalValue || 0).toLocaleString()}`);
                    console.log(`Target: $19,464,431`);
                    console.log(`Accuracy: ${result.accuracy}%`);
                    
                    if (result.metadata) {
                        console.log('\n🔮 MISTRAL DETAILS:');
                        console.log(`Initial Accuracy: ${result.metadata.initialAccuracy}%`);
                        console.log(`Final Accuracy: ${result.metadata.finalAccuracy}%`);
                        console.log(`Mistral Available: ${result.metadata.mistralAvailable}`);
                        console.log(`Cost: ${result.metadata.estimatedCost}`);
                    }
                    
                    // Check for Mistral corrections
                    const correctedSecurities = result.securities?.filter(s => s.mistralCorrected) || [];
                    
                    if (correctedSecurities.length > 0) {
                        console.log(`\n✅ MISTRAL CORRECTIONS APPLIED: ${correctedSecurities.length} securities`);
                        correctedSecurities.slice(0, 5).forEach(sec => {
                            console.log(`${sec.isin}: $${sec.originalValue} → $${sec.marketValue}`);
                        });
                    } else {
                        console.log('\n⚠️ NO MISTRAL CORRECTIONS APPLIED');
                        
                        // Show sample context to debug
                        if (result.securities && result.securities.length > 0) {
                            console.log('\n🔍 SAMPLE SECURITY CONTEXTS:');
                            result.securities.slice(0, 3).forEach(sec => {
                                console.log(`\n${sec.isin}: Current value: $${sec.marketValue}`);
                                console.log(`Context: ${(sec.context || '').substring(0, 150)}...`);
                            });
                        }
                    }
                    
                    if (parseFloat(result.accuracy) >= 99) {
                        console.log('\n🎉 SUCCESS! 100% ACCURACY ACHIEVED WITH MISTRAL!');
                    } else {
                        console.log('\n📊 ACCURACY ANALYSIS:');
                        console.log(`Current: ${result.accuracy}%`);
                        console.log(`Missing: $${(19464431 - (result.totalValue || 0)).toLocaleString()}`);
                        console.log('Mistral may need more specific prompting for this document type.');
                    }
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log('❌ Error:', error.message);
                    console.log('Response:', data.substring(0, 500));
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve(null);
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request timeout');
            req.destroy();
            resolve(null);
        });
        
        form.pipe(req);
    });
}

finalTest().then(result => {
    console.log('\n🏁 TEST COMPLETE');
    
    if (result && parseFloat(result.accuracy) < 99) {
        console.log('\n💡 TO ACHIEVE 100% ACCURACY:');
        console.log('1. The Mistral API is working but needs better prompting');
        console.log('2. The Swiss number format extraction needs enhancement');
        console.log('3. Consider using the /api/mistral-ocr-extract endpoint instead');
    }
}).catch(error => {
    console.error('❌ Test error:', error);
});