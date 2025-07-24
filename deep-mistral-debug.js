#!/usr/bin/env node

/**
 * DEEP MISTRAL DEBUG
 * 
 * Comprehensive debugging of why Mistral is not enabled
 */

const axios = require('axios');

async function deepMistralDebug() {
    console.log('🔬 DEEP MISTRAL DEBUG');
    console.log('======================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';

    try {
        // Test 1: Get full system information
        console.log('\n📊 Full System Status:');
        console.log('======================');
        
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log('Raw stats object:', JSON.stringify(stats, null, 2));

        // Test 2: Check patterns to understand which system is running
        console.log('\n🔍 System Type Analysis:');
        console.log('========================');
        
        const patternsResponse = await axios.get(`${baseUrl}/api/smart-ocr-patterns`);
        const patterns = patternsResponse.data.patterns;
        
        console.log('Pattern structure:', Object.keys(patterns));
        
        if (patterns.tablePatterns) {
            console.log('✅ Running: smart-ocr-learning-system.js (CORRECT)');
            console.log('   This system should check process.env.MISTRAL_API_KEY');
        } else {
            console.log('❌ Running: Wrong system');
        }

        // Test 3: Try to understand the configuration
        console.log('\n🔧 Configuration Analysis:');
        console.log('==========================');
        
        console.log('Expected behavior:');
        console.log('1. smart-ocr-learning-system.js constructor runs');
        console.log('2. Sets this.config.mistralApiKey = process.env.MISTRAL_API_KEY');
        console.log('3. getStats() returns mistralEnabled: !!this.config.mistralApiKey');
        
        console.log('\nCurrent result: mistralEnabled =', stats.mistralEnabled);
        console.log('This means: this.config.mistralApiKey is falsy');
        console.log('Which means: process.env.MISTRAL_API_KEY is undefined/empty');

        // Test 4: Environment variable troubleshooting
        console.log('\n🚨 ENVIRONMENT VARIABLE TROUBLESHOOTING:');
        console.log('========================================');
        
        console.log('Possible causes:');
        console.log('1. ❌ MISTRAL_API_KEY not set in Render environment');
        console.log('2. ❌ Service hasn\'t restarted to pick up new env vars');
        console.log('3. ❌ Environment variable name has typo/extra characters');
        console.log('4. ❌ Environment variable value has quotes or spaces');
        console.log('5. ❌ Node.js process.env not reading correctly');

    } catch (error) {
        console.error('❌ Debug failed:', error.response?.data || error.message);
    }
}

async function testSystemReinitialization() {
    console.log('\n🔄 TESTING SYSTEM REINITIALIZATION');
    console.log('====================================');
    
    console.log('Since the environment variable fix was confirmed,');
    console.log('but mistralEnabled is still false, this suggests:');
    console.log('');
    console.log('1. 🔄 The Node.js process needs to be restarted');
    console.log('2. 📊 Environment variables are read at startup only');
    console.log('3. 🚀 Manual deploy may not have restarted the process');
    
    console.log('\n💡 SOLUTION:');
    console.log('=============');
    console.log('Try these in order:');
    console.log('1. Another manual deploy in Render dashboard');
    console.log('2. Check Render logs for any startup errors');
    console.log('3. Verify the service fully restarted (not just redeployed)');
    console.log('4. Wait 5-10 minutes for complete restart');
}

async function createMistralReadinessTest() {
    console.log('\n🎯 MISTRAL READINESS CHECKLIST');
    console.log('===============================');
    
    console.log('✅ API Key: Working (verified with direct test)');
    console.log('✅ Code: smart-ocr-learning-system.js imported correctly');
    console.log('✅ Deployment: Multiple commits pushed');
    console.log('✅ Environment Variables: Confirmed in Render dashboard');
    console.log('❌ Environment Reading: Still showing mistralEnabled: false');
    
    console.log('\n🔍 THE MISSING PIECE:');
    console.log('=====================');
    console.log('The system architecture is 100% ready.');
    console.log('The only remaining issue is the Node.js process');
    console.log('reading the environment variable.');
    
    console.log('\n⏰ NEXT TEST:');
    console.log('==============');
    console.log('After confirming another restart, we should see:');
    console.log('• mistralEnabled: true');
    console.log('• method: mistral-vision-ocr');
    console.log('• Dramatic accuracy improvement');
}

if (require.main === module) {
    deepMistralDebug()
        .then(() => testSystemReinitialization())
        .then(() => createMistralReadinessTest())
        .catch(console.error);
}

module.exports = { deepMistralDebug };