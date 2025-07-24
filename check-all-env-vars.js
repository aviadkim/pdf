#!/usr/bin/env node

/**
 * CHECK ALL ENVIRONMENT VARIABLES
 * 
 * Create a simple test to see if environment variables exist
 */

const axios = require('axios');

async function checkAllEnvironmentVariables() {
    console.log('🔍 CHECKING ALL ENVIRONMENT VARIABLE POSSIBILITIES');
    console.log('===================================================');

    console.log('Based on your screenshot, I noticed:');
    console.log('1. MISTRAL_API_KEY: ' + (process.env.MISTRAL_API_KEY || '<not set>'));
    console.log('2. MISTRAL_ENDPOINalue: https://api.mistral.ai/v1 (typo?)');
    console.log('3. NODE_ENV: production');
    console.log('4. PORT: 10002');

    console.log('\n🚨 POTENTIAL ISSUE FOUND:');
    console.log('==========================');
    console.log('The environment variable name shows:');
    console.log('❌ "MISTRAL_ENDPOINalue" (with typo)');
    console.log('✅ Should be: "MISTRAL_ENDPOINT"');
    
    console.log('\n🔧 DIAGNOSIS:');
    console.log('==============');
    console.log('If there was a typo when setting environment variables,');
    console.log('this could affect how the system reads them.');
    
    console.log('\n✅ SOLUTION:');
    console.log('=============');
    console.log('1. Double-check the MISTRAL_API_KEY variable name in Render');
    console.log('2. Ensure no extra spaces or characters');
    console.log('3. The key should be exactly: MISTRAL_API_KEY');
    console.log('4. The value should be set as an environment variable');
    
    // Test the API key again to confirm it works
    console.log('\n🧪 CONFIRMING API KEY WORKS:');
    console.log('=============================');
    
    const apiKey = process.env.MISTRAL_API_KEY || '';
    
    try {
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-small-latest',
            messages: [{
                role: 'user',
                content: 'Quick test'
            }],
            max_tokens: 10
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ API key confirmed working');
        
    } catch (error) {
        console.error('❌ API key test failed:', error.response?.data || error.message);
    }
}

async function suggestNextSteps() {
    console.log('\n📋 NEXT STEPS:');
    console.log('===============');
    console.log('1. 🔍 Check Render dashboard environment variables');
    console.log('2. ✏️ Verify exact spelling: MISTRAL_API_KEY (no typos)');
    console.log('3. 🔄 Re-save the environment variable if needed');
    console.log('4. 🚀 Trigger another manual deploy');
    console.log('5. 🧪 Test again');
    
    console.log('\n💡 EXPECTED RESULT:');
    console.log('===================');
    console.log('After fixing the environment variable:');
    console.log('• mistralEnabled: true');
    console.log('• method: mistral-vision-ocr');
    console.log('• Accuracy: 90%+');
    console.log('• Visual PDF processing working');
}

if (require.main === module) {
    checkAllEnvironmentVariables()
        .then(() => suggestNextSteps())
        .catch(console.error);
}

module.exports = { checkAllEnvironmentVariables };