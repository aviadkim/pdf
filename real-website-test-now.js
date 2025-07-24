/**
 * REAL WEBSITE TEST - Test exactly what user experiences
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔍 REAL WEBSITE TEST - ACTUAL USER EXPERIENCE');
console.log('==============================================\n');

async function testRealWebsite() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Cannot test - PDF file not found');
        return;
    }
    
    console.log('📄 Testing with actual Messos PDF...');
    console.log('🌐 URL: https://pdf-fzzi.onrender.com/api/pdf-extract');
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        path: '/api/pdf-extract',
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 60000
    };
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const processingTime = Date.now() - startTime;
                
                console.log(`📊 Response Status: ${res.statusCode}`);
                console.log(`⏱️ Total Time: ${processingTime}ms`);
                console.log(`📝 Response Length: ${data.length} chars\n`);
                
                try {
                    const result = JSON.parse(data);
                    
                    console.log('📊 ACTUAL RESULTS FROM LIVE WEBSITE:');
                    console.log('====================================');
                    console.log(`Success: ${result.success}`);
                    console.log(`Message: ${result.message}`);
                    console.log(`Securities Count: ${result.securities?.length || 0}`);
                    console.log(`Total Value: $${(result.totalValue || 0).toLocaleString()}`);
                    console.log(`Accuracy: ${result.accuracy}%`);
                    console.log(`Processing Time: ${result.processingTime}ms`);
                    console.log(`Extraction Method: ${result.metadata?.extractionMethod || 'Unknown'}`);
                    
                    console.log('\n📋 FIRST 3 SECURITIES (CHECKING FOR FAKE DATA):');
                    console.log('===============================================');
                    
                    if (result.securities && result.securities.length > 0) {
                        result.securities.slice(0, 3).forEach((security, i) => {
                            console.log(`${i + 1}. ISIN: ${security.isin}`);
                            console.log(`   Name: ${security.name}`);
                            console.log(`   Value: $${(security.marketValue || 0).toLocaleString()}`);
                            console.log(`   Currency: ${security.currency || 'Unknown'}`);
                            
                            // Check for fake data indicators
                            const isinValid = /^[A-Z]{2}[A-Z0-9]{10}$/.test(security.isin);
                            const valueRealistic = security.marketValue >= 10000 && security.marketValue <= 5000000;
                            const nameReal = security.name !== 'UNKNOWN_SECURITY' && !security.name.includes('UNKNOWN');
                            
                            console.log(`   ✅ ISIN Valid: ${isinValid ? 'YES' : 'NO (FAKE!)'}`);
                            console.log(`   ✅ Value Realistic: ${valueRealistic ? 'YES' : 'NO (SUSPICIOUS!)'}`);
                            console.log(`   ✅ Name Real: ${nameReal ? 'YES' : 'NO (GENERIC!)'}`);
                            console.log('');
                        });
                    } else {
                        console.log('❌ No securities found in response');
                    }
                    
                    // Overall assessment
                    console.log('🎯 REAL DATA QUALITY ASSESSMENT:');
                    console.log('================================');
                    
                    const hasRealData = (
                        result.securities?.length >= 20 &&
                        result.totalValue > 15000000 &&
                        result.totalValue < 25000000 &&
                        parseFloat(result.accuracy) > 85
                    );
                    
                    console.log(`Overall Quality: ${hasRealData ? '✅ GOOD' : '❌ BAD'}`);
                    
                    if (!hasRealData) {
                        console.log('\n🚨 PROBLEMS IDENTIFIED:');
                        if (result.securities?.length < 20) console.log('• Too few securities found');
                        if (result.totalValue <= 15000000) console.log('• Total value too low');
                        if (result.totalValue >= 25000000) console.log('• Total value too high'); 
                        if (parseFloat(result.accuracy) <= 85) console.log('• Accuracy too low');
                    }
                    
                    // Save raw response for analysis
                    const timestamp = Date.now();
                    fs.writeFileSync(`real-website-test-${timestamp}.json`, JSON.stringify(result, null, 2));
                    console.log(`\n💾 Raw response saved: real-website-test-${timestamp}.json`);
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log('❌ Failed to parse JSON response');
                    console.log('Raw response:', data);
                    
                    fs.writeFileSync(`error-response-${Date.now()}.txt`, data);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve(null);
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request timed out');
            req.destroy();
            resolve(null);
        });
        
        form.pipe(req);
    });
}

// Run the real test
testRealWebsite().then(result => {
    if (result) {
        console.log('\n🎯 CONCLUSION: Real website test complete');
        console.log('Now we can see exactly what needs to be fixed!');
    } else {
        console.log('\n❌ Real website test failed - need to investigate');
    }
}).catch(error => {
    console.error('❌ Test error:', error);
});