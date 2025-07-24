#!/usr/bin/env node

/**
 * Test patterns loading directly
 */

const axios = require('axios');

async function testPatternsDirectly() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';

    console.log('🧩 Testing patterns loading directly');
    console.log('====================================');

    try {
        // Test patterns endpoint
        const patternsResponse = await axios.get(`${baseUrl}/api/smart-ocr-patterns`);
        console.log('Patterns response:', JSON.stringify(patternsResponse.data, null, 2));

        // Test stats endpoint
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        console.log('Stats response:', JSON.stringify(statsResponse.data, null, 2));

        // Test a simple learning request
        const learningData = {
            corrections: [
                {
                    id: 'test-correction',
                    original: 'wrong_value',
                    corrected: 'correct_value',
                    field: 'isin',
                    confidence: 0.95
                }
            ]
        };

        console.log('\n🧠 Testing learning...');
        const learningResponse = await axios.post(`${baseUrl}/api/smart-ocr-learn`, learningData);
        console.log('Learning response:', JSON.stringify(learningResponse.data, null, 2));

    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

if (require.main === module) {
    testPatternsDirectly().catch(console.error);
}