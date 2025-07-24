#!/usr/bin/env node

/**
 * LEARNING API FORMAT FIX
 * Tests the correct format for the learning API
 */

const axios = require('axios');

async function testLearningAPIFormats() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    console.log('🧪 Testing Learning API Formats');
    console.log('===============================');

    // Test 1: Correct format with corrections array
    try {
        console.log('\\n📝 Test 1: Corrections format');
        const correctionsData = {
            corrections: [
                {
                    id: 'test-correction-' + Date.now(),
                    original: 'wrong_value',
                    corrected: 'correct_value',
                    field: 'market_value',
                    confidence: 0.95
                }
            ]
        };

        const response1 = await axios.post(`${baseUrl}/api/smart-ocr-learn`, correctionsData);
        console.log('✅ Corrections format: SUCCESS');
        console.log(`📈 Patterns learned: ${response1.data.patterns_learned || 0}`);
        
    } catch (error) {
        console.log('❌ Corrections format failed:', error.response?.data?.error || error.message);
    }

    // Test 2: Patterns format
    try {
        console.log('\\n🧩 Test 2: Patterns format');
        const patternsData = {
            patterns: [
                {
                    id: 'test-pattern-' + Date.now(),
                    type: 'isin',
                    pattern: '[A-Z]{2}[0-9]{10}',
                    description: 'ISIN pattern',
                    confidence: 0.9
                }
            ]
        };

        const response2 = await axios.post(`${baseUrl}/api/smart-ocr-learn`, patternsData);
        console.log('✅ Patterns format: SUCCESS');
        console.log(`📈 Patterns learned: ${response2.data.patterns_learned || 0}`);
        
    } catch (error) {
        console.log('❌ Patterns format failed:', error.response?.data?.error || error.message);
    }

    // Test 3: Combined format
    try {
        console.log('\\n🔄 Test 3: Combined format');
        const combinedData = {
            corrections: [
                {
                    id: 'correction-' + Date.now(),
                    original: 'CH1234567890',
                    corrected: 'CH1234567890',
                    field: 'isin',
                    confidence: 0.98
                }
            ],
            patterns: [
                {
                    id: 'pattern-' + Date.now(),
                    type: 'swiss_isin',
                    pattern: 'CH[0-9]{10}',
                    description: 'Swiss ISIN pattern',
                    confidence: 0.95
                }
            ],
            documentId: 'messos-demo-' + Date.now()
        };

        const response3 = await axios.post(`${baseUrl}/api/smart-ocr-learn`, combinedData);
        console.log('✅ Combined format: SUCCESS');
        console.log(`📈 Total patterns learned: ${response3.data.patterns_learned || 0}`);
        
    } catch (error) {
        console.log('❌ Combined format failed:', error.response?.data?.error || error.message);
    }

    // Test 4: Get updated stats
    try {
        console.log('\\n📊 Final Stats Check');
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log(`🎯 Current Accuracy: ${stats.currentAccuracy}%`);
        console.log(`🧩 Pattern Count: ${stats.patternCount}`);
        console.log(`📝 Annotation Count: ${stats.annotationCount}`);
        console.log(`📈 Accuracy Gain: ${stats.accuracyGain}%`);
        
    } catch (error) {
        console.log('❌ Stats check failed:', error.message);
    }
}

// Run if called directly
if (require.main === module) {
    testLearningAPIFormats().catch(console.error);
}

module.exports = { testLearningAPIFormats };