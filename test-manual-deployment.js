// Test if manual deployment worked
const fetch = require('node-fetch');

async function testDeployment() {
    const baseUrl = 'https://pdf-production-5dis.onrender.com';
    
    console.log('🔍 CHECKING DEPLOYMENT STATUS');
    console.log('===============================');
    
    try {
        // Check version
        const diagRes = await fetch(`${baseUrl}/api/diagnostic`);
        const diagData = await diagRes.json();
        
        console.log('Current Version:', diagData.version);
        console.log('Expected Version: v4.5-isin-fix-stable');
        console.log('Deployment Status:', diagData.version === 'v4.5-isin-fix-stable' ? '✅ UPDATED' : '❌ OLD VERSION');
        console.log('');
        
        if (diagData.version === 'v4.5-isin-fix-stable') {
            console.log('🎉 DEPLOYMENT SUCCESSFUL!');
            console.log('✅ ISIN parsing bug should be fixed');
            console.log('✅ Ready to test 99% accuracy');
        } else {
            console.log('⚠️  DEPLOYMENT PENDING');
            console.log('🔧 Manual steps needed:');
            console.log('   1. Go to Render Dashboard');
            console.log('   2. Find pdf-production service');
            console.log('   3. Click "Deploy Latest Commit"');
            console.log('   4. Or try "Clear Build Cache & Deploy"');
        }
        
    } catch (error) {
        console.log('❌ Error checking deployment:', error.message);
    }
}

// Check every 30 seconds for deployment
setInterval(testDeployment, 30000);
testDeployment();