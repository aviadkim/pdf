const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configuration
const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = './2. Messos  - 31.03.2025.pdf';

// Test all PDF processing endpoints
async function testAllEndpoints() {
    console.log('🔍 Testing ALL PDF Processing Endpoints');
    console.log('======================================');
    
    // List of all potential PDF processing endpoints
    const endpoints = [
        '/api/pdf-extract',
        '/api/extract',
        '/api/extract-simple',
        '/api/extract-basic',
        '/api/text-extract',
        '/api/bulletproof-processor',
        '/api/smart-ocr-process',
        '/api/enhanced-extraction',
        '/api/messos-extract',
        '/api/precision-financial-processor',
        '/api/universal-processor',
        '/api/claude-vision-processor',
        '/api/mcp-enhanced-processor'
    ];
    
    const results = {
        working: [],
        failing: [],
        notFound: []
    };
    
    try {
        // Check if PDF exists
        await fs.access(PDF_PATH);
        console.log(`✅ Found PDF: ${PDF_PATH}\n`);
        
        // Test each endpoint
        for (const endpoint of endpoints) {
            console.log(`Testing ${endpoint}...`);
            
            try {
                // Create fresh form data for each request
                const form = new FormData();
                const pdfBuffer = await fs.readFile(PDF_PATH);
                form.append('pdf', pdfBuffer, {
                    filename: 'messos-test.pdf',
                    contentType: 'application/pdf'
                });
                
                const startTime = Date.now();
                const response = await fetch(`${RENDER_URL}${endpoint}`, {
                    method: 'POST',
                    body: form,
                    headers: form.getHeaders(),
                    timeout: 15000
                });
                
                const responseTime = Date.now() - startTime;
                
                if (response.status === 404) {
                    console.log(`❌ 404 Not Found (${responseTime}ms)`);
                    results.notFound.push(endpoint);
                } else if (response.ok) {
                    const result = await response.json();
                    console.log(`✅ 200 OK (${responseTime}ms) - Success: ${result.success}`);
                    
                    if (result.success && result.data) {
                        console.log(`   Found ${result.data.length} securities, Total: $${result.totalValue?.toLocaleString() || 'N/A'}`);
                        results.working.push({
                            endpoint,
                            responseTime,
                            securitiesCount: result.data.length,
                            totalValue: result.totalValue
                        });
                    } else {
                        results.failing.push({
                            endpoint,
                            responseTime,
                            error: result.error || 'Unknown error'
                        });
                    }
                } else {
                    const errorText = await response.text();
                    const errorMsg = errorText.includes('GraphicsMagick') ? 'Missing GraphicsMagick' : 
                                     errorText.includes('timeout') ? 'Timeout' : 
                                     'Server error';
                    console.log(`❌ ${response.status} Error (${responseTime}ms) - ${errorMsg}`);
                    results.failing.push({
                        endpoint,
                        responseTime,
                        status: response.status,
                        error: errorMsg
                    });
                }
                
            } catch (error) {
                console.log(`❌ Request failed: ${error.message}`);
                results.failing.push({
                    endpoint,
                    error: error.message
                });
            }
            
            console.log(''); // Empty line between tests
        }
        
    } catch (error) {
        console.error('Fatal error:', error.message);
        return;
    }
    
    // Print summary
    console.log('\n📊 SUMMARY REPORT');
    console.log('=================');
    
    console.log(`\n✅ Working Endpoints (${results.working.length}):`);
    if (results.working.length > 0) {
        results.working.forEach(ep => {
            console.log(`   ${ep.endpoint} - ${ep.securitiesCount} securities, $${ep.totalValue?.toLocaleString() || 'N/A'} (${ep.responseTime}ms)`);
        });
    } else {
        console.log('   None');
    }
    
    console.log(`\n❌ Failing Endpoints (${results.failing.length}):`);
    if (results.failing.length > 0) {
        results.failing.forEach(ep => {
            console.log(`   ${ep.endpoint} - ${ep.error} (${ep.responseTime || 'N/A'}ms)`);
        });
    } else {
        console.log('   None');
    }
    
    console.log(`\n🚫 Not Found (${results.notFound.length}):`);
    if (results.notFound.length > 0) {
        results.notFound.forEach(ep => {
            console.log(`   ${ep}`);
        });
    } else {
        console.log('   None');
    }
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        renderUrl: RENDER_URL,
        totalEndpoints: endpoints.length,
        results
    };
    
    const reportPath = `endpoint-test-report-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Run the test
if (require.main === module) {
    testAllEndpoints().catch(console.error);
}

module.exports = { testAllEndpoints };