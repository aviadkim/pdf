/**
 * DEBUG PRODUCTION ISSUE - Find why extraction is failing
 */
const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🔥 YOLO MODE: DEBUG PRODUCTION ISSUE');
console.log('====================================');

async function debugProductionIssue() {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    // Test multiple endpoints to see what's working
    const endpoints = [
        '/api/pdf-extract',
        '/api/bulletproof-processor',
        '/api/mistral-supervised'
    ];
    
    for (const endpoint of endpoints) {
        console.log(`\n🔍 TESTING: ${endpoint}`);
        console.log('='.repeat(50));
        
        try {
            const result = await testEndpoint(endpoint);
            if (result) {
                console.log(`📊 Securities: ${result.securities?.length || 0}`);
                console.log(`💰 Total: $${(result.totalValue || 0).toLocaleString()}`);
                console.log(`🎯 Accuracy: ${result.accuracy || 0}%`);
                
                // Check for error messages or debug info
                if (result.error) {
                    console.log(`❌ Error: ${result.error}`);
                }
                
                if (result.message) {
                    console.log(`💬 Message: ${result.message}`);
                }
                
                // Save the response for analysis
                fs.writeFileSync(`debug-${endpoint.replace(/\//g, '-')}.json`, JSON.stringify(result, null, 2));
            }
        } catch (error) {
            console.log(`❌ ${endpoint} failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between requests
    }
}

async function testEndpoint(path) {
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    return new Promise((resolve) => {
        const form = new FormData();
        form.append('pdf', fs.createReadStream(pdfPath));
        
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: path,
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    console.log(`Parse error for ${path}:`, error.message);
                    resolve({ error: 'Parse failed', rawData: data.substring(0, 500) });
                }
            });
        });
        
        req.on('error', (error) => {
            resolve({ error: error.message });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({ error: 'timeout' });
        });
        
        form.pipe(req);
    });
}

debugProductionIssue().then(() => {
    console.log('\n🔥 DEBUG COMPLETE - Check debug-*.json files for analysis');
}).catch(console.error);