/**
 * SIMPLE DEPLOYMENT TEST
 * Test if the deployment is using the new code
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🧪 SIMPLE DEPLOYMENT TEST');
console.log('=========================\n');

async function testSimple() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }
    
    console.log('🌐 Testing: https://pdf-fzzi.onrender.com/api/pdf-extract');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        path: '/api/pdf-extract',
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 60000
    };
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`📊 Status: ${res.statusCode}`);
                
                try {
                    const result = JSON.parse(data);
                    
                    console.log('\n🔍 RESPONSE STRUCTURE:');
                    console.log('======================');
                    console.log(`Success: ${result.success}`);
                    console.log(`Message: ${result.message}`);
                    console.log(`Securities: ${result.securities?.length || 0}`);
                    console.log(`Total Value: $${(result.totalValue || 0).toLocaleString()}`);
                    console.log(`Accuracy: ${result.accuracy}%`);
                    console.log(`Processing Time: ${result.processingTime}ms`);
                    
                    console.log('\n🔍 METADATA CHECK:');
                    console.log('==================');
                    if (result.metadata) {
                        console.log('✅ Metadata exists:');
                        console.log(`  Extraction Method: ${result.metadata.extractionMethod}`);
                        console.log(`  Quality Score: ${result.metadata.qualityScore}`);
                        console.log(`  Confidence: ${result.metadata.confidence}`);
                        console.log(`  Improvements: ${JSON.stringify(result.metadata.improvements)}`);
                    } else {
                        console.log('❌ NO METADATA - This means old code is still running!');
                    }
                    
                    console.log('\n🔍 FIRST SECURITY SAMPLE:');
                    console.log('==========================');
                    if (result.securities && result.securities[0]) {
                        const first = result.securities[0];
                        console.log(`ISIN: ${first.isin}`);
                        console.log(`Name: ${first.name}`);
                        console.log(`Value: $${(first.marketValue || 0).toLocaleString()}`);
                        console.log(`Individual Extraction Method: ${first.extractionMethod}`);
                        console.log(`Currency: ${first.currency || 'Missing'}`);
                        console.log(`Maturity: ${first.maturity || 'Missing'}`);
                        console.log(`Coupon: ${first.coupon || 'Missing'}`);
                    }
                    
                    // Key diagnosis
                    console.log('\n🎯 DIAGNOSIS:');
                    console.log('=============');
                    
                    if (result.metadata?.extractionMethod === 'enhanced-precision-v3-improved') {
                        console.log('✅ SUCCESS: New code deployed and working!');
                    } else if (result.metadata) {
                        console.log(`⚠️ PARTIAL: Metadata exists but wrong method: ${result.metadata.extractionMethod}`);
                    } else {
                        console.log('❌ FAILED: No metadata - old code still running');
                        console.log('   This suggests deployment did not complete successfully');
                    }
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log('❌ JSON parse error:', error.message);
                    console.log('Raw response preview:');
                    console.log(data.substring(0, 200));
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

testSimple().then(result => {
    if (result) {
        console.log('\n✅ Test completed - check diagnosis above');
    } else {
        console.log('\n❌ Test failed');
    }
}).catch(error => {
    console.error('❌ Test error:', error);
});