#!/usr/bin/env node

/**
 * DEBUG ENVIRONMENT VARIABLES
 * 
 * Check how the Smart OCR system reads environment variables
 */

const axios = require('axios');

async function debugEnvironmentVariables() {
    console.log('🔍 DEBUGGING ENVIRONMENT VARIABLES');
    console.log('===================================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';

    try {
        // Test 1: Check if we can get environment info from server
        console.log('\n🔧 Server Environment Check:');
        console.log('============================');
        
        const response = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = response.data.stats;
        
        console.log('📊 Current Stats:');
        Object.entries(stats).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });

        // Test 2: Create a diagnostic endpoint test
        console.log('\n🧪 Environment Diagnostic Test:');
        console.log('===============================');
        
        const diagResponse = await axios.post(`${baseUrl}/api/smart-ocr-learn`, {
            action: 'environment_debug',
            check: 'mistral_api_key_status'
        });
        
        console.log('🔍 Diagnostic Response:', diagResponse.data);

    } catch (error) {
        console.error('❌ Environment debug failed:', error.response?.data || error.message);
    }

    // Test 3: Manual restart trigger
    console.log('\n🔄 Attempting Manual Environment Refresh:');
    console.log('==========================================');
    
    try {
        const refreshResponse = await axios.post(`${baseUrl}/api/smart-ocr-learn`, {
            action: 'refresh_config'
        });
        
        console.log('✅ Config refresh response:', refreshResponse.data);
        
        // Check stats again after refresh
        const newStatsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const newStats = newStatsResponse.data.stats;
        
        console.log('\n📊 Stats After Refresh:');
        console.log(`🤖 Mistral Enabled: ${newStats.mistralEnabled}`);
        
        if (newStats.mistralEnabled) {
            console.log('🎉 SUCCESS! Mistral is now enabled!');
        } else {
            console.log('⚠️ Still not enabled - deeper investigation needed');
        }
        
    } catch (refreshError) {
        console.error('❌ Manual refresh failed:', refreshError.response?.data || refreshError.message);
    }
}

async function checkMistralDirectly() {
    console.log('\n🔑 DIRECT MISTRAL API TEST FROM SERVER');
    console.log('======================================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Try to make the server do a direct Mistral test
        const testData = {
            action: 'test_mistral_direct',
            prompt: 'Test Mistral API connection from server'
        };
        
        const testResponse = await axios.post(`${baseUrl}/api/smart-ocr-learn`, testData);
        console.log('✅ Server Mistral test:', testResponse.data);
        
    } catch (error) {
        console.error('❌ Server Mistral test failed:', error.response?.data || error.message);
    }
}

if (require.main === module) {
    debugEnvironmentVariables()
        .then(() => checkMistralDirectly())
        .catch(console.error);
}

module.exports = { debugEnvironmentVariables };