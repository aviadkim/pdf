#!/usr/bin/env node

/**
 * FORCE MISTRAL ACTIVATION
 * 
 * Try to force the system to re-read environment variables
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function forceMistralActivation() {
    console.log('🚀 FORCING MISTRAL ACTIVATION');
    console.log('==============================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';

    // Test 1: Check current status
    console.log('\n📊 Current Status:');
    try {
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        console.log(`🤖 Mistral Enabled: ${statsResponse.data.stats.mistralEnabled}`);
    } catch (error) {
        console.log('❌ Stats check failed:', error.message);
    }

    // Test 2: Try multiple endpoint variations to wake up the service
    console.log('\n🔄 Service Wake-up Calls:');
    
    const endpoints = [
        '/api/smart-ocr-patterns',
        '/api/smart-ocr-stats', 
        '/api/smart-ocr-process'
    ];

    for (const endpoint of endpoints) {
        try {
            if (endpoint === '/api/smart-ocr-process') {
                // Skip process endpoint for now
                continue;
            }
            
            const response = await axios.get(`${baseUrl}${endpoint}`);
            console.log(`✅ ${endpoint}: Working`);
            
            // Check if mistralEnabled changed
            if (endpoint === '/api/smart-ocr-stats') {
                const enabled = response.data.stats.mistralEnabled;
                console.log(`   🤖 Mistral: ${enabled}`);
                
                if (enabled) {
                    console.log('🎉 MISTRAL IS NOW ENABLED!');
                    return true;
                }
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
        
        // Small delay between calls
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 3: Try processing a PDF to force system initialization
    console.log('\n📄 Force PDF Processing:');
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    if (fs.existsSync(pdfPath)) {
        try {
            const formData = new FormData();
            formData.append('pdf', fs.createReadStream(pdfPath));
            
            console.log('📤 Processing PDF to force system wake-up...');
            const processResponse = await axios.post(`${baseUrl}/api/smart-ocr-process`, formData, {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 60000
            });

            const result = processResponse.data.results;
            console.log(`📈 Method: ${result.method}`);
            
            if (result.method === 'mistral-vision-ocr') {
                console.log('🎉 SUCCESS: MISTRAL VISION OCR IS WORKING!');
                return true;
            } else {
                console.log('⚠️ Still using fallback method');
            }
            
        } catch (processError) {
            console.log('❌ PDF processing failed:', processError.response?.data || processError.message);
        }
    }

    // Test 4: Final status check
    console.log('\n📊 Final Status Check:');
    try {
        const finalStatsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const finalEnabled = finalStatsResponse.data.stats.mistralEnabled;
        
        console.log(`🤖 Mistral Enabled: ${finalEnabled}`);
        
        if (finalEnabled) {
            console.log('✅ SUCCESS: Mistral is now active!');
            return true;
        } else {
            console.log('❌ Mistral still not enabled');
            return false;
        }
        
    } catch (error) {
        console.log('❌ Final check failed:', error.message);
        return false;
    }
}

async function suggestNextSteps(success) {
    if (success) {
        console.log('\n🎯 MISTRAL OCR IS WORKING!');
        console.log('==========================');
        console.log('✅ Ready for high-accuracy PDF extraction');
        console.log('✅ Visual table understanding enabled');
        console.log('✅ AI agent validation ready');
        console.log('✅ Human annotation workflow ready');
        
    } else {
        console.log('\n🛠️ MISTRAL STILL NOT ACTIVE');
        console.log('============================');
        console.log('Possible solutions:');
        console.log('1. 🔄 Manually restart Render service');
        console.log('2. 🔍 Check Render deployment logs');
        console.log('3. ⏰ Wait longer (up to 10 minutes)');
        console.log('4. 🔧 Check environment variable formatting');
        
        console.log('\n🔍 Environment Variable Check:');
        console.log('- Key name: MISTRAL_API_KEY');
        console.log('- Value format: Should start with letters/numbers');
        console.log('- No quotes or extra spaces');
        console.log('- Render dashboard shows it correctly');
    }
}

if (require.main === module) {
    forceMistralActivation()
        .then(suggestNextSteps)
        .catch(console.error);
}

module.exports = { forceMistralActivation };