#!/usr/bin/env node

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const DEPLOYMENT_URL = 'https://pdf-fzzi.onrender.com';

console.log('🔍 Debugging Mistral Endpoint Issue');
console.log('===================================');
console.log(`🌐 Service: ${DEPLOYMENT_URL}`);
console.log(`📅 Time: ${new Date().toISOString()}\n`);

// Create a simple test PDF
function createTestPDF() {
    const pdfContent = Buffer.from(`
JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IERvY3VtZW50IGZvciBNaXN0cmFsIE9DUikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCjAwMDAwMDAyNzIgMDAwMDAgbiAKMDAwMDAwMDM1OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MwolJUVPRg==
    `, 'base64');
    return pdfContent;
}

async function debugMistralEndpoint() {
    console.log('🧪 STEP 1: Testing GET request to Mistral endpoint');
    console.log('================================================');
    
    try {
        const getResponse = await fetch(`${DEPLOYMENT_URL}/api/mistral-ocr-extract`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        console.log(`📊 GET Response: ${getResponse.status} ${getResponse.statusText}`);
        
        if (getResponse.status === 405) {
            console.log('✅ This is expected - endpoint requires POST with file upload');
        } else if (getResponse.status === 404) {
            console.log('❌ Endpoint not found - this indicates a routing issue');
        } else {
            const responseText = await getResponse.text();
            console.log(`📄 Response body: ${responseText.substring(0, 200)}...`);
        }
        
    } catch (error) {
        console.log(`💥 GET request failed: ${error.message}`);
    }
    
    console.log('\n🧪 STEP 2: Testing POST request with PDF file');
    console.log('==============================================');
    
    try {
        // Create test PDF file
        const testPdf = createTestPDF();
        const tempFilePath = path.join(__dirname, 'test-temp', 'mistral-test.pdf');
        
        // Ensure temp directory exists
        const tempDir = path.dirname(tempFilePath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFilePath, testPdf);
        console.log(`📁 Created test PDF: ${tempFilePath} (${testPdf.length} bytes)`);
        
        // Create form data
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(tempFilePath));
        
        console.log('📤 Sending POST request with PDF file...');
        
        const postResponse = await fetch(`${DEPLOYMENT_URL}/api/mistral-ocr-extract`, {
            method: 'POST',
            body: formData,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...formData.getHeaders()
            },
            timeout: 30000
        });
        
        console.log(`📊 POST Response: ${postResponse.status} ${postResponse.statusText}`);
        
        const responseText = await postResponse.text();
        console.log(`📄 Response length: ${responseText.length} characters`);
        
        if (postResponse.ok) {
            console.log('✅ SUCCESS: Mistral endpoint is working!');
            try {
                const jsonResponse = JSON.parse(responseText);
                console.log(`📋 Response preview:`);
                console.log(`   Success: ${jsonResponse.success}`);
                console.log(`   Method: ${jsonResponse.metadata?.method || 'unknown'}`);
                console.log(`   Extracted text length: ${jsonResponse.extractedText?.length || 0}`);
            } catch (e) {
                console.log(`📄 Raw response preview: ${responseText.substring(0, 300)}...`);
            }
        } else {
            console.log('❌ FAILED: Mistral endpoint returned error');
            if (responseText) {
                try {
                    const errorResponse = JSON.parse(responseText);
                    console.log(`💥 Error: ${errorResponse.error}`);
                } catch (e) {
                    console.log(`💥 Raw error: ${responseText.substring(0, 300)}...`);
                }
            }
        }
        
        // Clean up
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log('🧹 Cleaned up test file');
        }
        
    } catch (error) {
        console.log(`💥 POST request failed: ${error.message}`);
    }
    
    console.log('\n🧪 STEP 3: Testing other working endpoints for comparison');
    console.log('========================================================');
    
    const workingEndpoints = [
        '/api/smart-ocr-test',
        '/api/smart-ocr-stats', 
        '/api/smart-ocr-patterns'
    ];
    
    for (const endpoint of workingEndpoints) {
        try {
            const response = await fetch(`${DEPLOYMENT_URL}${endpoint}`, {
                timeout: 10000
            });
            console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
    
    console.log('\n🧪 STEP 4: Testing bulletproof processor (should work)');
    console.log('=====================================================');
    
    try {
        const testPdf = createTestPDF();
        const tempFilePath = path.join(__dirname, 'test-temp', 'bulletproof-test.pdf');
        
        fs.writeFileSync(tempFilePath, testPdf);
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(tempFilePath));
        
        const response = await fetch(`${DEPLOYMENT_URL}/api/bulletproof-processor`, {
            method: 'POST',
            body: formData,
            headers: {
                ...formData.getHeaders()
            },
            timeout: 30000
        });
        
        console.log(`📊 Bulletproof Processor: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const text = await response.text();
            console.log(`✅ Bulletproof processor working! Response length: ${text.length}`);
        } else {
            const errorText = await response.text();
            console.log(`❌ Bulletproof processor error: ${errorText.substring(0, 200)}...`);
        }
        
        // Clean up
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        
    } catch (error) {
        console.log(`💥 Bulletproof processor test failed: ${error.message}`);
    }
    
    console.log('\n🔍 DIAGNOSIS SUMMARY');
    console.log('===================');
    console.log('📋 Based on the tests above:');
    console.log('   1. If Mistral endpoint returns 404 on GET: Routing issue');
    console.log('   2. If Mistral endpoint returns 405 on GET but 404 on POST: Partial routing');
    console.log('   3. If Mistral endpoint works on POST: Environment variables are fine');
    console.log('   4. If other endpoints work but Mistral doesn\'t: Mistral-specific issue');
    console.log('   5. If bulletproof processor works: File upload mechanism is working');
}

// Run the debug
debugMistralEndpoint().catch(error => {
    console.error('\n💥 Debug script failed:', error);
    process.exit(1);
});