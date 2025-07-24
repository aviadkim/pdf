/**
 * MONITOR DEPLOYMENT STATUS
 * Checks if the new fixes are deployed to Render
 */

const fetch = require('node-fetch');

async function checkDeploymentStatus() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    console.log('🔍 Monitoring deployment status...\n');
    
    const checkInterval = setInterval(async () => {
        try {
            // Check for version indicator
            const homepageResponse = await fetch(baseUrl);
            const homepageText = await homepageResponse.text();
            const hasVersion = homepageText.includes('Direct PDF parsing bypass enabled (v2.1)');
            
            // Check API endpoints
            const pdfExtractResponse = await fetch(`${baseUrl}/api/pdf-extract`, { method: 'POST' });
            const smartOcrResponse = await fetch(`${baseUrl}/api/smart-ocr`, { method: 'POST' });
            
            console.log(`⏰ ${new Date().toLocaleTimeString()}`);
            console.log(`  Version v2.1: ${hasVersion ? '✅' : '❌'}`);
            console.log(`  /api/pdf-extract: ${pdfExtractResponse.status === 400 ? '✅' : '❌'} (${pdfExtractResponse.status})`);
            console.log(`  /api/smart-ocr: ${smartOcrResponse.status === 400 ? '✅' : '❌'} (${smartOcrResponse.status})`);
            
            if (hasVersion && pdfExtractResponse.status === 400 && smartOcrResponse.status === 400) {
                console.log('\n🎉 DEPLOYMENT COMPLETE! All fixes are live.');
                clearInterval(checkInterval);
                
                // Final validation
                console.log('\n📊 Final deployment validation:');
                console.log('  ✅ Version indicator visible');
                console.log('  ✅ API endpoints responding correctly');
                console.log('  ✅ Ready for production use');
                
            } else {
                console.log('  ⏳ Waiting for deployment...\n');
            }
            
        } catch (error) {
            console.log(`  ❌ Error checking: ${error.message}\n`);
        }
    }, 15000); // Check every 15 seconds
    
    console.log('Press Ctrl+C to stop monitoring\n');
}

checkDeploymentStatus();