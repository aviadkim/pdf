#!/usr/bin/env node

/**
 * TEST MISTRAL API KEY ON RENDER
 * 
 * Tests if Mistral API is properly configured and working
 */

const axios = require('axios');

async function testMistralAPIKey() {
    console.log('🔍 TESTING MISTRAL API KEY ON RENDER');
    console.log('=====================================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';

    try {
        // Test 1: Check if Mistral is enabled in stats
        console.log('\n📊 Test 1: Check Mistral Status');
        console.log('===============================');
        
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log(`🤖 Mistral Enabled: ${stats.mistralEnabled}`);
        console.log(`🎯 Current Accuracy: ${stats.currentAccuracy}%`);
        console.log(`📊 Pattern Count: ${stats.patternCount}`);
        
        if (!stats.mistralEnabled) {
            console.log('⚠️ Mistral shows as disabled - checking why...');
        }

        // Test 2: Create a custom endpoint to test Mistral directly
        console.log('\n🧪 Test 2: Test Mistral API Call');
        console.log('================================');
        
        const mistralTestData = {
            test_type: 'mistral_api_check',
            message: 'Test Mistral API connectivity'
        };

        try {
            const mistralResponse = await axios.post(`${baseUrl}/api/smart-ocr-test`, mistralTestData);
            console.log('✅ Mistral test endpoint response:', mistralResponse.data);
        } catch (error) {
            console.log('❌ Mistral test failed:', error.response?.data || error.message);
        }

        // Test 3: Check environment variables indirectly
        console.log('\n🔧 Test 3: Environment Check');
        console.log('=============================');
        
        const envTestData = {
            check: 'environment_variables'
        };

        try {
            const envResponse = await axios.post(`${baseUrl}/api/smart-ocr-learn`, envTestData);
            console.log('📋 Environment check:', envResponse.data);
        } catch (error) {
            console.log('⚠️ Environment check issue:', error.response?.data || error.message);
        }

        // Test 4: Force Mistral processing by uploading a PDF
        console.log('\n📄 Test 4: Force Mistral PDF Processing');
        console.log('========================================');
        
        if (fs.existsSync('./2. Messos  - 31.03.2025.pdf')) {
            const FormData = require('form-data');
            const fs = require('fs');
            
            const formData = new FormData();
            formData.append('pdf', fs.createReadStream('./2. Messos  - 31.03.2025.pdf'));
            formData.append('force_mistral', 'true'); // Force Mistral usage
            
            try {
                console.log('📤 Uploading PDF to force Mistral processing...');
                const processResponse = await axios.post(`${baseUrl}/api/smart-ocr-process`, formData, {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 60000 // 60 second timeout
                });
                
                console.log('✅ PDF processing response:');
                const result = processResponse.data.results;
                console.log(`📈 Method: ${result.method}`);
                console.log(`🎯 Success: ${result.success}`);
                console.log(`📊 Text Length: ${result.text_length}`);
                
                if (result.method === 'mistral-vision-ocr') {
                    console.log('🎉 MISTRAL OCR IS WORKING!');
                } else {
                    console.log(`⚠️ Using fallback method: ${result.method}`);
                }
                
            } catch (error) {
                console.log('❌ PDF processing with Mistral failed:', error.response?.data || error.message);
            }
        } else {
            console.log('⚠️ PDF file not found for Mistral test');
        }

        // Test 5: Direct Mistral API test (if we can access the key)
        console.log('\n🔑 Test 5: Direct Mistral API Test');
        console.log('==================================');
        
        try {
            // Create a simple test prompt
            const testPrompt = {
                prompt: 'Test Mistral API connectivity',
                image_data: 'test_image_placeholder'
            };
            
            const directResponse = await axios.post(`${baseUrl}/api/smart-ocr-test`, {
                test_type: 'direct_mistral',
                data: testPrompt
            });
            
            console.log('✅ Direct Mistral test:', directResponse.data);
            
        } catch (error) {
            console.log('❌ Direct Mistral test failed:', error.response?.data || error.message);
        }

    } catch (error) {
        console.error('❌ Test suite error:', error.message);
    }
}

async function diagnoseMistralIssue() {
    console.log('\n🔬 MISTRAL ISSUE DIAGNOSIS');
    console.log('===========================');
    
    console.log('Possible reasons Mistral shows as disabled:');
    console.log('1. ❌ API key not set in environment variables');
    console.log('2. ❌ API key set but invalid/expired');
    console.log('3. ❌ Code checking wrong environment variable name');
    console.log('4. ❌ Smart OCR system not reading env vars correctly');
    console.log('5. ❌ Fallback mode permanently enabled');
    
    console.log('\n🔧 Debugging steps:');
    console.log('1. Check Render dashboard environment variables');
    console.log('2. Verify MISTRAL_API_KEY is set');
    console.log('3. Test API key validity');
    console.log('4. Check smart-ocr-learning-system.js env var reading');
    console.log('5. Test direct Mistral API call');
}

if (require.main === module) {
    const fs = require('fs');
    testMistralAPIKey()
        .then(() => diagnoseMistralIssue())
        .catch(console.error);
}

module.exports = { testMistralAPIKey, diagnoseMistralIssue };