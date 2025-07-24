#!/usr/bin/env node

/**
 * TRIGGER RENDER RESTART
 * 
 * Simple file change to trigger Render deployment restart
 */

const fs = require('fs');
const path = require('path');

async function triggerRenderRestart() {
    console.log('🔄 TRIGGERING RENDER RESTART');
    console.log('=============================');
    
    // Make a small change to a file to trigger redeployment
    const markerFile = path.join(__dirname, 'deployment-marker.txt');
    const timestamp = new Date().toISOString();
    
    fs.writeFileSync(markerFile, `Deployment restart triggered at ${timestamp}\nMistral API key updated and ready for integration.`);
    
    console.log('✅ Created deployment marker file');
    console.log('📋 This will trigger Render to restart and pick up the new MISTRAL_API_KEY');
    console.log('⏰ Expected restart time: 2-3 minutes');
    
    return markerFile;
}

if (require.main === module) {
    const markerFile = triggerRenderRestart();
    console.log(`\n📁 Created: ${markerFile}`);
    console.log('\n🚀 Next steps:');
    console.log('1. Commit this change to trigger deployment');
    console.log('2. Wait 2-3 minutes for Render restart');
    console.log('3. Test Mistral OCR integration');
}

module.exports = { triggerRenderRestart };