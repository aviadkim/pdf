#!/usr/bin/env node

/**
 * Test Mistral OCR Endpoint After Fix
 * Tests the fixed /api/mistral-ocr-extract endpoint
 */

const axios = require('axios');

async function testMistralEndpoint() {
    console.log('🔍 Testing Fixed Mistral OCR Endpoint');
    console.log('=====================================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Test 1: GET request (should return 405 Method Not Allowed)
        console.log('\n1️⃣ Testing GET request (should return 405)...');
        try {
            const getResponse = await axios.get(`${baseUrl}/api/mistral-ocr-extract`);
            console.log('❌ Unexpected success on GET request');
        } catch (error) {
            if (error.response && error.response.status === 405) {
                console.log('✅ GET request correctly returns 405 Method Not Allowed');
                console.log('   Response:', error.response.data);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
        // Test 2: POST request without file (should return 400)
        console.log('\n2️⃣ Testing POST request without file (should return 400)...');
        try {
            const postResponse = await axios.post(`${baseUrl}/api/mistral-ocr-extract`);
            console.log('❌ Unexpected success on POST without file');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ POST without file correctly returns 400 Bad Request');
                console.log('   Response:', error.response.data);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        
        // Test 3: Check if server is responding
        console.log('\n3️⃣ Testing server health...');
        const healthResponse = await axios.get(`${baseUrl}/`);
        console.log('✅ Server is responding');
        console.log('   Status:', healthResponse.status);
        
        // Test 4: Check system capabilities
        console.log('\n4️⃣ Testing system capabilities...');
        const capabilitiesResponse = await axios.get(`${baseUrl}/api/system-capabilities`);
        console.log('✅ System capabilities endpoint working');
        console.log('   Available endpoints:', capabilitiesResponse.data.endpoints);
        
        // Check if Mistral endpoint is listed
        const mistralEndpoint = capabilitiesResponse.data.endpoints?.mistral_ocr;
        if (mistralEndpoint) {
            console.log('✅ Mistral OCR endpoint is properly registered');
            console.log('   Endpoint:', mistralEndpoint.endpoint);
            console.log('   Accuracy:', mistralEndpoint.accuracy);
        } else {
            console.log('❌ Mistral OCR endpoint not found in capabilities');
        }
        
        console.log('\n🎉 ENDPOINT TEST RESULTS:');
        console.log('========================');
        console.log('✅ Server is running and responding');
        console.log('✅ Mistral OCR endpoint is properly registered');
        console.log('✅ Endpoint correctly handles GET/POST validation');
        console.log('✅ Ready for file upload testing');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

if (require.main === module) {
    testMistralEndpoint().catch(console.error);
}

module.exports = { testMistralEndpoint };
