/**
 * CHECK WHAT SYSTEM RENDER IS ACTUALLY RUNNING
 * Direct test to see which bulletproof processor code is live
 */

const fetch = require('node-fetch');

async function checkRenderSystem() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    console.log('🔍 CHECKING WHICH SYSTEM RENDER IS RUNNING');
    console.log('===========================================\n');
    
    try {
        // 1. Check homepage to see which system is running
        console.log('📄 1. Checking homepage...');
        const homepageResponse = await fetch(baseUrl);
        const homepageText = await homepageResponse.text();
        
        if (homepageText.includes('Smart OCR')) {
            console.log('✅ Homepage shows Smart OCR system');
        } else if (homepageText.includes('Perfect Mistral')) {
            console.log('✅ Homepage shows Perfect Mistral system');
        } else {
            console.log('⚠️ Homepage shows unknown system');
        }
        
        // 2. Check if endpoint exists
        console.log('\n📊 2. Checking bulletproof processor endpoint...');
        const endpointTest = await fetch(baseUrl + '/api/bulletproof-processor', {
            method: 'GET'
        });
        
        console.log(`Status: ${endpointTest.status} ${endpointTest.statusText}`);
        
        // 3. Try a simple POST without file to see error message
        console.log('\n📤 3. Testing POST without file to see error handling...');
        const postTest = await fetch(baseUrl + '/api/bulletproof-processor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        
        const postResponse = await postTest.text();
        console.log(`Status: ${postTest.status} ${postTest.statusText}`);
        console.log(`Response: ${postResponse}`);
        
        // 4. Check for debug logs in response
        if (postResponse.includes('BYPASSING Smart OCR')) {
            console.log('🎯 CONFIRMED: New bypass system is live!');
        } else if (postResponse.includes('Smart OCR')) {
            console.log('⚠️ WARNING: Old Smart OCR system still running');
        } else {
            console.log('❓ Unknown system response');
        }
        
    } catch (error) {
        console.error('❌ Error testing system:', error.message);
    }
}

checkRenderSystem();