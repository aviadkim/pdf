#!/usr/bin/env node

/**
 * DIAGNOSE ENVIRONMENT VARIABLES
 * 
 * Create a test endpoint to see what env vars the server has
 */

const axios = require('axios');

async function diagnoseEnvironmentVariables() {
    console.log('🔍 DIAGNOSING ENVIRONMENT VARIABLES');
    console.log('====================================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';

    try {
        // Test the patterns endpoint to see available data
        console.log('\n📊 Available System Data:');
        const patternsResponse = await axios.get(`${baseUrl}/api/smart-ocr-patterns`);
        const patterns = patternsResponse.data.patterns;
        
        console.log('Pattern keys:', Object.keys(patterns));
        
        // Try to get more system info
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log('\n📊 Full Stats Object:');
        Object.entries(stats).forEach(([key, value]) => {
            console.log(`${key}: ${value}`);
        });

        // Check if there's any way to see environment variables
        console.log('\n🔧 Environment Variable Diagnosis:');
        console.log('Key name expected: MISTRAL_API_KEY');
        console.log('Value expected: bj7fEe8rH... (32 chars)');
        console.log('Current mistralEnabled:', stats.mistralEnabled);
        
        // The issue might be in how the environment variable is read
        console.log('\n🔍 Possible Issues:');
        console.log('1. Environment variable name mismatch');
        console.log('2. Environment variable has extra spaces/quotes');
        console.log('3. Node.js process not restarting properly');
        console.log('4. Environment variable not being read at startup');

    } catch (error) {
        console.error('❌ Diagnosis failed:', error.response?.data || error.message);
    }
}

async function testDirectConnection() {
    console.log('\n🧪 TESTING DIRECT MISTRAL CONNECTION');
    console.log('====================================');
    
    // Test if the API key works directly from our side
    const apiKey = process.env.MISTRAL_API_KEY || '';
    
    try {
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-small-latest',
            messages: [{
                role: 'user',
                content: 'Test connection'
            }],
            max_tokens: 20
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Direct API test successful');
        console.log('Response:', response.data.choices[0].message.content.substring(0, 50) + '...');
        
        console.log('\n🔍 This confirms:');
        console.log('• API key format is correct');
        console.log('• Mistral API is accessible');
        console.log('• Issue is with environment variable reading on server');
        
    } catch (error) {
        console.error('❌ Direct API test failed:', error.response?.data || error.message);
    }
}

if (require.main === module) {
    diagnoseEnvironmentVariables()
        .then(() => testDirectConnection())
        .catch(console.error);
}

module.exports = { diagnoseEnvironmentVariables };