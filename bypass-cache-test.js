/**
 * BYPASS CACHE TEST
 * Test with cache-busting headers to bypass any CDN/proxy caching
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🚫 BYPASS CACHE TEST');
console.log('===================\n');

async function testWithCacheBusting() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }
    
    console.log('🌐 Testing with cache-busting headers...');
    console.log(`🔍 URL: https://pdf-fzzi.onrender.com/api/pdf-extract?t=${Date.now()}`);
    
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const headers = {
        ...form.getHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Bypass-Cache': 'true',
        'X-Force-Fresh': Date.now().toString()
    };
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        path: `/api/pdf-extract?cachebust=${Date.now()}`,
        method: 'POST',
        headers: headers,
        timeout: 60000
    };
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`📊 Response Headers:`);
            Object.keys(res.headers).forEach(key => {
                if (key.toLowerCase().includes('cache') || key.toLowerCase().includes('age') || key.toLowerCase().includes('etag')) {
                    console.log(`  ${key}: ${res.headers[key]}`);
                }
            });
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`\n📊 Status: ${res.statusCode}`);
                
                try {
                    const result = JSON.parse(data);
                    
                    console.log('\n🔍 CRITICAL DIAGNOSTIC FIELDS:');
                    console.log('==============================');
                    console.log(`deploymentTest: ${result.deploymentTest || 'MISSING! 🚨'}`);
                    console.log(`timestamp: ${result.timestamp || 'MISSING! 🚨'}`);
                    console.log(`metadata.serverFile: ${result.metadata?.serverFile || 'MISSING! 🚨'}`);
                    console.log(`metadata.extractionMethod: ${result.metadata?.extractionMethod || 'MISSING! 🚨'}`);
                    console.log(`metadata.deploymentVersion: ${result.metadata?.deploymentVersion || 'MISSING! 🚨'}`);
                    
                    if (result.deploymentTest && result.deploymentTest.includes('QUALITY FIXES ACTIVE')) {
                        console.log('\n🎉 SUCCESS! Quality fixes are now active!');
                        
                        // Test quality improvements
                        console.log('\n🔍 QUALITY IMPROVEMENTS CHECK:');
                        console.log('==============================');
                        
                        const securities = result.securities || [];
                        const withCurrency = securities.filter(s => s.currency && s.currency !== 'Unknown').length;
                        const withMaturity = securities.filter(s => s.maturity).length;
                        const withCoupon = securities.filter(s => s.coupon).length;
                        
                        console.log(`💱 Securities with currency: ${withCurrency}/${securities.length}`);
                        console.log(`📅 Securities with maturity: ${withMaturity}/${securities.length}`);
                        console.log(`💰 Securities with coupon: ${withCoupon}/${securities.length}`);
                        
                        // Value diversity test
                        const valueGroups = {};
                        securities.forEach(security => {
                            const val = security.marketValue;
                            if (!valueGroups[val]) valueGroups[val] = 0;
                            valueGroups[val]++;
                        });
                        
                        const repeatedValues = Object.keys(valueGroups).filter(val => valueGroups[val] > 2);
                        console.log(`🔁 Repeated values: ${repeatedValues.length}`);
                        
                        if (withCurrency > 0 || withMaturity > 0 || withCoupon > 0 || repeatedValues.length < 5) {
                            console.log('✅ Quality improvements are working!');
                        } else {
                            console.log('⚠️ Quality improvements may need more work');
                        }
                        
                    } else {
                        console.log('\n❌ STILL FAILED: Diagnostic markers not found');
                        console.log('This means the updated code is STILL not running');
                        
                        // Check if this is the exact same response as before
                        if (result.securities && result.securities[0] && 
                            result.securities[0].extractionMethod === 'production-ready-validated') {
                            console.log('🚨 EXACT SAME OLD RESPONSE - This suggests:');
                            console.log('   1. Strong response caching');
                            console.log('   2. Load balancer serving old instances');
                            console.log('   3. Different deployment environment');
                            console.log('   4. Build process not actually updating code');
                        }
                    }
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log('❌ JSON parse error:', error.message);
                    console.log('Raw response preview:', data.substring(0, 200));
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

testWithCacheBusting().then(result => {
    console.log('\n🎯 CACHE BYPASS TEST COMPLETE');
}).catch(error => {
    console.error('❌ Test error:', error);
});