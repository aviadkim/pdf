#!/usr/bin/env node

/**
 * DEBUG MISTRAL ENVIRONMENT VARIABLES
 * 
 * Check why Mistral shows as disabled
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function debugMistralEnvironment() {
    console.log('🔍 DEBUGGING MISTRAL ENVIRONMENT');
    console.log('=================================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';

    // Test 1: Check current system configuration
    console.log('\n📊 Current System Status:');
    console.log('=========================');
    
    try {
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log(`🤖 Mistral Enabled: ${stats.mistralEnabled}`);
        console.log(`🔧 Learning Rate: ${stats.learningRate}`);
        console.log(`🎯 Target Accuracy: ${stats.targetAccuracy}`);
        
        // The key issue: why is mistralEnabled false?
        console.log('\n🔍 Why mistralEnabled = false?');
        console.log('In smart-ocr-learning-system.js line 174:');
        console.log('mistralEnabled: !!this.config.mistralApiKey');
        console.log('This means process.env.MISTRAL_API_KEY is falsy');

    } catch (error) {
        console.error('❌ Stats check failed:', error.message);
    }

    // Test 2: Try to force processing and see what happens
    console.log('\n📄 Test PDF Processing to See Actual Method:');
    console.log('=============================================');
    
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (fs.existsSync(pdfPath)) {
        try {
            const formData = new FormData();
            formData.append('pdf', fs.createReadStream(pdfPath));
            
            console.log('📤 Processing PDF to see which method is used...');
            const response = await axios.post(`${baseUrl}/api/smart-ocr-process`, formData, {
                headers: { ...formData.getHeaders() },
                timeout: 45000
            });
            
            const result = response.data.results;
            console.log(`📈 Method used: ${result.method}`);
            console.log(`🎯 Success: ${result.success}`);
            
            if (result.method === 'smart-ocr-no-gm') {
                console.log('❌ Using fallback method - Mistral NOT working');
                console.log('🔍 This confirms MISTRAL_API_KEY is not available');
            } else if (result.method === 'mistral-vision-ocr') {
                console.log('✅ Using Mistral OCR - API key is working!');
            } else {
                console.log(`⚠️ Unknown method: ${result.method}`);
            }
            
        } catch (error) {
            console.error('❌ PDF processing failed:', error.response?.data || error.message);
        }
    } else {
        console.log('⚠️ PDF file not found for testing');
    }

    // Test 3: Check which Smart OCR system is actually running
    console.log('\n🔍 Determine Which System is Running:');
    console.log('=====================================');
    
    try {
        const patternsResponse = await axios.get(`${baseUrl}/api/smart-ocr-patterns`);
        const patterns = patternsResponse.data.patterns;
        
        console.log('📊 Pattern keys found:', Object.keys(patterns));
        
        if (patterns.isin_patterns !== undefined) {
            console.log('🔧 Running: smart-ocr-no-graphics-magic.js');
            console.log('   - This system has mistralEnabled: false hardcoded');
        } else if (patterns.tablePatterns !== undefined) {
            console.log('🔧 Running: smart-ocr-learning-system.js');
            console.log('   - This system should check MISTRAL_API_KEY');
        }
        
    } catch (error) {
        console.error('❌ Patterns check failed:', error.message);
    }

    // Diagnosis
    console.log('\n🔬 DIAGNOSIS:');
    console.log('=============');
    console.log('1. mistralEnabled: false means process.env.MISTRAL_API_KEY is undefined');
    console.log('2. Either MISTRAL_API_KEY is not set in Render environment');
    console.log('3. Or the wrong Smart OCR system is running');
    console.log('4. smart-ocr-no-graphics-magic.js has mistralEnabled: false hardcoded');
    console.log('5. smart-ocr-learning-system.js checks for API key properly');

    console.log('\n💡 SOLUTION:');
    console.log('=============');
    console.log('1. Verify MISTRAL_API_KEY is set in Render dashboard');
    console.log('2. Ensure smart-ocr-server.js imports the right system');
    console.log('3. Test with a simple Mistral API call');
}

async function testDirectMistralCall() {
    console.log('\n🧪 DIRECT MISTRAL API TEST');
    console.log('===========================');
    
    // This would test the Mistral API directly if we had the key
    console.log('To test Mistral API directly, we need:');
    console.log('1. The actual MISTRAL_API_KEY from Render');
    console.log('2. A direct call to https://api.mistral.ai/v1/chat/completions');
    console.log('3. Proper model (pixtral-12b-2409 for vision)');
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Check Render dashboard for MISTRAL_API_KEY');
    console.log('2. Verify which Smart OCR system is actually deployed');
    console.log('3. Update the system to use Mistral if key is available');
}

if (require.main === module) {
    debugMistralEnvironment()
        .then(() => testDirectMistralCall())
        .catch(console.error);
}

module.exports = { debugMistralEnvironment };