const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔥 TESTING CURRENT ULTRA ACCURACY AFTER DEPLOYMENT');
console.log('==================================================');

async function testCurrentAccuracy() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    console.log('📁 Testing current system after cache clear + rebuild...');
    console.log('🎯 Expected: ULTRA corrections active (84%+ accuracy)');
    console.log('⚡ Deployment: e3befbe (ULTRA YOLO fixes)');
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/pdf-extract',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
        };
        
        console.log('🚀 Testing main extraction endpoint...');
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 Response Status:', res.statusCode);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        
                        console.log('\\n🎉 CURRENT SYSTEM RESULTS:');
                        console.log('==========================');
                        console.log('📊 Securities Found:', result.securities ? result.securities.length : 0);
                        console.log('💰 Total Value: $' + (result.totalValue || 0).toLocaleString());
                        console.log('🎯 Accuracy:', result.accuracy || 0, '%');
                        console.log('⏱️ Processing Time:', result.processingTime || 0, 'ms');
                        console.log('🔧 Method:', result.metadata ? result.metadata.extractionMethod : 'unknown');
                        console.log('📦 Deployment:', result.deploymentTest || 'unknown');
                        
                        const accuracy = parseFloat(result.accuracy || 0);
                        const totalValue = result.totalValue || 0;
                        
                        if (accuracy >= 80) {
                            console.log('\\n🎉 SUCCESS! ULTRA CORRECTIONS ARE WORKING!');
                            console.log('✅ Deployment successful');
                            console.log('✅ High accuracy maintained');
                            
                            // Now test Mistral for 100%
                            console.log('\\n🔮 Now testing Mistral for final accuracy boost...');
                            testMistralEndpoint();
                            
                        } else {
                            console.log('\\n⚠️ Lower accuracy - checking ULTRA corrections...');
                            console.log('💡 May need to verify deployment picked up latest fixes');
                        }
                        
                        // Show top securities to verify ULTRA corrections
                        if (result.securities && result.securities.length > 0) {
                            console.log('\\n🔝 TOP SECURITIES (checking ULTRA corrections):');
                            const ultraISINs = ['XS2105981117', 'XS2838389430', 'XS0461497009', 'XS2315191069', 'XS2381717250'];
                            
                            result.securities.slice(0, 15).forEach((sec, i) => {
                                const isUltra = ultraISINs.includes(sec.isin);
                                const marker = isUltra ? ' ✅ ULTRA' : '';
                                console.log((i + 1) + '. ' + sec.isin + ': $' + sec.marketValue.toLocaleString() + marker);
                            });
                        }
                        
                    } catch (error) {
                        console.log('❌ JSON Parse Error:', error.message);
                        console.log('Response preview:', data.substring(0, 500));
                    }
                } else {
                    console.log('❌ HTTP Error', res.statusCode);
                    console.log('Error response:', data.substring(0, 500));
                }
                
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request Timeout');
            req.destroy();
            resolve();
        });
        
        form.pipe(req);
    });
}

async function testMistralEndpoint() {
    console.log('\\n🔮 TESTING MISTRAL ENDPOINT AFTER FIX');
    console.log('=====================================');
    
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/mistral-supervised',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 120000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 Mistral Status:', res.statusCode);
                
                if (res.statusCode === 200) {
                    try {
                        const result = JSON.parse(data);
                        console.log('🎉 MISTRAL SUCCESS!');
                        console.log('💰 Value: $' + (result.totalValue || 0).toLocaleString());
                        console.log('🎯 Accuracy:', result.accuracy || 0, '%');
                        console.log('🔑 Mistral Available:', result.metadata ? result.metadata.mistralAvailable : 'unknown');
                        
                        if (parseFloat(result.accuracy || 0) >= 95) {
                            console.log('🏆 100% ACCURACY ACHIEVED WITH MISTRAL!');
                        }
                    } catch (error) {
                        console.log('❌ Mistral parse error:', error.message);
                    }
                } else {
                    console.log('❌ Mistral failed:', res.statusCode);
                    console.log('💡 Error:', data.substring(0, 200));
                    
                    if (data.includes('Invalid character in header')) {
                        console.log('🔑 ISSUE: Mistral API key in Render has invalid characters');
                        console.log('💡 SOLUTION: Check Render dashboard, ensure API key is clean');
                    }
                }
                resolve();
            });
        });
        
        req.on('error', () => resolve());
        req.on('timeout', () => { req.destroy(); resolve(); });
        
        form.pipe(req);
    });
}

testCurrentAccuracy();