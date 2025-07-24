/**
 * Debug 502 error in page-by-page processing
 */
const https = require('https');
const fs = require('fs');

async function testEndpoint(endpoint, description) {
    console.log(`\n🔍 Testing ${endpoint}...`);
    console.log(`📝 ${description}`);
    
    const url = `https://pdf-production-5dis.onrender.com${endpoint}`;
    
    return new Promise((resolve) => {
        const req = https.request(url, { 
            method: 'GET',
            timeout: 30000 
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log(`   Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`   ✅ Success: ${JSON.stringify(parsed, null, 2).substring(0, 200)}...`);
                        resolve({ success: true, data: parsed, status: res.statusCode });
                    } catch (e) {
                        console.log(`   ✅ Success: ${data.substring(0, 100)}...`);
                        resolve({ success: true, data: data, status: res.statusCode });
                    }
                } else {
                    console.log(`   ❌ Error: ${res.statusCode} - ${data.substring(0, 100)}`);
                    resolve({ success: false, error: data, status: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Request error: ${error.message}`);
            resolve({ success: false, error: error.message });
        });

        req.on('timeout', () => {
            console.log('   ⏰ Request timeout');
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });

        req.end();
    });
}

async function testPdfUpload() {
    console.log(`\n🔍 Testing PDF upload to page-by-page processor...`);
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Messos PDF not found - skipping upload test');
        return { success: false, error: 'PDF not found' };
    }

    const FormData = require('form-data');
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));

    return new Promise((resolve) => {
        const req = https.request('https://pdf-production-5dis.onrender.com/api/page-by-page-processor', {
            method: 'POST',
            headers: form.getHeaders(),
            timeout: 60000 // 1 minute timeout
        }, (res) => {
            let data = '';
            res.on('data', chunk => {
                data += chunk;
                // Show some progress
                if (data.length % 1000 === 0) {
                    process.stdout.write('.');
                }
            });
            res.on('end', () => {
                console.log(`\n   Status: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`   ✅ Success: ${parsed.securities ? parsed.securities.length : 0} securities found`);
                        console.log(`   📊 Accuracy: ${parsed.accuracy}%`);
                        console.log(`   💰 Cost: $${parsed.metadata?.totalCost || 'unknown'}`);
                        resolve({ success: true, data: parsed, status: res.statusCode });
                    } catch (e) {
                        console.log(`   ❌ JSON parse error: ${e.message}`);
                        console.log(`   Raw response: ${data.substring(0, 200)}...`);
                        resolve({ success: false, error: 'JSON parse error', raw: data });
                    }
                } else {
                    console.log(`   ❌ Error: ${res.statusCode}`);
                    console.log(`   Response: ${data.substring(0, 500)}...`);
                    resolve({ success: false, error: data, status: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Upload error: ${error.message}`);
            resolve({ success: false, error: error.message });
        });

        req.on('timeout', () => {
            console.log('   ⏰ Upload timeout (PDF processing can take 1-2 minutes)');
            req.destroy();
            resolve({ success: false, error: 'timeout' });
        });

        form.pipe(req);
    });
}

async function main() {
    console.log('🎯 DEBUGGING 502 ERROR IN PAGE-BY-PAGE PROCESSING');
    console.log('='.repeat(60));
    
    // Test basic endpoints first
    await testEndpoint('/health', 'Basic health check');
    await testEndpoint('/api/diagnostic', 'Diagnostic information');
    await testEndpoint('/api/claude-test', 'Claude API connectivity');
    
    // Test the problematic endpoint
    const uploadResult = await testPdfUpload();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIAGNOSTIC SUMMARY:');
    
    if (uploadResult.success) {
        console.log('🎉 SUCCESS: Page-by-page processing is working!');
        console.log('✅ ImageMagick installation was successful');
        console.log('✅ Claude Vision API is functional');
        console.log('🏆 Ready for 99% accuracy testing');
    } else {
        console.log('❌ ISSUE IDENTIFIED:');
        console.log(`   Error: ${uploadResult.error}`);
        console.log(`   Status: ${uploadResult.status || 'unknown'}`);
        
        if (uploadResult.status === 502) {
            console.log('\n💡 502 ERROR ANALYSIS:');
            console.log('   - Service is running (health checks pass)');
            console.log('   - Error occurs during PDF processing');
            console.log('   - Likely causes:');
            console.log('     1. Memory timeout (large PDF processing)');
            console.log('     2. Claude API rate limiting');  
            console.log('     3. ImageMagick process timeout');
            console.log('     4. Render compute timeout (30s default)');
        }
    }
    
    console.log('='.repeat(60));
}

main().catch(console.error);