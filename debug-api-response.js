#!/usr/bin/env node

/**
 * DEBUG API RESPONSE
 * 
 * Captures the exact API response to understand the data structure
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function debugAPIResponse() {
    console.log('🔍 DEBUGGING API RESPONSE STRUCTURE');
    console.log('===================================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Create a test PDF
        const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 44>>stream
BT/F1 12 Tf 100 700 Td(Test PDF)Tj ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref 297 %%EOF`;
        
        console.log('📄 Creating test PDF...');
        await fs.writeFile('debug-test.pdf', pdfContent);
        
        // Upload the PDF
        console.log('📤 Uploading PDF to API...');
        const formData = new FormData();
        const fileBuffer = Buffer.from(pdfContent);
        formData.append('pdf', fileBuffer, 'debug-test.pdf');
        
        const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
            method: 'POST',
            body: formData
        });
        
        console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
        
        const responseData = await response.json();
        
        console.log('\n📊 COMPLETE API RESPONSE:');
        console.log('========================');
        console.log(JSON.stringify(responseData, null, 2));
        
        console.log('\n🔍 RESPONSE STRUCTURE ANALYSIS:');
        console.log('==============================');
        console.log(`- success: ${responseData.success}`);
        console.log(`- has results: ${!!responseData.results}`);
        
        if (responseData.results) {
            console.log(`- results.success: ${responseData.results.success}`);
            console.log(`- results.error: ${responseData.results.error}`);
            console.log(`- results.errorType: ${responseData.results.errorType}`);
            console.log(`- results keys: ${Object.keys(responseData.results)}`);
            
            if (responseData.results.ocrResults) {
                console.log(`- results.ocrResults type: ${typeof responseData.results.ocrResults}`);
                console.log(`- results.ocrResults is array: ${Array.isArray(responseData.results.ocrResults)}`);
                if (Array.isArray(responseData.results.ocrResults)) {
                    console.log(`- results.ocrResults length: ${responseData.results.ocrResults.length}`);
                    if (responseData.results.ocrResults.length > 0) {
                        console.log(`- first ocrResult keys: ${Object.keys(responseData.results.ocrResults[0])}`);
                    }
                }
            }
            
            if (responseData.results.pages) {
                console.log(`- results.pages: ${responseData.results.pages}`);
            }
        }
        
        console.log('\n🎯 FRONTEND EXPECTATION vs REALITY:');
        console.log('===================================');
        console.log('Frontend expects:');
        console.log('- documentData.pages (array of page objects)');
        console.log('- OR documentData.results.pages (array of page objects)');
        console.log('- OR documentData.results.ocrResults (array of page objects)');
        console.log('- Each page object should have: page.base64 property');
        
        console.log('\nActual response provides:');
        if (responseData.results && responseData.results.success === false) {
            console.log('❌ Error response - no page data available');
            console.log(`Error: ${responseData.results.error}`);
        } else {
            console.log('✅ Success response - checking page data...');
        }
        
        // Save response for analysis
        await fs.writeFile('debug-api-response.json', JSON.stringify(responseData, null, 2));
        console.log('\n💾 Full response saved to debug-api-response.json');
        
    } catch (error) {
        console.error('💥 Debug failed:', error.message);
        console.error('📍 Stack:', error.stack);
    }
}

debugAPIResponse();
