/**
 * CHECK 500 ERROR
 * Test PDF endpoint and get actual error message
 */

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

console.log('🚨 CHECKING 500 ERROR');
console.log('====================\n');

async function check500Error() {
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
                console.log(`📊 Content-Type: ${res.headers['content-type']}`);
                
                if (res.statusCode === 500) {
                    console.log('\n🚨 500 ERROR DETAILS:');
                    console.log('====================');
                    
                    try {
                        const result = JSON.parse(data);
                        console.log('Error:', result.error);
                        console.log('Message:', result.message);
                        console.log('Stack:', result.stack);
                    } catch (parseError) {
                        console.log('Raw error response:');
                        console.log(data);
                    }
                } else {
                    console.log('\n✅ SUCCESS - No 500 error');
                    try {
                        const result = JSON.parse(data);
                        console.log('deploymentTest:', result.deploymentTest);
                        console.log('extractionMethod:', result.metadata?.extractionMethod);
                        console.log('Securities found:', result.securities?.length);
                    } catch (e) {
                        console.log('Response preview:', data.substring(0, 200));
                    }
                }
                
                resolve(data);
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

check500Error().then(() => {
    console.log('\n🎯 ERROR CHECK COMPLETE');
}).catch(error => {
    console.error('❌ Test error:', error);
});