const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');

async function testActualEndpoints() {
    console.log('🔍 Testing Actual Render Endpoints');
    console.log('=====================================');
    
    // Test 1: Health check
    try {
        console.log('1. Testing health check...');
        const response = await axios.get(`${RENDER_URL}/api/test`, {
            timeout: 15000
        });
        
        console.log('✅ Health check successful');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
    }
    
    console.log('\n');
    
    // Test 2: Check what's actually running on the home page
    try {
        console.log('2. Checking home page...');
        const response = await axios.get(RENDER_URL, {
            timeout: 15000
        });
        
        console.log('✅ Home page accessible');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Content-Length:', response.headers['content-length']);
        console.log('First 500 chars:', response.data.substring(0, 500));
        
        // Check if this is the proper interface
        if (response.data.includes('MCP-Enhanced PDF Processor')) {
            console.log('✅ This is the MCP-Enhanced interface');
        } else {
            console.log('❌ This is not the expected interface');
        }
        
    } catch (error) {
        console.log('❌ Home page test failed:', error.message);
    }
    
    console.log('\n');
    
    // Test 3: Try the actual endpoints mentioned in index.js
    const endpointsToTest = [
        '/api/real-pdf-extractor',
        '/api/mcp-enhanced-processor'
    ];
    
    for (const endpoint of endpointsToTest) {
        try {
            console.log(`3. Testing ${endpoint}...`);
            
            // Test with test mode first
            const testResponse = await axios.post(`${RENDER_URL}${endpoint}`, {
                testMode: true
            }, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`✅ ${endpoint} test mode successful`);
            console.log('Status:', testResponse.status);
            console.log('Response keys:', Object.keys(testResponse.data));
            
            // If test mode works, try with actual PDF
            if (fs.existsSync(PDF_PATH)) {
                console.log(`   Testing with actual PDF...`);
                
                const pdfBuffer = fs.readFileSync(PDF_PATH);
                const pdfBase64 = pdfBuffer.toString('base64');
                
                const pdfResponse = await axios.post(`${RENDER_URL}${endpoint}`, {
                    pdfBase64: pdfBase64,
                    filename: 'messos.pdf'
                }, {
                    timeout: 120000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log(`   ✅ PDF processing successful`);
                console.log('   Status:', pdfResponse.status);
                console.log('   Response keys:', Object.keys(pdfResponse.data));
                
                // Check for extracted data
                if (pdfResponse.data.securities || pdfResponse.data.extractedData) {
                    const securities = pdfResponse.data.securities || pdfResponse.data.extractedData;
                    console.log(`   📊 Found ${securities.length} securities`);
                    
                    // Look for the problematic ISIN
                    const problematicSecurity = securities.find(s => s.isin === 'XS2746319610');
                    if (problematicSecurity) {
                        console.log(`   🔍 Found XS2746319610: ${problematicSecurity.notionalAmount || problematicSecurity.amount || problematicSecurity.value}`);
                    }
                }
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint} failed:`, error.message);
            if (error.response) {
                console.log('   Status:', error.response.status);
                console.log('   Response:', error.response.data);
            }
        }
        
        console.log('');
    }
    
    // Test 4: Browser automation test
    try {
        console.log('4. Testing browser automation...');
        const browserResponse = await axios.post(`${RENDER_URL}/api/test`, {
            testPuppeteer: true,
            testPlaywright: true
        }, {
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Browser automation test successful');
        console.log('Puppeteer:', browserResponse.data.puppeteerResult);
        console.log('Playwright:', browserResponse.data.playwrightResult);
        
    } catch (error) {
        console.log('❌ Browser automation test failed:', error.message);
    }
}

if (require.main === module) {
    testActualEndpoints().catch(console.error);
}

module.exports = { testActualEndpoints };