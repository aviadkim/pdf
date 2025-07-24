#!/usr/bin/env node

/**
 * TEST UPLOAD EDGE CASES
 * 
 * Tests various edge cases that might prevent PDF uploads
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUploadEdgeCases() {
    console.log('🧪 TESTING UPLOAD EDGE CASES');
    console.log('============================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    const testCases = [
        {
            name: 'Large File Size Test',
            description: 'Test with a larger PDF to check size limits',
            createFile: async () => {
                // Create a larger PDF with more content
                const largePdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 5000>>stream
BT/F1 12 Tf 50 750 Td
${'(Large PDF Content Line) Tj 0 -15 Td '.repeat(200)}
ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref ${5000 + 300} %%EOF`;
                
                await fs.writeFile('large-test.pdf', largePdfContent);
                return 'large-test.pdf';
            }
        },
        {
            name: 'Special Characters Test',
            description: 'Test with special characters in filename and content',
            createFile: async () => {
                const specialPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 200>>stream
BT/F1 12 Tf 50 750 Td
(Special Characters: äöü ñ € £ $ %) Tj 0 -15 Td
(Unicode: 中文 العربية русский) Tj 0 -15 Td
(Symbols: @#$%^&*()_+-=[]{}|;:,.<>?) Tj
ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000204 00000 n 
trailer<</Size 5/Root 1 0 R>>startxref 500 %%EOF`;
                
                await fs.writeFile('special-chars-test.pdf', specialPdfContent);
                return 'special-chars-test.pdf';
            }
        },
        {
            name: 'Empty PDF Test',
            description: 'Test with minimal/empty PDF',
            createFile: async () => {
                const emptyPdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj
xref 0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer<</Size 4/Root 1 0 R>>startxref 180 %%EOF`;
                
                await fs.writeFile('empty-test.pdf', emptyPdfContent);
                return 'empty-test.pdf';
            }
        },
        {
            name: 'Network Timeout Test',
            description: 'Test with slow upload simulation',
            createFile: async () => {
                return 'messos-realistic.pdf'; // Use existing file
            },
            customTest: true
        }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`\n🧪 ${testCase.name}`);
            console.log('='.repeat(testCase.name.length + 4));
            console.log(`📝 ${testCase.description}`);
            
            const filename = await testCase.createFile();
            const stats = await fs.stat(filename);
            console.log(`📄 File: ${filename} (${stats.size} bytes)`);
            
            if (testCase.customTest) {
                // Test with different timeout settings
                console.log('⏱️ Testing with extended timeout...');
                
                const formData = new FormData();
                const fileBuffer = await fs.readFile(filename);
                formData.append('pdf', fileBuffer, filename);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                try {
                    const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
                        method: 'POST',
                        body: formData,
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        const data = await response.json();
                        console.log(`✅ Success: ${response.status} - Processing: ${data.results?.success}`);
                    } else {
                        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
                    }
                    
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    if (fetchError.name === 'AbortError') {
                        console.log('❌ Timeout: Request took longer than 30 seconds');
                    } else {
                        console.log(`❌ Network Error: ${fetchError.message}`);
                    }
                }
                
            } else {
                // Standard test
                const formData = new FormData();
                const fileBuffer = await fs.readFile(filename);
                formData.append('pdf', fileBuffer, filename);
                
                const startTime = Date.now();
                const response = await fetch(`${baseUrl}/api/smart-ocr-process`, {
                    method: 'POST',
                    body: formData
                });
                const endTime = Date.now();
                
                console.log(`📡 Response: ${response.status} ${response.statusText} (${endTime - startTime}ms)`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Processing: ${data.results?.success ? 'SUCCESS' : 'FAILED'}`);
                    
                    if (data.results?.error) {
                        console.log(`❌ Error: ${data.results.error}`);
                    }
                    
                    if (data.results?.pageCount) {
                        console.log(`📊 Pages: ${data.results.pageCount}`);
                    }
                    
                } else {
                    const errorText = await response.text();
                    console.log(`❌ Error Response: ${errorText.substring(0, 200)}...`);
                }
            }
            
        } catch (error) {
            console.log(`❌ Test Failed: ${error.message}`);
            
            // Analyze common error types
            if (error.code === 'ENOTFOUND') {
                console.log('🔍 DNS resolution failed - check internet connection');
            } else if (error.code === 'ECONNRESET') {
                console.log('🔍 Connection reset - server might be overloaded');
            } else if (error.message.includes('timeout')) {
                console.log('🔍 Request timeout - file might be too large');
            } else if (error.message.includes('413')) {
                console.log('🔍 File too large - exceeds server limits');
            } else if (error.message.includes('400')) {
                console.log('🔍 Bad request - file format might be invalid');
            }
        }
    }
    
    console.log('\n🎯 EDGE CASE TESTING SUMMARY:');
    console.log('=============================');
    console.log('Common upload issues that might affect your "messos pdf":');
    console.log('1. File size too large (>50MB limit)');
    console.log('2. Network timeout during upload');
    console.log('3. Special characters in filename');
    console.log('4. Corrupted or invalid PDF structure');
    console.log('5. Server overload or deployment issues');
    console.log('6. Browser-specific upload limitations');
    
    console.log('\n💡 TROUBLESHOOTING SUGGESTIONS:');
    console.log('===============================');
    console.log('If your PDF upload fails:');
    console.log('- Check file size (should be <50MB)');
    console.log('- Try renaming file to remove special characters');
    console.log('- Wait a few minutes if server is deploying');
    console.log('- Try uploading from a different browser');
    console.log('- Check internet connection stability');
}

testUploadEdgeCases();
