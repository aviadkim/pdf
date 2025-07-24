/**
 * WAIT AND TEST IMPROVEMENTS
 * Monitor deployment and test once improvements are live
 */

const fetch = require('node-fetch');

async function waitForDeploymentAndTest() {
    console.log('⏳ WAITING FOR DEPLOYMENT TO COMPLETE');
    console.log('====================================\n');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    let deploymentComplete = false;
    let attempts = 0;
    
    console.log('🔍 Checking for enhanced extraction system...');
    
    while (!deploymentComplete && attempts < 20) {
        attempts++;
        
        try {
            // Check if enhanced extraction is available
            const response = await fetch(`${baseUrl}/api/system-capabilities`);
            
            if (response.ok) {
                const data = await response.json();
                const systemInfo = JSON.stringify(data, null, 2);
                
                // Check for our improved system indicators
                if (systemInfo.includes('enhanced-precision-v3-fixed') || 
                    systemInfo.includes('improved')) {
                    deploymentComplete = true;
                    console.log('✅ Enhanced system detected!');
                } else {
                    console.log(`⏳ Attempt ${attempts}/20 - Still waiting for deployment...`);
                }
            } else {
                console.log(`⚠️ Attempt ${attempts}/20 - Server responded with ${response.status}`);
            }
            
        } catch (error) {
            console.log(`❌ Attempt ${attempts}/20 - Error: ${error.message}`);
        }
        
        if (!deploymentComplete) {
            await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
        }
    }
    
    if (deploymentComplete) {
        console.log('\n🚀 DEPLOYMENT COMPLETE - TESTING IMPROVEMENTS');
        console.log('=============================================\n');
        
        // Run the accuracy test
        const { exec } = require('child_process');
        exec('node test-improved-accuracy.js', (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Test execution failed:', error);
                return;
            }
            
            console.log(stdout);
            if (stderr) {
                console.error('Warnings:', stderr);
            }
        });
        
    } else {
        console.log('\n❌ DEPLOYMENT TIMEOUT');
        console.log('====================');
        console.log('Deployment did not complete within 5 minutes.');
        console.log('Please check Render dashboard manually.');
        console.log('Once deployed, run: node test-improved-accuracy.js');
    }
}

waitForDeploymentAndTest();