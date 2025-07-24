const axios = require('axios');

const RENDER_URL = 'https://pdf-fzzi.onrender.com';

const ENDPOINTS_TO_TEST = [
    '/',
    '/api/bulletproof-processor',
    '/api/complete-processor',
    '/api/vision-upload',
    '/api/vision-upload-batch',
    '/api/process-pdf',
    '/api/extract-pdf',
    '/api/health',
    '/api/status'
];

async function testEndpointAvailability() {
    console.log('🔍 Testing Render Deployment Endpoints');
    console.log('=====================================');
    console.log('Target URL:', RENDER_URL);
    console.log('');
    
    for (const endpoint of ENDPOINTS_TO_TEST) {
        try {
            console.log(`Testing ${endpoint}...`);
            
            const response = await axios.get(`${RENDER_URL}${endpoint}`, {
                timeout: 10000,
                validateStatus: (status) => status < 500 // Accept 4xx as "available but needs different method"
            });
            
            console.log(`✅ ${endpoint} - Status: ${response.status}`);
            
            if (response.status === 200) {
                const contentType = response.headers['content-type'] || '';
                console.log(`   Content-Type: ${contentType}`);
                
                if (contentType.includes('text/html')) {
                    const htmlLength = response.data.length;
                    console.log(`   HTML Length: ${htmlLength}`);
                    
                    // Check for key content
                    const html = response.data.toLowerCase();
                    const hasForm = html.includes('<form') || html.includes('form');
                    const hasFileInput = html.includes('type="file"') || html.includes('file');
                    const hasMultiAgent = html.includes('multi-agent') || html.includes('complete');
                    
                    console.log(`   Has Form: ${hasForm ? '✅' : '❌'}`);
                    console.log(`   Has File Input: ${hasFileInput ? '✅' : '❌'}`);
                    console.log(`   Has Multi-Agent: ${hasMultiAgent ? '✅' : '❌'}`);
                    
                } else if (contentType.includes('application/json')) {
                    console.log(`   JSON Response Length: ${JSON.stringify(response.data).length}`);
                }
            } else if (response.status === 405) {
                console.log('   Method not allowed - try POST');
            } else if (response.status === 404) {
                console.log('   Not found');
            }
            
        } catch (error) {
            if (error.response) {
                console.log(`❌ ${endpoint} - Status: ${error.response.status} (${error.response.statusText})`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`❌ ${endpoint} - Connection refused`);
            } else if (error.code === 'ETIMEDOUT') {
                console.log(`❌ ${endpoint} - Timeout`);
            } else {
                console.log(`❌ ${endpoint} - Error: ${error.message}`);
            }
        }
        
        console.log('');
    }
}

async function testActualHomePage() {
    console.log('🏠 Detailed Home Page Analysis');
    console.log('=====================================');
    
    try {
        const response = await axios.get(RENDER_URL, {
            timeout: 15000
        });
        
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Content-Length:', response.headers['content-length']);
        console.log('');
        
        console.log('Raw Response:');
        console.log('=====================================');
        console.log(response.data);
        console.log('=====================================');
        
        // Try to detect if this is a placeholder or actual app
        const content = response.data.toLowerCase();
        
        if (content.includes('hello world') || content.includes('render') || content.length < 100) {
            console.log('⚠️  This appears to be a placeholder page');
        } else {
            console.log('✅ This appears to be the actual application');
        }
        
    } catch (error) {
        console.log('❌ Failed to fetch home page:', error.message);
    }
}

async function runEndpointTests() {
    await testActualHomePage();
    console.log('\n');
    await testEndpointAvailability();
}

if (require.main === module) {
    runEndpointTests().catch(console.error);
}

module.exports = { testEndpointAvailability, testActualHomePage };