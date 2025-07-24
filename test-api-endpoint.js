#!/usr/bin/env node

/**
 * TEST API ENDPOINT
 * 
 * Simple test to verify the /api/smart-ocr-process endpoint is working
 */

const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testAPIEndpoint() {
    console.log('🧪 Testing /api/smart-ocr-process endpoint...');
    console.log('');

    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Test 1: Check if endpoint exists
        console.log('📡 Step 1: Testing endpoint availability...');
        
        const testResponse = await fetch(`${baseUrl}/api/smart-ocr-test`);
        const testData = await testResponse.json();
        
        console.log('✅ System health check:', testData.status);
        console.log('🔧 Mistral enabled:', testData.mistralEnabled);
        console.log('');

        // Test 2: Check if we have a test PDF
        console.log('📄 Step 2: Looking for test PDF...');
        
        const testFiles = ['2. Messos - 31.03.2025.pdf', 'test.pdf', 'sample.pdf'];
        let testFile = null;
        
        for (const fileName of testFiles) {
            if (fs.existsSync(fileName)) {
                testFile = fileName;
                break;
            }
        }
        
        if (!testFile) {
            console.log('⚠️ No test PDF found. Creating a minimal test...');
            
            // Test with empty form data to see the error response
            const formData = new FormData();
            
            const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            console.log('📊 Empty request response:', result);
            
            return;
        }
        
        console.log(`✅ Found test file: ${testFile}`);
        console.log('');

        // Test 3: Upload the PDF
        console.log('📤 Step 3: Uploading PDF to API...');
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(testFile));
        
        console.log('⏳ Sending request...');
        
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData
        });
        
        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP Error:', errorText);
            return;
        }
        
        const result = await response.json();
        
        console.log('📊 API Response structure:');
        console.log(`- success: ${result.success}`);
        console.log(`- has results: ${!!result.results}`);
        
        if (result.results) {
            console.log(`- results type: ${typeof result.results}`);
            console.log(`- results keys: ${Object.keys(result.results)}`);
            
            if (result.results.pages) {
                console.log(`- pages count: ${result.results.pages.length}`);
                console.log(`- pages type: ${typeof result.results.pages}`);
                console.log(`- is pages array: ${Array.isArray(result.results.pages)}`);
            }
            
            if (result.results.ocrResults) {
                console.log(`- ocrResults type: ${typeof result.results.ocrResults}`);
                console.log(`- is ocrResults array: ${Array.isArray(result.results.ocrResults)}`);
                if (Array.isArray(result.results.ocrResults)) {
                    console.log(`- ocrResults count: ${result.results.ocrResults.length}`);
                }
            }
        }
        
        if (result.success) {
            console.log('✅ API test successful!');
            
            // Save the response for analysis
            fs.writeFileSync('test-results/api-response.json', JSON.stringify(result, null, 2));
            console.log('💾 Response saved to test-results/api-response.json');
            
        } else {
            console.log('❌ API returned error:', result.error);
        }
        
    } catch (error) {
        console.error('💥 Test failed:', error.message);
        console.error('📍 Stack:', error.stack);
    }
}

// Ensure test-results directory exists
function ensureTestResultsDir() {
    if (!fs.existsSync('test-results')) {
        fs.mkdirSync('test-results', { recursive: true });
    }
}

// Main execution
async function main() {
    console.log('🎯 API ENDPOINT TEST');
    console.log('===================');
    console.log('Testing the /api/smart-ocr-process endpoint to understand the data format.');
    console.log('');

    ensureTestResultsDir();
    await testAPIEndpoint();
    
    console.log('');
    console.log('🏁 Test complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Check the API response structure above');
    console.log('2. The frontend expects result.pages or result.results.pages');
    console.log('3. If the structure is different, we need to update the frontend');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testAPIEndpoint };
