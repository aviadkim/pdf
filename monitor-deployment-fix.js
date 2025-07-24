/**
 * MONITOR DEPLOYMENT FIX
 * Wait for Render to deploy the corrected configuration
 */

console.log('🚀 MONITORING DEPLOYMENT FIX');
console.log('===========================\n');

const https = require('https');

async function checkDeployment() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'pdf-fzzi.onrender.com',
            path: '/',
            method: 'GET',
            timeout: 5000
        };
        
        const req = https.request(options, (res) => {
            console.log(`📊 Status: ${res.statusCode}`);
            console.log(`📍 Headers: ${JSON.stringify(res.headers['x-powered-by'])}`);
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const hasUploadInterface = data.includes('MCP-Enhanced PDF Processor') || 
                                             data.includes('PDF Processor') ||
                                             data.includes('upload');
                    console.log(`✅ Upload interface present: ${hasUploadInterface}`);
                    resolve({ success: true, hasInterface: hasUploadInterface });
                } else {
                    console.log(`❌ Error: Status ${res.statusCode}`);
                    resolve({ success: false });
                }
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ Connection error: ${err.message}`);
            resolve({ success: false });
        });
        
        req.on('timeout', () => {
            console.log('⏱️ Request timeout');
            req.destroy();
            resolve({ success: false });
        });
        
        req.end();
    });
}

async function monitorDeployment() {
    console.log('📊 Checking deployment status...\n');
    
    let attempts = 0;
    const maxAttempts = 20;
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`\n🔄 Attempt ${attempts}/${maxAttempts}:`);
        
        const result = await checkDeployment();
        
        if (result.success && result.hasInterface) {
            console.log('\n✅ DEPLOYMENT SUCCESSFUL!');
            console.log('🎯 Upload interface is now available');
            console.log('🌐 Visit: https://pdf-fzzi.onrender.com/');
            
            // Test the API endpoint
            console.log('\n📊 Testing API endpoint...');
            await testApiEndpoint();
            
            return;
        }
        
        if (attempts < maxAttempts) {
            console.log('⏳ Waiting 30 seconds before next check...');
            await new Promise(resolve => setTimeout(resolve, 30000));
        }
    }
    
    console.log('\n⚠️ Deployment monitoring timed out');
    console.log('💡 Check Render dashboard for deployment status');
}

async function testApiEndpoint() {
    const FormData = require('form-data');
    const fs = require('fs');
    
    try {
        const form = new FormData();
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        
        if (fs.existsSync(pdfPath)) {
            form.append('pdf', fs.createReadStream(pdfPath));
            
            const options = {
                hostname: 'pdf-fzzi.onrender.com',
                path: '/api/pdf-extract',
                method: 'POST',
                headers: form.getHeaders()
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(data);
                        console.log(`✅ API Response: ${result.securities?.length || 0} securities`);
                        console.log(`💰 Total: $${result.totalValue?.toLocaleString() || 0}`);
                    } catch (e) {
                        console.log('❌ Invalid API response');
                    }
                });
            });
            
            form.pipe(req);
        } else {
            console.log('⚠️ Test PDF not found');
        }
    } catch (error) {
        console.log(`❌ API test error: ${error.message}`);
    }
}

console.log('🔧 Fixed configuration:');
console.log('- Changed startCommand to: node express-server.js');
console.log('- Added routes for / and /api/upload');
console.log('- Upload interface will be served from upload-interface.html\n');

monitorDeployment().catch(console.error);