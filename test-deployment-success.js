/**
 * TEST DEPLOYMENT SUCCESS - Check if fixes are live
 */

const fetch = require('node-fetch');

async function testDeploymentSuccess() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    console.log('🔍 TESTING IF DEPLOYMENT FIXES ARE LIVE');
    console.log('=====================================\n');
    
    try {
        // Test 1: Check homepage for version indicator
        console.log('📄 1. Checking homepage for version indicator...');
        const homepageResponse = await fetch(baseUrl);
        const homepageText = await homepageResponse.text();
        
        if (homepageText.includes('Direct PDF parsing bypass enabled (v2.1)')) {
            console.log('✅ SUCCESS: Version v2.1 indicator found!');
            console.log('🎯 New deployment is live\n');
        } else {
            console.log('❌ STILL OLD: Version indicator not found');
            console.log('🔄 Render still deploying old code\n');
        }
        
        // Test 2: Quick API test for securities extraction
        console.log('📊 2. Testing API for securities extraction...');
        // (We would need to upload a PDF to test this fully)
        
        console.log('🏁 Test complete. If version indicator shows, run full PDF test.');
        
    } catch (error) {
        console.error('❌ Error testing deployment:', error.message);
    }
}

testDeploymentSuccess();