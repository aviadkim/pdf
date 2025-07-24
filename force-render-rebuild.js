/**
 * Force Render Rebuild Check
 * Check if Render is using the updated build configuration
 */

const https = require('https');

async function checkRenderStatus() {
    console.log('🔍 CHECKING RENDER DEPLOYMENT STATUS');
    console.log('='.repeat(50));
    
    const renderUrl = 'https://pdf-production-5dis.onrender.com';
    
    try {
        // Check health endpoint
        const healthResult = await new Promise((resolve, reject) => {
            https.get(`${renderUrl}/health`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({ raw: data });
                    }
                });
            }).on('error', reject);
        });
        
        console.log('📊 Health Status:');
        console.log(`   Status: ${healthResult.status}`);
        console.log(`   Version: ${healthResult.version}`);
        console.log(`   Uptime: ${healthResult.uptime}s`);
        
        // Check diagnostic endpoint
        const diagnosticResult = await new Promise((resolve, reject) => {
            https.get(`${renderUrl}/api/diagnostic`, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve({ raw: data });
                    }
                });
            }).on('error', reject);
        });
        
        console.log('\n📊 Diagnostic Status:');
        console.log(`   Version: ${diagnosticResult.version}`);
        console.log(`   Deployment: ${diagnosticResult.deployment}`);
        console.log(`   Claude Vision: ${diagnosticResult.claudeVisionAvailable ? '✅' : '❌'}`);
        console.log(`   Page-by-Page: ${diagnosticResult.pageByPageAvailable ? '✅' : '❌'}`);
        console.log(`   Timestamp: ${diagnosticResult.timestamp}`);
        
        // Check if this is a recent deployment
        const deploymentTime = new Date(diagnosticResult.timestamp);
        const timeSinceDeployment = Date.now() - deploymentTime.getTime();
        const minutesSinceDeployment = Math.round(timeSinceDeployment / 60000);
        
        console.log(`   Time since deployment: ${minutesSinceDeployment} minutes ago`);
        
        if (minutesSinceDeployment > 30) {
            console.log('\n⚠️  DEPLOYMENT ISSUE DETECTED:');
            console.log('   This deployment is more than 30 minutes old');
            console.log('   Render may not have picked up the latest commit');
            console.log('\n💡 SOLUTIONS:');
            console.log('   1. Check Render dashboard for build logs');
            console.log('   2. Manually trigger a redeploy in Render');
            console.log('   3. Verify render.yaml is being used');
            console.log('   4. Check build command: npm run build:render');
        } else {
            console.log('\n✅ Deployment appears recent');
        }
        
        // Show expected vs actual build command
        console.log('\n🔧 BUILD CONFIGURATION:');
        console.log('   Expected: npm run build:render');
        console.log('   Expected installs: poppler-utils ghostscript imagemagick');
        console.log('   Current issue: ImageMagick still not found');
        
        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Verify Render is using the updated build command');
        console.log('   2. Check build logs for ImageMagick installation');
        console.log('   3. May need to manually redeploy on Render dashboard');
        
    } catch (error) {
        console.log(`❌ Error checking status: ${error.message}`);
    }
}

checkRenderStatus();