// Check which server version is actually running
const https = require('https');

async function checkServerVersion() {
    console.log('🔍 CHECKING ACTUAL SERVER VERSION');
    console.log('=================================');
    
    try {
        // Check homepage title
        console.log('📄 Checking homepage...');
        const options = {
            hostname: 'pdf-production-5dis.onrender.com',
            port: 443,
            path: '/',
            method: 'GET'
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const titleMatch = data.match(/<title>([^<]+)<\/title>/);
                const versionMatch = data.match(/v\d+\.\d+/);
                
                console.log(`   Title: ${titleMatch ? titleMatch[1] : 'Not found'}`);
                console.log(`   Version: ${versionMatch ? versionMatch[0] : 'Not found'}`);
                
                if (data.includes('page-by-page') || data.includes('99% Accuracy')) {
                    console.log('   ✅ New server is running');
                } else {
                    console.log('   ❌ Old server is still running');
                }
            });
        });

        req.on('error', (error) => {
            console.log(`   ❌ Error: ${error.message}`);
        });

        req.end();

        // Check diagnostic vs actual endpoints
        setTimeout(async () => {
            console.log('\n🔍 Comparing diagnostic vs reality...');
            
            // Get diagnostic
            const diagReq = https.request({
                hostname: 'pdf-production-5dis.onrender.com',
                port: 443,
                path: '/api/diagnostic',
                method: 'GET'
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const diag = JSON.parse(data);
                        console.log(`   Diagnostic version: ${diag.version}`);
                        console.log(`   Diagnostic endpoints: ${Object.keys(diag.endpoints || {}).length} listed`);
                        
                        // Test if bulletproof actually works (it should on old server)
                        setTimeout(() => {
                            console.log('\n🔍 Testing known working endpoint...');
                            const testReq = https.request({
                                hostname: 'pdf-production-5dis.onrender.com',
                                port: 443,
                                path: '/api/bulletproof-processor',
                                method: 'GET'
                            }, (res) => {
                                console.log(`   /api/bulletproof-processor status: ${res.statusCode}`);
                                if (res.statusCode === 404) {
                                    console.log('   ❌ Even legacy endpoint not working - server may be broken');
                                } else if (res.statusCode === 405) {
                                    console.log('   ✅ Legacy endpoint exists (needs POST)');
                                }
                            });
                            testReq.on('error', err => console.log(`   Error: ${err.message}`));
                            testReq.end();
                        }, 1000);
                        
                    } catch (e) {
                        console.log(`   ❌ Diagnostic parsing error: ${e.message}`);
                    }
                });
            });

            diagReq.on('error', (error) => {
                console.log(`   ❌ Diagnostic error: ${error.message}`);
            });

            diagReq.end();
        }, 2000);

    } catch (error) {
        console.log(`❌ Check failed: ${error.message}`);
    }
}

checkServerVersion();