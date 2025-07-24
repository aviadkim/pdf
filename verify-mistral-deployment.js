#!/usr/bin/env node

/**
 * VERIFY MISTRAL DEPLOYMENT
 * 
 * Comprehensive check if Mistral integration is working
 */

const axios = require('axios');

async function verifyMistralDeployment() {
    console.log('🔍 VERIFYING MISTRAL DEPLOYMENT');
    console.log('================================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';

    try {
        // Test 1: Check system status
        console.log('\n📊 System Status Check:');
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log(`🤖 Mistral Enabled: ${stats.mistralEnabled}`);
        console.log(`📊 Method: ${stats.method || 'unknown'}`);
        console.log(`🎯 Target Accuracy: ${stats.targetAccuracy}%`);
        
        // Test 2: Check server logs/diagnostics
        console.log('\n🔧 Server Diagnostics:');
        try {
            const diagResponse = await axios.get(`${baseUrl}/api/smart-ocr-patterns`);
            const patterns = diagResponse.data.patterns;
            
            if (patterns.tablePatterns) {
                console.log('✅ Using smart-ocr-learning-system.js (correct)');
            } else if (patterns.isin_patterns) {
                console.log('❌ Still using smart-ocr-no-graphics-magic.js (wrong)');
                console.log('   Deployment may not have completed or cache issue');
            }
        } catch (error) {
            console.log('⚠️ Patterns check failed:', error.message);
        }

        // Test 3: Force a simple processing test
        console.log('\n📄 Processing Test:');
        try {
            const testData = {
                test_type: 'system_check'
            };
            
            const processResponse = await axios.post(`${baseUrl}/api/smart-ocr-test`, testData);
            console.log('✅ Test response:', processResponse.data);
        } catch (error) {
            console.log('❌ Processing test failed:', error.response?.data || error.message);
        }

        // Conclusion
        console.log('\n🎯 CONCLUSION:');
        console.log('==============');
        
        if (stats.mistralEnabled) {
            console.log('✅ Mistral integration is working!');
            return true;
        } else {
            console.log('❌ Mistral integration still not working');
            console.log('   Possible causes:');
            console.log('   1. MISTRAL_API_KEY not set in Render environment variables');
            console.log('   2. Deployment not yet complete (try again in 2-3 minutes)');
            console.log('   3. Server cache preventing new code from loading');
            console.log('   4. Service still using old system files');
            return false;
        }

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        return false;
    }
}

async function suggestNextSteps() {
    console.log('\n📋 NEXT STEPS TO ENABLE MISTRAL:');
    console.log('=================================');
    console.log('1. 🔑 Verify MISTRAL_API_KEY in Render dashboard');
    console.log('2. 🔄 Wait for deployment completion (2-3 minutes)');
    console.log('3. 🧹 Clear server cache if needed');
    console.log('4. 🤖 Test with actual Mistral API call');
    console.log('5. 📱 Deploy Mistral workflow with real PDF');
}

if (require.main === module) {
    verifyMistralDeployment()
        .then((success) => {
            if (!success) {
                return suggestNextSteps();
            }
        })
        .catch(console.error);
}

module.exports = { verifyMistralDeployment };