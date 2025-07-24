/**
 * DIRECT API TEST - Test Perfect Mistral endpoints directly
 * Try to bypass the web interface and test API endpoints directly
 */

const fetch = require('node-fetch');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function testDirectAPI() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    console.log('🧪 DIRECT API TESTING');
    console.log('====================\n');

    // Test endpoints that should exist after our deployment
    const endpoints = [
        { endpoint: '/api/bulletproof-processor', method: 'POST', needsPDF: true },
        { endpoint: '/api/perfect-extraction', method: 'POST', needsPDF: true },
        { endpoint: '/api/pdf-extract', method: 'POST', needsPDF: true },
        { endpoint: '/api/system-capabilities', method: 'GET', needsPDF: false },
        { endpoint: '/api/smart-ocr-stats', method: 'GET', needsPDF: false }
    ];

    for (const { endpoint, method, needsPDF } of endpoints) {
        console.log(`🔍 Testing ${method} ${endpoint}`);
        
        try {
            let response;
            
            if (needsPDF && method === 'POST') {
                // Test with actual PDF upload
                const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
                
                if (fs.existsSync(pdfPath)) {
                    const formData = new FormData();
                    formData.append('pdf', fs.createReadStream(pdfPath));
                    
                    response = await fetch(baseUrl + endpoint, {
                        method: 'POST',
                        body: formData,
                        timeout: 30000
                    });
                } else {
                    console.log('   ❌ PDF file not found, skipping');
                    continue;
                }
            } else {
                response = await fetch(baseUrl + endpoint, {
                    method: method,
                    timeout: 10000
                });
            }

            console.log(`   📊 Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    const data = await response.json();
                    
                    console.log(`   ✅ Success! Response type: JSON`);
                    
                    if (endpoint === '/api/bulletproof-processor' || endpoint === '/api/perfect-extraction') {
                        console.log(`   🎯 Securities found: ${data.securities?.length || 0}`);
                        console.log(`   💰 Total value: $${data.totalValue || 0}`);
                        console.log(`   📊 Accuracy: ${data.accuracy || data.confidence || 0}%`);
                        console.log(`   🔧 Method: ${data.method || data.extractionMethod || 'unknown'}`);
                        
                        if (data.securities && data.securities.length > 0) {
                            console.log(`   🎉 SUCCESS! Found securities with values!`);
                            console.log(`   Top 3 securities:`);
                            data.securities.slice(0, 3).forEach((sec, i) => {
                                console.log(`     ${i+1}. ${sec.isin}: $${sec.marketValue || sec.value || 0}`);
                            });
                        } else {
                            console.log(`   ⚠️ No securities with values found`);
                        }
                    } else if (endpoint === '/api/system-capabilities') {
                        console.log(`   🎯 System: ${data.system || 'unknown'}`);
                        console.log(`   🔧 Mistral available: ${data.capabilities?.mistral_ocr?.available || false}`);
                    }
                } else {
                    const text = await response.text();
                    console.log(`   ℹ️ Response: ${text.substring(0, 200)}...`);
                }
            } else {
                console.log(`   ❌ Error: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }
    
    console.log('🏁 DIRECT API TESTING COMPLETE');
}

testDirectAPI();