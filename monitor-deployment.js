/**
 * MONITOR DEPLOYMENT STATUS
 * Check when the new code is deployed
 */

const https = require('https');

console.log('👀 MONITORING DEPLOYMENT STATUS');
console.log('===============================\n');

let attempts = 0;
const maxAttempts = 20; // 10 minutes total

async function checkDeployment() {
    attempts++;
    console.log(`🔍 Check ${attempts}/${maxAttempts} - Testing /api/system-capabilities...`);
    
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
                    
                    if (result.timestamp) {
                        const serverTime = new Date(result.timestamp);
                        const deployTime = new Date();
                        const timeDiff = deployTime - serverTime;
                        
                        console.log(`📊 Server timestamp: ${result.timestamp}`);
                        console.log(`⏰ Time difference: ${Math.abs(timeDiff / 1000).toFixed(0)}s`);
                        
                        // If server timestamp is recent (within 5 minutes), deployment is fresh
                        if (timeDiff < 300000) {
                            console.log('✅ FRESH DEPLOYMENT DETECTED!');
                            resolve(true);
                            return;
                        }
                    }
                    
                    console.log('⏳ Old deployment still running...');
                    resolve(false);
                    
                } catch (error) {
                    console.log(`❌ Parse error: ${error.message}`);
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
        
        req.end();
    });
}

async function monitorDeployment() {
    while (attempts < maxAttempts) {
        const isDeployed = await checkDeployment();
        
        if (isDeployed) {
            console.log('\n🎉 DEPLOYMENT READY!');
            console.log('You can now test the quality improvements.');
            return;
        }
        
        if (attempts >= maxAttempts) {
            console.log('\n⚠️ TIMEOUT: Deployment taking longer than expected');
            console.log('Manual check recommended');
            return;
        }
        
        console.log(`⏳ Waiting 30 seconds before next check...\n`);
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

monitorDeployment().catch(error => {
    console.error('❌ Monitor error:', error);
});