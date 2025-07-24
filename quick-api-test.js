/**
 * QUICK API TEST - Direct test without Puppeteer
 * Get the real numbers from the live API
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔥 QUICK LIVE API TEST');
console.log('=====================');

async function quickAPITest() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }
    
    console.log('📄 Testing with: ' + pdfPath);
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/pdf-extract',
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 30000
        };
        
        console.log('🌐 Sending request to live API...');
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    
                    console.log('\n🎯 LIVE WEBSITE RESULTS:');
                    console.log('========================');
                    console.log(`📊 Status: ${res.statusCode}`);
                    console.log(`📊 Securities: ${result.securities?.length || 0}`);
                    console.log(`💰 Total Value: $${(result.totalValue || 0).toLocaleString()}`);
                    console.log(`🎯 Accuracy: ${result.accuracy || 0}%`);
                    console.log(`⏱️ Processing Time: ${result.processingTime || 0}ms`);
                    console.log(`🎯 Target: $19,464,431`);
                    
                    // Check if we have the deployment marker
                    if (result.deploymentTest) {
                        console.log(`🚀 Deployment Marker: ${result.deploymentTest}`);
                    }
                    
                    if (result.metadata?.deploymentVersion) {
                        console.log(`📦 Version: ${result.metadata.deploymentVersion}`);
                    }
                    
                    // Calculate real accuracy
                    if (result.totalValue && result.totalValue > 1000000) {
                        const realAccuracy = Math.min(100, (Math.min(19464431, result.totalValue) / Math.max(19464431, result.totalValue)) * 100);
                        console.log(`📊 Calculated Accuracy: ${realAccuracy.toFixed(2)}%`);
                        
                        if (realAccuracy > 90) {
                            console.log('🎉 SUCCESS! High accuracy detected!');
                        }
                    }
                    
                    // Show top 5 securities
                    if (result.securities && result.securities.length > 0) {
                        console.log('\n📋 TOP 5 SECURITIES:');
                        result.securities
                            .sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0))
                            .slice(0, 5)
                            .forEach((sec, i) => {
                                console.log(`${i + 1}. ${sec.isin}: $${(sec.marketValue || 0).toLocaleString()}`);
                            });
                    }
                    
                    // Save results
                    fs.writeFileSync('live-api-results.json', JSON.stringify(result, null, 2));
                    console.log('\n✅ Results saved to live-api-results.json');
                    
                    resolve(result);
                    
                } catch (error) {
                    console.log(`❌ Parse error: ${error.message}`);
                    console.log('Raw response:', data.substring(0, 500));
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

// Also test the system capabilities
async function testSystemCapabilities() {
    console.log('\n🔍 TESTING SYSTEM CAPABILITIES:');
    console.log('===============================');
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/api/system-capabilities',
            method: 'GET',
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log(`📊 System: ${result.system || 'Unknown'}`);
                    console.log(`⏰ Timestamp: ${result.timestamp}`);
                    console.log(`🔮 Mistral Available: ${result.environment?.mistral_api_configured ? 'Yes' : 'No'}`);
                    
                    resolve(result);
                } catch (error) {
                    console.log(`❌ Parse error: ${error.message}`);
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.on('timeout', () => {
            req.destroy();
            resolve(null);
        });
        
        req.end();
    });
}

// Run both tests
async function runTests() {
    await testSystemCapabilities();
    const result = await quickAPITest();
    
    if (result) {
        console.log('\n🎯 FINAL ASSESSMENT:');
        console.log('====================');
        
        const accuracy = parseFloat(result.accuracy || 0);
        const totalValue = result.totalValue || 0;
        
        if (accuracy > 90 || totalValue > 18000000) {
            console.log('✅ SUCCESS! New deployment with high accuracy is working!');
        } else if (totalValue > 10000000) {
            console.log('⚡ PROGRESS! System is extracting reasonable values');
        } else {
            console.log('⏳ WAITING! Old deployment still active, new one needs more time');
        }
    }
}

runTests().catch(console.error);