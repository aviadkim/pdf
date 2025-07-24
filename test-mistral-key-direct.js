#!/usr/bin/env node

/**
 * TEST MISTRAL API KEY DIRECTLY
 * 
 * Test the Mistral API key outside of the system
 */

const axios = require('axios');

async function testMistralKeyDirect() {
    console.log('🔑 TESTING MISTRAL API KEY DIRECTLY');
    console.log('====================================');

    const apiKey = process.env.MISTRAL_API_KEY || '';
    
    try {
        console.log('🧪 Testing with text-only model first...');
        
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-small-latest',
            messages: [{
                role: 'user',
                content: 'Hello, this is a test connection to verify API key.'
            }],
            max_tokens: 50
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('✅ SUCCESS: Mistral API key is working!');
        console.log('Response:', response.data.choices[0].message.content);
        
        // Test vision model availability
        console.log('\n🖼️ Testing vision model availability...');
        
        try {
            const visionResponse = await axios.post('https://api.mistral.ai/v1/chat/completions', {
                model: 'pixtral-12b-2409',
                messages: [{
                    role: 'user',
                    content: [{
                        type: 'text',
                        text: 'Test vision model availability'
                    }]
                }],
                max_tokens: 20
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            
            console.log('✅ Vision model (pixtral-12b-2409) is available!');
            console.log('🎯 Ready for PDF visual processing');
            
        } catch (visionError) {
            console.log('⚠️ Vision model test:', visionError.response?.data || visionError.message);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ API key test failed:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('🔍 API key appears to be invalid or expired');
        } else if (error.response?.status === 429) {
            console.log('🔍 Rate limit hit - API key is valid but quota exceeded');
        }
        
        return false;
    }
}

async function checkRenderEnvironment() {
    console.log('\n🔧 CHECKING RENDER ENVIRONMENT');
    console.log('===============================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Force restart by hitting the health endpoint
        console.log('📋 Checking if Render environment has updated...');
        
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log(`🤖 Mistral Enabled: ${stats.mistralEnabled}`);
        
        if (stats.mistralEnabled) {
            console.log('✅ Render environment has the API key!');
        } else {
            console.log('⚠️ Render environment may need restart to pick up new API key');
            console.log('   This can take 2-5 minutes after updating environment variables');
        }
        
    } catch (error) {
        console.error('❌ Environment check failed:', error.message);
    }
}

if (require.main === module) {
    testMistralKeyDirect()
        .then((success) => {
            if (success) {
                return checkRenderEnvironment();
            }
        })
        .catch(console.error);
}

module.exports = { testMistralKeyDirect };