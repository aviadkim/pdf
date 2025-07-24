const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');

async function testDirectExpressEndpoints() {
    console.log('🔍 Testing Direct Express Server Endpoints');
    console.log('=====================================');
    console.log('This test bypasses static file serving issues');
    console.log('');
    
    // Test the endpoints that should exist based on express-server.js
    const endpoints = [
        {
            path: '/api/bulletproof-processor',
            method: 'POST',
            description: 'Standard PDF processor from express-server.js'
        },
        {
            path: '/api/complete-processor', 
            method: 'POST',
            description: 'Complete multi-agent processor from express-server.js'
        }
    ];
    
    for (const endpoint of endpoints) {
        console.log(`Testing ${endpoint.path} - ${endpoint.description}`);
        
        try {
            if (!fs.existsSync(PDF_PATH)) {
                console.log('❌ PDF file not found');
                continue;
            }
            
            // Create form data with the PDF file
            const form = new FormData();
            form.append('pdf', fs.createReadStream(PDF_PATH));
            
            console.log('📤 Uploading PDF...');
            
            const response = await axios({
                method: endpoint.method,
                url: `${RENDER_URL}${endpoint.path}`,
                data: form,
                headers: {
                    ...form.getHeaders(),
                },
                timeout: 120000, // 2 minutes timeout
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });
            
            console.log(`✅ ${endpoint.path} successful`);
            console.log('Status:', response.status);
            console.log('Response keys:', Object.keys(response.data));
            
            // Analyze the response
            const result = response.data;
            
            if (result.securities || result.extractedData) {
                const securities = result.securities || result.extractedData;
                console.log(`📊 Found ${securities.length} securities`);
                
                // Look for the problematic ISIN
                const problematicSecurity = securities.find(s => s.isin === 'XS2746319610');
                if (problematicSecurity) {
                    const value = problematicSecurity.notionalAmount || problematicSecurity.amount || problematicSecurity.value;
                    console.log(`🔍 Found XS2746319610: ${value}`);
                    
                    // Check if it's the corrected value
                    const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                    if (numValue && numValue > 10000000) {
                        console.log(`❌ Still showing inflated value: $${numValue.toLocaleString()}`);
                    } else {
                        console.log(`✅ Value appears corrected: $${numValue.toLocaleString()}`);
                    }
                }
                
                // Show first 3 securities
                console.log('\n📋 First 3 securities:');
                securities.slice(0, 3).forEach((security, index) => {
                    console.log(`${index + 1}. ${security.isin} - ${security.securityName || security.name || 'N/A'} - ${security.notionalAmount || security.amount || security.value || 'N/A'}`);
                });
            }
            
            if (result.metadata) {
                console.log('\n📊 Metadata:');
                console.log('  Enhanced extraction:', result.metadata.enhancedExtraction || false);
                console.log('  Multi-agent:', result.metadata.multiAgent || false);
                console.log('  Accuracy:', result.metadata.accuracy || 'N/A');
                console.log('  Processing method:', result.metadata.processingMethod || 'N/A');
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint.path} failed:`, error.message);
            
            if (error.response) {
                console.log('Status:', error.response.status);
                console.log('Status text:', error.response.statusText);
                
                if (error.response.status === 404) {
                    console.log('💡 This suggests the Express server is not running the expected routes');
                } else if (error.response.status === 500) {
                    console.log('💡 Server error - check logs for details');
                } else if (error.response.status === 413) {
                    console.log('💡 Request entity too large - file size issue');
                }
            } else if (error.code === 'ECONNREFUSED') {
                console.log('💡 Connection refused - server might be down');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('💡 Timeout - server might be overloaded');
            }
        }
        
        console.log('');
    }
    
    // Test alternative endpoints that might exist
    console.log('🔍 Testing Alternative Endpoints');
    console.log('=====================================');
    
    const altEndpoints = [
        '/api/vision-upload',
        '/api/vision-upload-batch',
        '/api/process-pdf',
        '/api/extract-pdf',
        '/api/pdf-processor',
        '/api/pdf-extractor'
    ];
    
    for (const endpoint of altEndpoints) {
        try {
            // Try GET first
            const getResponse = await axios.get(`${RENDER_URL}${endpoint}`, {
                timeout: 10000,
                validateStatus: (status) => status < 500
            });
            
            console.log(`${endpoint} (GET): ${getResponse.status}`);
            
        } catch (error) {
            if (error.response && error.response.status === 405) {
                console.log(`${endpoint} (GET): 405 - Method not allowed (try POST)`);
            } else if (error.response && error.response.status === 404) {
                console.log(`${endpoint} (GET): 404 - Not found`);
            } else {
                console.log(`${endpoint} (GET): Error - ${error.message}`);
            }
        }
    }
}

async function testExpressServerDirectly() {
    console.log('\n🚀 RENDER EXPRESS SERVER DIRECT TEST');
    console.log('=====================================');
    console.log('Target URL:', RENDER_URL);
    console.log('PDF Path:', PDF_PATH);
    console.log('');
    
    await testDirectExpressEndpoints();
    
    console.log('\n🏁 TEST SUMMARY');
    console.log('=====================================');
    console.log('If all endpoints failed with 404, the issue is likely:');
    console.log('1. The wrong server is running (static files instead of Express)');
    console.log('2. The Dockerfile is not properly configured');
    console.log('3. The build process is interfering with the server');
    console.log('');
    console.log('Expected working endpoints:');
    console.log('- POST /api/bulletproof-processor');
    console.log('- POST /api/complete-processor');
}

if (require.main === module) {
    testExpressServerDirectly().catch(console.error);
}

module.exports = { testDirectExpressEndpoints };