const fs = require('fs').promises;
const FormData = require('form-data');
const fetch = require('node-fetch');
const path = require('path');

// Configuration
const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = './2. Messos  - 31.03.2025.pdf';
const TIMEOUT = 30000; // 30 seconds timeout

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Test results collector
const testResults = {
    timestamp: new Date().toISOString(),
    renderUrl: RENDER_URL,
    tests: [],
    summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    }
};

// Helper function to log with colors
function log(message, type = 'info') {
    const timestamp = new Date().toTimeString().slice(0, 8);
    const prefixColor = {
        info: colors.cyan,
        success: colors.green,
        error: colors.red,
        warning: colors.yellow,
        test: colors.blue,
        result: colors.magenta
    }[type] || colors.reset;
    
    console.log(`${colors.bright}[${timestamp}]${colors.reset} ${prefixColor}${message}${colors.reset}`);
}

// Helper function to test an endpoint
async function testEndpoint(name, endpoint, method = 'GET', body = null, headers = {}) {
    const startTime = Date.now();
    const testResult = {
        name,
        endpoint,
        method,
        startTime: new Date().toISOString(),
        status: 'pending',
        responseTime: 0,
        statusCode: null,
        response: null,
        error: null
    };

    try {
        log(`Testing ${method} ${endpoint}...`, 'test');
        
        const options = {
            method,
            headers: {
                'Accept': 'application/json',
                ...headers
            },
            timeout: TIMEOUT
        };
        
        if (body) {
            options.body = body;
        }
        
        const response = await fetch(`${RENDER_URL}${endpoint}`, options);
        const responseTime = Date.now() - startTime;
        
        testResult.statusCode = response.status;
        testResult.responseTime = responseTime;
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            testResult.response = await response.json();
        } else {
            testResult.response = await response.text();
        }
        
        if (response.ok) {
            testResult.status = 'passed';
            log(`✅ ${name} - ${response.status} (${responseTime}ms)`, 'success');
        } else {
            testResult.status = 'failed';
            log(`❌ ${name} - ${response.status} (${responseTime}ms)`, 'error');
        }
        
    } catch (error) {
        testResult.status = 'error';
        testResult.error = error.message;
        testResult.responseTime = Date.now() - startTime;
        log(`❌ ${name} - Error: ${error.message}`, 'error');
    }
    
    testResults.tests.push(testResult);
    return testResult;
}

// Test Smart OCR endpoints
async function testSmartOCREndpoints() {
    log('=== Testing Smart OCR Endpoints ===', 'info');
    
    // Test 1: Smart OCR Stats
    await testEndpoint(
        'Smart OCR Stats',
        '/api/smart-ocr-stats'
    );
    
    // Test 2: Smart OCR Patterns
    await testEndpoint(
        'Smart OCR Patterns',
        '/api/smart-ocr-patterns'
    );
    
    // Test 3: Smart OCR Test Endpoint
    await testEndpoint(
        'Smart OCR Test',
        '/api/smart-ocr-test'
    );
    
    // Test 4: Smart Annotation Interface
    const annotationTest = await testEndpoint(
        'Smart Annotation Interface',
        '/smart-annotation'
    );
    
    if (annotationTest.status === 'passed' && annotationTest.response) {
        const hasRequiredElements = 
            annotationTest.response.includes('Smart OCR Annotation System') &&
            annotationTest.response.includes('annotation-interface') &&
            annotationTest.response.includes('tool-btn');
        
        if (hasRequiredElements) {
            log('✅ Annotation interface contains all required elements', 'success');
        } else {
            log('⚠️ Annotation interface missing some elements', 'warning');
            testResults.summary.warnings++;
        }
    }
}

// Test Smart OCR Processing with PDF
async function testSmartOCRProcessing() {
    log('=== Testing Smart OCR PDF Processing ===', 'info');
    
    try {
        // Check if PDF exists
        await fs.access(PDF_PATH);
        log(`Found PDF: ${PDF_PATH}`, 'info');
        
        // Create form data
        const form = new FormData();
        const pdfBuffer = await fs.readFile(PDF_PATH);
        form.append('pdf', pdfBuffer, {
            filename: 'messos-test.pdf',
            contentType: 'application/pdf'
        });
        
        // Test PDF processing
        const processResult = await testEndpoint(
            'Smart OCR Process PDF',
            '/api/smart-ocr-process',
            'POST',
            form,
            form.getHeaders()
        );
        
        // Analyze results if successful
        if (processResult.status === 'passed' && processResult.response) {
            const response = processResult.response;
            
            log('=== Smart OCR Processing Results ===', 'result');
            log(`Success: ${response.success}`, 'result');
            
            if (response.data) {
                log(`Securities found: ${response.data.length}`, 'result');
                log(`Total value: $${response.totalValue?.toLocaleString() || 'N/A'}`, 'result');
                log(`Processing time: ${response.processingTime || 'N/A'}`, 'result');
                
                // Check for learning features
                if (response.learningMetadata) {
                    log('=== Learning Metadata ===', 'result');
                    log(`Patterns used: ${response.learningMetadata.patternsUsed || 0}`, 'result');
                    log(`Confidence: ${response.learningMetadata.confidence || 'N/A'}`, 'result');
                }
                
                // Show first few securities
                if (response.data.length > 0) {
                    log('=== Sample Securities ===', 'result');
                    response.data.slice(0, 3).forEach(security => {
                        log(`${security.isin}: $${security.marketValue?.toLocaleString() || 'N/A'}`, 'result');
                    });
                }
            }
        }
        
    } catch (error) {
        log(`PDF processing error: ${error.message}`, 'error');
        testResults.tests.push({
            name: 'Smart OCR Process PDF',
            endpoint: '/api/smart-ocr-process',
            method: 'POST',
            status: 'error',
            error: error.message
        });
    }
}

// Test Smart OCR Learning endpoint
async function testSmartOCRLearning() {
    log('=== Testing Smart OCR Learning ===', 'info');
    
    // Sample annotation data
    const learningData = {
        annotations: [
            {
                type: 'isin',
                x: 100,
                y: 200,
                width: 150,
                height: 20,
                text: 'XS2746319610',
                confidence: 0.95
            },
            {
                type: 'value',
                x: 300,
                y: 200,
                width: 100,
                height: 20,
                text: '140,000',
                confidence: 0.90
            }
        ],
        corrections: {
            'XS2746319610': {
                marketValue: 140000,
                correctionType: 'manual',
                reason: 'OCR misread value'
            }
        },
        documentId: 'test-doc-001'
    };
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const learningResult = await testEndpoint(
        'Smart OCR Learn',
        '/api/smart-ocr-learn',
        'POST',
        JSON.stringify(learningData),
        headers
    );
    
    if (learningResult.status === 'passed' && learningResult.response) {
        const response = learningResult.response;
        log('=== Learning Results ===', 'result');
        log(`Success: ${response.success}`, 'result');
        log(`Patterns learned: ${response.patternsLearned || 0}`, 'result');
        log(`Accuracy improvement: ${response.accuracyImprovement || 'N/A'}`, 'result');
    }
}

// Test other endpoints for comparison
async function testOtherEndpoints() {
    log('=== Testing Other Available Endpoints ===', 'info');
    
    // Test basic endpoints
    await testEndpoint('API Info', '/api/info');
    await testEndpoint('API Extraction Methods', '/api/extraction-methods');
    
    // Test homepage
    const homepageTest = await testEndpoint('Homepage', '/');
    if (homepageTest.status === 'passed' && homepageTest.response) {
        const hasSmartOCR = homepageTest.response.includes('Smart OCR');
        log(`Homepage mentions Smart OCR: ${hasSmartOCR ? '✅' : '❌'}`, hasSmartOCR ? 'success' : 'warning');
        
        if (!hasSmartOCR) {
            testResults.summary.warnings++;
        }
    }
}

// Generate final report
function generateReport() {
    // Calculate summary
    testResults.tests.forEach(test => {
        testResults.summary.total++;
        if (test.status === 'passed') testResults.summary.passed++;
        else if (test.status === 'failed' || test.status === 'error') testResults.summary.failed++;
    });
    
    log('=== FINAL REPORT ===', 'info');
    log(`Total tests: ${testResults.summary.total}`, 'result');
    log(`✅ Passed: ${testResults.summary.passed}`, 'success');
    log(`❌ Failed: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? 'error' : 'success');
    log(`⚠️  Warnings: ${testResults.summary.warnings}`, testResults.summary.warnings > 0 ? 'warning' : 'success');
    
    // Smart OCR specific findings
    const smartOCRTests = testResults.tests.filter(t => t.endpoint.includes('smart-ocr'));
    const smartOCRPassed = smartOCRTests.filter(t => t.status === 'passed').length;
    
    log('=== Smart OCR Status ===', 'info');
    log(`Smart OCR endpoints tested: ${smartOCRTests.length}`, 'result');
    log(`Smart OCR endpoints working: ${smartOCRPassed}`, smartOCRPassed > 0 ? 'success' : 'error');
    
    // Check for specific features
    const features = {
        'Stats API': testResults.tests.find(t => t.endpoint === '/api/smart-ocr-stats')?.status === 'passed',
        'Patterns API': testResults.tests.find(t => t.endpoint === '/api/smart-ocr-patterns')?.status === 'passed',
        'Process API': testResults.tests.find(t => t.endpoint === '/api/smart-ocr-process')?.status === 'passed',
        'Learn API': testResults.tests.find(t => t.endpoint === '/api/smart-ocr-learn')?.status === 'passed',
        'Annotation UI': testResults.tests.find(t => t.endpoint === '/smart-annotation')?.status === 'passed'
    };
    
    log('=== Feature Status ===', 'info');
    Object.entries(features).forEach(([feature, working]) => {
        log(`${feature}: ${working ? '✅ Working' : '❌ Not Working'}`, working ? 'success' : 'error');
    });
    
    // Save detailed report
    const reportPath = `smart-ocr-live-test-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    return { testResults, reportPath };
}

// Main execution
async function main() {
    log(`🚀 Smart OCR Live Testing - ${RENDER_URL}`, 'info');
    log('=====================================', 'info');
    
    try {
        // Run all tests
        await testSmartOCREndpoints();
        await testSmartOCRProcessing();
        await testSmartOCRLearning();
        await testOtherEndpoints();
        
        // Generate and save report
        const { testResults, reportPath } = generateReport();
        
        await fs.writeFile(reportPath, JSON.stringify(testResults, null, 2));
        log(`\n📄 Detailed report saved to: ${reportPath}`, 'info');
        
        // Quick summary
        if (testResults.summary.failed === 0 && testResults.summary.warnings === 0) {
            log('\n✅ All Smart OCR systems are operational!', 'success');
        } else if (testResults.summary.failed === 0) {
            log('\n⚠️ Smart OCR is working with some warnings', 'warning');
        } else {
            log('\n❌ Some Smart OCR features are not working', 'error');
        }
        
    } catch (error) {
        log(`Fatal error: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run the tests
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testSmartOCREndpoints, testSmartOCRProcessing };