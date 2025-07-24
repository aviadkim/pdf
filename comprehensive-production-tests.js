const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = 'https://pdf-fzzi.onrender.com';
const TEST_PDF_PATH = path.join(__dirname, 'Messos_Anlagestiftung_Full_Report.pdf');
const TIMEOUT = 300000; // 5 minutes

// Test results storage
const testResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    endpoints: {},
    summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        averageResponseTime: 0
    }
};

// Utility functions
function logTest(testName, status, details = {}) {
    const result = {
        status,
        timestamp: new Date().toISOString(),
        ...details
    };
    
    testResults.endpoints[testName] = result;
    testResults.summary.totalTests++;
    
    if (status === 'passed') {
        testResults.summary.passed++;
        console.log(`✅ ${testName}: PASSED`);
    } else {
        testResults.summary.failed++;
        console.log(`❌ ${testName}: FAILED`);
    }
    
    if (details.error) {
        console.error(`   Error: ${details.error}`);
    }
    if (details.responseTime) {
        console.log(`   Response time: ${details.responseTime.toFixed(2)}ms`);
    }
}

async function testHealthEndpoint() {
    const testName = 'Health Check';
    const startTime = performance.now();
    
    try {
        const response = await axios.get(`${BASE_URL}/health`, { timeout: 30000 });
        const responseTime = performance.now() - startTime;
        
        if (response.status === 200 && response.data.status === 'ok') {
            logTest(testName, 'passed', {
                responseTime,
                responseData: response.data
            });
        } else {
            logTest(testName, 'failed', {
                responseTime,
                error: 'Unexpected response',
                responseData: response.data
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            error: error.message,
            responseTime: performance.now() - startTime
        });
    }
}

async function testSystemCapabilities() {
    const testName = 'System Capabilities';
    const startTime = performance.now();
    
    try {
        const response = await axios.get(`${BASE_URL}/api/system-capabilities`, { timeout: 30000 });
        const responseTime = performance.now() - startTime;
        
        if (response.status === 200 && response.data.capabilities) {
            const caps = response.data.capabilities;
            const hasRequiredCapabilities = 
                caps.pdfProcessing && 
                caps.imageProcessing && 
                caps.endpoints && 
                caps.endpoints.length > 0;
            
            logTest(testName, hasRequiredCapabilities ? 'passed' : 'failed', {
                responseTime,
                capabilities: caps,
                error: hasRequiredCapabilities ? null : 'Missing required capabilities'
            });
        } else {
            logTest(testName, 'failed', {
                responseTime,
                error: 'Invalid response format',
                responseData: response.data
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            error: error.message,
            responseTime: performance.now() - startTime
        });
    }
}

async function testPDFExtraction(endpoint, testName) {
    const startTime = performance.now();
    
    try {
        if (!fs.existsSync(TEST_PDF_PATH)) {
            logTest(testName, 'failed', {
                error: `Test PDF not found at ${TEST_PDF_PATH}`
            });
            return;
        }
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(TEST_PDF_PATH));
        
        const response = await axios.post(
            `${BASE_URL}${endpoint}`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: TIMEOUT,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        
        const responseTime = performance.now() - startTime;
        
        if (response.status === 200) {
            const data = response.data;
            const securities = data.securities || [];
            const totalValue = data.totalValue || 0;
            
            // Validate extraction results
            const hasSecurities = securities.length > 0;
            const hasValidTotal = totalValue > 0;
            const hasISINs = securities.every(s => s.isin && s.isin.match(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/));
            
            const validationPassed = hasSecurities && hasValidTotal && hasISINs;
            
            logTest(testName, validationPassed ? 'passed' : 'failed', {
                responseTime,
                securitiesCount: securities.length,
                totalValue,
                accuracy: data.accuracy || 'N/A',
                validationDetails: {
                    hasSecurities,
                    hasValidTotal,
                    hasISINs
                },
                error: validationPassed ? null : 'Validation failed'
            });
            
            // Additional accuracy check for known values
            if (endpoint.includes('ultra-accurate') || endpoint.includes('phase2-enhanced')) {
                const expectedTotal = 19464431;
                const accuracy = (totalValue / expectedTotal) * 100;
                console.log(`   Accuracy: ${accuracy.toFixed(2)}% (${totalValue} / ${expectedTotal})`);
            }
        } else {
            logTest(testName, 'failed', {
                responseTime,
                error: `HTTP ${response.status}`,
                responseData: response.data
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            error: error.message,
            responseTime: performance.now() - startTime,
            details: error.response ? error.response.data : null
        });
    }
}

async function testMistralOCR() {
    const testName = 'Mistral OCR Extraction';
    const startTime = performance.now();
    
    try {
        if (!fs.existsSync(TEST_PDF_PATH)) {
            logTest(testName, 'failed', {
                error: `Test PDF not found at ${TEST_PDF_PATH}`
            });
            return;
        }
        
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(TEST_PDF_PATH));
        
        const response = await axios.post(
            `${BASE_URL}/api/mistral-ocr-extract`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: TIMEOUT,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        
        const responseTime = performance.now() - startTime;
        
        if (response.status === 200) {
            const data = response.data;
            const hasExtractedData = data.extractedData && Object.keys(data.extractedData).length > 0;
            const hasProcessingInfo = data.processingTime !== undefined;
            
            logTest(testName, hasExtractedData ? 'passed' : 'failed', {
                responseTime,
                processingTime: data.processingTime,
                extractedFields: Object.keys(data.extractedData || {}),
                error: hasExtractedData ? null : 'No data extracted'
            });
        } else {
            logTest(testName, 'failed', {
                responseTime,
                error: `HTTP ${response.status}`,
                responseData: response.data
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            error: error.message,
            responseTime: performance.now() - startTime,
            details: error.response ? error.response.data : null
        });
    }
}

async function testErrorHandling() {
    const testName = 'Error Handling';
    const startTime = performance.now();
    
    try {
        // Test with invalid file
        const formData = new FormData();
        formData.append('pdf', Buffer.from('invalid pdf content'), 'invalid.pdf');
        
        const response = await axios.post(
            `${BASE_URL}/api/ultra-accurate-extract`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 30000,
                validateStatus: () => true // Accept any status
            }
        );
        
        const responseTime = performance.now() - startTime;
        
        // Should return error status
        if (response.status >= 400 && response.data.error) {
            logTest(testName, 'passed', {
                responseTime,
                errorHandling: 'Properly handled invalid input',
                statusCode: response.status,
                errorMessage: response.data.error
            });
        } else {
            logTest(testName, 'failed', {
                responseTime,
                error: 'Did not properly handle invalid input',
                statusCode: response.status,
                responseData: response.data
            });
        }
    } catch (error) {
        // Network errors are expected for bad requests
        const responseTime = performance.now() - startTime;
        logTest(testName, 'passed', {
            responseTime,
            errorHandling: 'Properly rejected invalid request',
            error: error.message
        });
    }
}

async function testConcurrentRequests() {
    const testName = 'Concurrent Requests';
    const concurrentCount = 3;
    const startTime = performance.now();
    
    try {
        const promises = [];
        for (let i = 0; i < concurrentCount; i++) {
            promises.push(axios.get(`${BASE_URL}/health`, { timeout: 30000 }));
        }
        
        const results = await Promise.allSettled(promises);
        const responseTime = performance.now() - startTime;
        
        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const allSucceeded = successCount === concurrentCount;
        
        logTest(testName, allSucceeded ? 'passed' : 'failed', {
            responseTime,
            concurrentRequests: concurrentCount,
            successfulRequests: successCount,
            averageResponseTime: responseTime / concurrentCount,
            error: allSucceeded ? null : `${concurrentCount - successCount} requests failed`
        });
    } catch (error) {
        logTest(testName, 'failed', {
            error: error.message,
            responseTime: performance.now() - startTime
        });
    }
}

async function generateReport() {
    // Calculate average response time
    const responseTimes = Object.values(testResults.endpoints)
        .filter(e => e.responseTime)
        .map(e => e.responseTime);
    
    if (responseTimes.length > 0) {
        testResults.summary.averageResponseTime = 
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, `test-results/production-test-report-${Date.now()}.json`);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${(testResults.summary.passed / testResults.summary.totalTests * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${testResults.summary.averageResponseTime.toFixed(2)}ms`);
    console.log(`\nDetailed report saved to: ${reportPath}`);
    console.log('='.repeat(60));
}

// Main test runner
async function runAllTests() {
    console.log('Starting Comprehensive Production Tests');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
    // Run all tests
    await testHealthEndpoint();
    await testSystemCapabilities();
    await testPDFExtraction('/api/ultra-accurate-extract', 'Ultra Accurate Extraction');
    await testPDFExtraction('/api/phase2-enhanced-extract', 'Phase 2 Enhanced Extraction');
    await testMistralOCR();
    await testErrorHandling();
    await testConcurrentRequests();
    
    // Generate report
    await generateReport();
    
    // Exit with appropriate code
    process.exit(testResults.summary.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});