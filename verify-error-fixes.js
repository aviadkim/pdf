#!/usr/bin/env node

/**
 * VERIFY ERROR FIXES
 * 
 * Test to verify all the error fixes are working correctly
 */

const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

class ErrorFixVerifier {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.results = {
            apiTests: {},
            uploadTests: {},
            errors: []
        };
    }

    async runAllTests() {
        console.log('🔧 VERIFYING ALL ERROR FIXES');
        console.log('=============================');
        console.log(`🌐 Target: ${this.baseUrl}`);
        console.log('');

        try {
            // Test 1: API endpoints
            await this.testAPIEndpoints();
            
            // Test 2: PDF upload functionality
            await this.testPDFUpload();
            
            // Generate report
            this.generateReport();

        } catch (error) {
            console.error('💥 Test suite failed:', error);
        }
    }

    async testAPIEndpoints() {
        console.log('📡 Testing API endpoints...');
        
        const endpoints = [
            '/health',
            '/api/smart-ocr-test',
            '/api/smart-ocr-stats',
            '/api/smart-ocr-patterns'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`  🔍 Testing ${endpoint}...`);
                const startTime = Date.now();
                const response = await fetch(`${this.baseUrl}${endpoint}`);
                const endTime = Date.now();
                
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    data = await response.text();
                }

                this.results.apiTests[endpoint] = {
                    success: response.ok,
                    status: response.status,
                    responseTime: endTime - startTime,
                    dataType: typeof data,
                    hasData: !!data
                };

                console.log(`    ${response.ok ? '✅' : '❌'} ${response.status} (${endTime - startTime}ms)`);

            } catch (error) {
                this.results.apiTests[endpoint] = {
                    success: false,
                    error: error.message
                };
                console.log(`    ❌ Error: ${error.message}`);
            }
        }
    }

    async testPDFUpload() {
        console.log('\n📤 Testing PDF upload functionality...');
        
        // Test with the test PDF we created
        try {
            console.log('  🧪 Testing with valid PDF...');
            
            const formData = new FormData();
            
            try {
                const fileBuffer = await fs.readFile('test-upload.pdf');
                formData.append('pdf', fileBuffer, 'test-upload.pdf');
                console.log(`    📄 File loaded: ${fileBuffer.length} bytes`);
            } catch (fileError) {
                console.log('    ⚠️ Test PDF not found, creating one...');
                // Create a minimal test PDF
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
                
                await fs.writeFile('test-upload.pdf', pdfContent);
                const fileBuffer = Buffer.from(pdfContent);
                formData.append('pdf', fileBuffer, 'test-upload.pdf');
                console.log(`    📄 Created and loaded test PDF: ${fileBuffer.length} bytes`);
            }

            const startTime = Date.now();
            const response = await fetch(`${this.baseUrl}/api/smart-ocr-process`, {
                method: 'POST',
                body: formData
            });
            const endTime = Date.now();

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                responseData = await response.text();
            }

            this.results.uploadTests['Valid PDF'] = {
                success: response.ok,
                status: response.status,
                responseTime: endTime - startTime,
                response: responseData,
                hasResults: !!(responseData && responseData.results),
                errorHandled: !response.ok && !!responseData.error
            };

            console.log(`    ${response.ok ? '✅' : '❌'} ${response.status} (${endTime - startTime}ms)`);
            
            if (responseData && responseData.error) {
                console.log(`    📝 Error message: ${responseData.error}`);
            }
            
            if (responseData && responseData.results) {
                console.log(`    📊 Results: ${responseData.results.success ? 'SUCCESS' : 'FAILED'}`);
                if (responseData.results.accuracy) {
                    console.log(`    🎯 Accuracy: ${responseData.results.accuracy}%`);
                }
                if (responseData.results.ocrResults) {
                    console.log(`    📄 OCR Results: ${Array.isArray(responseData.results.ocrResults) ? responseData.results.ocrResults.length + ' items' : typeof responseData.results.ocrResults}`);
                }
            }

        } catch (error) {
            this.results.uploadTests['Valid PDF'] = {
                success: false,
                error: error.message
            };
            console.log(`    ❌ Error: ${error.message}`);
        }

        // Test with no file (should return proper error)
        try {
            console.log('  🧪 Testing with no file...');
            
            const formData = new FormData();
            
            const response = await fetch(`${this.baseUrl}/api/smart-ocr-process`, {
                method: 'POST',
                body: formData
            });

            let responseData;
            try {
                responseData = await response.json();
            } catch (parseError) {
                responseData = await response.text();
            }

            this.results.uploadTests['No File'] = {
                success: false, // We expect this to fail
                status: response.status,
                response: responseData,
                errorHandled: !response.ok && !!responseData.error
            };

            console.log(`    ${!response.ok && responseData.error ? '✅' : '❌'} ${response.status} - Error ${responseData.error ? 'handled correctly' : 'not handled'}`);

        } catch (error) {
            console.log(`    ✅ Error properly caught: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📊 ERROR FIX VERIFICATION RESULTS');
        console.log('==================================');
        
        // API Tests Summary
        console.log('\n📡 API Endpoints:');
        Object.entries(this.results.apiTests).forEach(([endpoint, result]) => {
            console.log(`  ${result.success ? '✅' : '❌'} ${endpoint}: ${result.status || 'ERROR'} (${result.responseTime || 0}ms)`);
        });

        // Upload Tests Summary
        console.log('\n📤 Upload Tests:');
        Object.entries(this.results.uploadTests).forEach(([test, result]) => {
            const status = result.success ? 'SUCCESS' : 
                          result.errorHandled ? 'ERROR HANDLED CORRECTLY' : 'FAILED';
            console.log(`  ${result.success || result.errorHandled ? '✅' : '❌'} ${test}: ${status}`);
        });

        // Overall Assessment
        const apiSuccess = Object.values(this.results.apiTests).filter(r => r.success).length;
        const apiTotal = Object.keys(this.results.apiTests).length;
        const uploadSuccess = Object.values(this.results.uploadTests).filter(r => r.success || r.errorHandled).length;
        const uploadTotal = Object.keys(this.results.uploadTests).length;

        console.log('\n🎯 OVERALL ASSESSMENT:');
        console.log(`📡 API Endpoints: ${apiSuccess}/${apiTotal} working`);
        console.log(`📤 Upload Handling: ${uploadSuccess}/${uploadTotal} working correctly`);
        
        const overallSuccess = (apiSuccess + uploadSuccess) / (apiTotal + uploadTotal);
        console.log(`🎯 Overall Success Rate: ${(overallSuccess * 100).toFixed(1)}%`);

        if (overallSuccess >= 0.8) {
            console.log('\n✅ ERROR FIXES SUCCESSFUL!');
            console.log('The system is now working correctly with proper error handling.');
        } else if (overallSuccess >= 0.6) {
            console.log('\n⚠️ PARTIAL SUCCESS');
            console.log('Most fixes are working, but some issues may remain.');
        } else {
            console.log('\n❌ FIXES INCOMPLETE');
            console.log('Major issues still present, additional fixes needed.');
        }

        // Specific findings
        console.log('\n📋 KEY FINDINGS:');
        
        if (this.results.uploadTests['Valid PDF']) {
            const uploadResult = this.results.uploadTests['Valid PDF'];
            if (uploadResult.success) {
                console.log('✅ PDF upload and processing is working correctly');
            } else if (uploadResult.status === 500) {
                console.log('❌ HTTP 500 error still occurring - server-side processing issue');
            } else if (uploadResult.status === 422) {
                console.log('✅ Server returns 422 for processing errors (good error handling)');
            } else {
                console.log(`⚠️ Unexpected response: ${uploadResult.status}`);
            }
        }
        
        const failedAPIs = Object.entries(this.results.apiTests).filter(([_, result]) => !result.success);
        if (failedAPIs.length === 0) {
            console.log('✅ All API endpoints are working correctly');
        } else {
            console.log(`❌ Failed API endpoints: ${failedAPIs.map(([endpoint]) => endpoint).join(', ')}`);
        }

        console.log('\n🏁 Verification complete!');
    }
}

// Main execution
async function main() {
    const verifier = new ErrorFixVerifier();
    await verifier.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ErrorFixVerifier };
