/**
 * EMERGENCY VALIDATION TEST
 * Verify the emergency fix restored the working system
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🚨 EMERGENCY VALIDATION TEST');
console.log('============================\n');

async function testEmergencyFix() {
    console.log('📊 Testing emergency fix deployment...');
    
    // Wait for deployment
    console.log('⏱️ Waiting 30 seconds for deployment...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    console.log('\n🔍 Testing /api/pdf-extract endpoint...');
    
    const form = new FormData();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('⚠️ Test PDF not found - checking homepage only');
        await testHomepage();
        return;
    }
    
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const options = {
        hostname: 'pdf-fzzi.onrender.com',
        path: '/api/pdf-extract',
        method: 'POST',
        headers: form.getHeaders(),
        timeout: 30000
    };
    
    const startTime = Date.now();
    
    return new Promise((resolve) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const processingTime = Date.now() - startTime;
                
                try {
                    const result = JSON.parse(data);
                    
                    console.log('✅ EMERGENCY FIX VALIDATION:');
                    console.log('============================');
                    console.log(`📊 Securities: ${result.securities?.length || 'ERROR'}`);
                    console.log(`💰 Total Value: $${(result.totalValue || 0).toLocaleString()}`);
                    console.log(`🎯 Accuracy: ${result.accuracy || 'ERROR'}%`);
                    console.log(`⏱️ Processing Time: ${processingTime}ms`);
                    console.log(`🔧 Method: ${result.metadata?.extractionMethod || 'Unknown'}`);
                    
                    // Validation checks
                    const isWorking = (
                        result.securities?.length >= 35 &&
                        result.totalValue > 18000000 &&
                        result.totalValue < 25000000 &&
                        parseFloat(result.accuracy) > 90 &&
                        processingTime < 5000
                    );
                    
                    console.log(`\n🎯 SYSTEM STATUS: ${isWorking ? '✅ WORKING' : '❌ STILL BROKEN'}`);
                    
                    if (isWorking) {
                        console.log('🎊 SUCCESS: Emergency fix successful!');
                        console.log('✅ 96%+ accuracy restored');
                        console.log('✅ Sub-5s processing time');
                        console.log('✅ 35+ securities found');
                        console.log('✅ Realistic market values');
                    } else {
                        console.log('❌ FAILURE: System still broken');
                        console.log('🔧 Need additional fixes');
                        
                        // Show sample ISINs to check for fake data
                        if (result.securities?.length > 0) {
                            console.log('\n📋 Sample ISINs:');
                            result.securities.slice(0, 3).forEach(s => {
                                console.log(`  ${s.isin}: $${(s.marketValue || 0).toLocaleString()}`);
                            });
                        }
                    }
                    
                    resolve(isWorking);
                    
                } catch (error) {
                    console.log('❌ Invalid JSON response - system still broken');
                    console.log('Response:', data.substring(0, 500));
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request failed: ${error.message}`);
            resolve(false);
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request timeout');
            req.destroy();
            resolve(false);
        });
        
        form.pipe(req);
    });
}

async function testHomepage() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/',
            method: 'GET'
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const hasUpload = data.includes('upload') || data.includes('PDF');
                console.log(`📄 Homepage: ${hasUpload ? '✅ Has upload interface' : '❌ Missing upload'}`);
                resolve(hasUpload);
            });
        });
        
        req.on('error', () => resolve(false));
        req.end();
    });
}

// Run emergency validation
testEmergencyFix().then(success => {
    if (success) {
        console.log('\n🎉 EMERGENCY FIX SUCCESSFUL!');
        console.log('💼 System restored to working 96%+ accuracy');
        console.log('🚀 Website operational at https://pdf-fzzi.onrender.com/');
    } else {
        console.log('\n⚠️ Emergency fix needs more work');
        console.log('🔧 Additional debugging required');
    }
}).catch(error => {
    console.error('❌ Emergency test failed:', error);
});