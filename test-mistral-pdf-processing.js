#!/usr/bin/env node

/**
 * TEST MISTRAL PDF PROCESSING
 * 
 * Direct test with Messos PDF to see if Mistral OCR is working
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testMistralPDFProcessing() {
    console.log('🤖 TESTING MISTRAL PDF PROCESSING');
    console.log('==================================');

    const baseUrl = 'https://pdf-fzzi.onrender.com';
    const pdfPath = './2. Messos  - 31.03.2025.pdf';

    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF file not found');
        return;
    }

    try {
        // Test 1: Check current system status
        console.log('\n📊 System Status:');
        const statsResponse = await axios.get(`${baseUrl}/api/smart-ocr-stats`);
        const stats = statsResponse.data.stats;
        
        console.log(`🤖 Mistral Enabled: ${stats.mistralEnabled}`);
        console.log(`🎯 Accuracy: ${stats.currentAccuracy}%`);
        console.log(`📊 Patterns: ${stats.patternCount}`);

        // Test 2: Process PDF with Smart OCR
        console.log('\n📄 Processing Messos PDF:');
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(pdfPath));
        
        console.log('📤 Uploading PDF to Smart OCR...');
        const processResponse = await axios.post(`${baseUrl}/api/smart-ocr-process`, formData, {
            headers: {
                ...formData.getHeaders()
            },
            timeout: 60000
        });

        const result = processResponse.data.results;
        console.log('\n✅ Processing Results:');
        console.log(`📈 Method: ${result.method}`);
        console.log(`🎯 Success: ${result.success}`);
        console.log(`📊 Securities Found: ${result.securities_count || 'unknown'}`);
        console.log(`💰 Total Value: ${result.total_value || 'unknown'}`);
        console.log(`🎯 Accuracy: ${result.accuracy || 'unknown'}%`);

        // Test 3: Check if Mistral Vision was used
        if (result.method === 'mistral-vision-ocr') {
            console.log('\n🎉 SUCCESS: MISTRAL VISION OCR IS WORKING!');
            console.log('✅ System is using Mistral for visual PDF understanding');
            
            // Show first few securities extracted
            if (result.extracted_data && result.extracted_data.securities) {
                console.log('\n📊 Sample Securities Extracted:');
                result.extracted_data.securities.slice(0, 3).forEach((sec, i) => {
                    console.log(`${i+1}. ${sec.isin}: CHF ${sec.market_value_chf}`);
                });
            }
        } else {
            console.log('\n⚠️ Still using fallback method:', result.method);
            console.log('   Mistral OCR not yet active');
        }

        // Test 4: Compare with expected Messos results
        console.log('\n🎯 Accuracy Analysis:');
        const expectedTotal = 19464431;
        const extractedTotal = result.total_value || 0;
        const accuracy = extractedTotal > 0 ? 
            (1 - Math.abs(extractedTotal - expectedTotal) / expectedTotal) * 100 : 0;
        
        console.log(`📊 Expected: CHF ${expectedTotal.toLocaleString()}`);
        console.log(`📊 Extracted: CHF ${extractedTotal.toLocaleString()}`);
        console.log(`🎯 Accuracy: ${accuracy.toFixed(1)}%`);

    } catch (error) {
        console.error('❌ Testing failed:', error.response?.data || error.message);
    }
}

async function testDirectMistralCall() {
    console.log('\n🧪 TESTING DIRECT MISTRAL API');
    console.log('==============================');
    
    const apiKey = 'rnd_UQyw0Qdm42RRIcLq3qL8COdn5X1y'; // Your Render API key
    
    try {
        const response = await axios.post('https://api.mistral.ai/v1/chat/completions', {
            model: 'mistral-small-latest',
            messages: [{
                role: 'user',
                content: 'Hello, test connection'
            }],
            max_tokens: 50
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Direct Mistral API working!');
        console.log('Response:', response.data.choices[0].message.content);
        
    } catch (error) {
        console.error('❌ Direct API test failed:', error.response?.data || error.message);
    }
}

if (require.main === module) {
    testMistralPDFProcessing()
        .then(() => testDirectMistralCall())
        .catch(console.error);
}

module.exports = { testMistralPDFProcessing };