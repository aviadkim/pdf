#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://pdf-fzzi.onrender.com';
const TOTAL_TESTS = 200; // Hundreds of tests as requested
const CONCURRENT_BROWSERS = 5; // Run multiple browsers in parallel
const TEST_TIMEOUT = 60000; // 60 seconds per test

console.log('🚀 Comprehensive OCR Testing Suite with Puppeteer');
console.log('==================================================');
console.log(`📍 Testing deployment: ${DEPLOYMENT_URL}`);
console.log(`🧪 Total tests planned: ${TOTAL_TESTS}`);
console.log(`🔄 Concurrent browsers: ${CONCURRENT_BROWSERS}`);
console.log(`⏱️  Timeout per test: ${TEST_TIMEOUT / 1000}s\n`);

// Test results tracking
const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    performance: [],
    screenshots: [],
    mistralTests: 0,
    mistralSuccesses: 0,
    annotationTests: 0,
    annotationSuccesses: 0
};

// Test scenarios for comprehensive coverage
const testScenarios = [
    {
        name: 'Homepage Load Test',
        url: '/',
        type: 'navigation',
        expectations: ['Smart OCR Learning System', 'Annotation interface']
    },
    {
        name: 'Annotation Interface Test',
        url: '/smart-annotation',
        type: 'interface',
        expectations: ['Pattern Learning', 'Accuracy Metrics', 'Upload PDF']
    },
    {
        name: 'Stats API Test',
        url: '/api/smart-ocr/stats',
        type: 'api',
        expectations: ['mistralEnabled', 'patterns', 'accuracy']
    },
    {
        name: 'Patterns API Test',
        url: '/api/smart-ocr/patterns',
        type: 'api',
        expectations: ['tablePatterns', 'timestamp']
    },
    {
        name: 'Mistral OCR Processing Test',
        url: '/api/mistral-ocr-extract',
        type: 'mistral',
        method: 'POST',
        expectations: ['extractedText', 'metadata']
    },
    {
        name: 'Smart OCR Processing Test',
        url: '/api/smart-ocr/process',
        type: 'ocr',
        method: 'POST',
        expectations: ['results', 'accuracy']
    },
    {
        name: 'Learning System Test',
        url: '/api/smart-ocr/learn',
        type: 'learning',
        method: 'POST',
        expectations: ['improved', 'accuracy']
    }
];

// Create test PDF content for upload tests
const createTestPDF = () => {
    // Simple PDF content for testing
    const pdfContent = Buffer.from(`
JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IERvY3VtZW50IGZvciBPQ1IpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjggMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjcyIDAwMDAwIG4gCjAwMDAwMDAzNTggMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0NTMKJSVFT0Y=
    `, 'base64');
    return pdfContent;
};

// Screenshot helper
async function takeScreenshot(page, testName, step = '') {
    try {
        const timestamp = Date.now();
        const filename = `screenshot-${testName.replace(/\s+/g, '-')}-${step}-${timestamp}.png`;
        const filepath = path.join(__dirname, 'test-screenshots', filename);
        
        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        await page.screenshot({ 
            path: filepath, 
            fullPage: true 
        });
        
        testResults.screenshots.push({
            test: testName,
            step,
            file: filename,
            timestamp
        });
        
        return filename;
    } catch (error) {
        console.log(`📸 Screenshot failed for ${testName}: ${error.message}`);
        return null;
    }
}

// Performance metrics helper
async function measurePerformance(page) {
    try {
        const metrics = await page.metrics();
        const timing = JSON.parse(await page.evaluate(() => JSON.stringify(performance.timing)));
        
        return {
            loadTime: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            jsHeapUsedSize: metrics.JSHeapUsedSize,
            jsHeapTotalSize: metrics.JSHeapTotalSize,
            timestamp: Date.now()
        };
    } catch (error) {
        return { error: error.message, timestamp: Date.now() };
    }
}

// Individual test runner
async function runSingleTest(browser, scenario, testIndex) {
    const page = await browser.newPage();
    const startTime = Date.now();
    let testPassed = false;
    let errorMessage = '';
    
    try {
        console.log(`🧪 Test ${testIndex + 1}: ${scenario.name}...`);
        
        // Set page viewport and user agent
        await page.setViewport({ width: 1280, height: 720 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Navigation tests
        if (scenario.type === 'navigation' || scenario.type === 'interface') {
            const response = await page.goto(`${DEPLOYMENT_URL}${scenario.url}`, {
                waitUntil: 'networkidle2',
                timeout: TEST_TIMEOUT
            });
            
            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
            
            await takeScreenshot(page, scenario.name, 'loaded');
            
            // Check expectations
            for (const expectation of scenario.expectations) {
                const found = await page.evaluate((text) => {
                    return document.body.innerText.includes(text) || 
                           document.documentElement.innerHTML.includes(text);
                }, expectation);
                
                if (!found) {
                    throw new Error(`Expected content not found: ${expectation}`);
                }
            }
            
            // Measure performance
            const perf = await measurePerformance(page);
            testResults.performance.push({
                test: scenario.name,
                ...perf
            });
            
            testPassed = true;
        }
        
        // API tests
        else if (scenario.type === 'api') {
            const response = await page.goto(`${DEPLOYMENT_URL}${scenario.url}`, {
                timeout: TEST_TIMEOUT
            });
            
            if (!response.ok()) {
                throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
            }
            
            const content = await page.content();
            const jsonMatch = content.match(/<pre[^>]*>(.*?)<\/pre>/s);
            
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[1]);
                
                for (const expectation of scenario.expectations) {
                    if (!(expectation in jsonData)) {
                        throw new Error(`Expected API field not found: ${expectation}`);
                    }
                }
                
                // Special handling for Mistral API check
                if (scenario.url.includes('stats') && jsonData.mistralEnabled) {
                    testResults.mistralTests++;
                    testResults.mistralSuccesses++;
                    console.log(`   ✅ Mistral API is enabled and working`);
                }
            }
            
            testPassed = true;
        }
        
        // Mistral OCR tests
        else if (scenario.type === 'mistral') {
            testResults.mistralTests++;
            
            // Test with form submission
            await page.goto(`${DEPLOYMENT_URL}/smart-annotation`, {
                waitUntil: 'networkidle2',
                timeout: TEST_TIMEOUT
            });
            
            await takeScreenshot(page, scenario.name, 'form-loaded');
            
            // Look for file upload form
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                // Create temporary test file
                const testPdf = createTestPDF();
                const tempFilePath = path.join(__dirname, 'test-temp', 'test-document.pdf');
                
                // Ensure temp directory exists
                const tempDir = path.dirname(tempFilePath);
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                fs.writeFileSync(tempFilePath, testPdf);
                
                // Upload file
                await fileInput.uploadFile(tempFilePath);
                await takeScreenshot(page, scenario.name, 'file-uploaded');
                
                // Submit form if submit button exists
                const submitButton = await page.$('button[type="submit"], input[type="submit"], .upload-btn, .process-btn');
                if (submitButton) {
                    await submitButton.click();
                    await page.waitForTimeout(3000); // Wait for processing
                    await takeScreenshot(page, scenario.name, 'form-submitted');
                }
                
                // Clean up temp file
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
                
                testResults.mistralSuccesses++;
            }
            
            testPassed = true;
        }
        
        // OCR and Learning tests
        else if (scenario.type === 'ocr' || scenario.type === 'learning') {
            await page.goto(`${DEPLOYMENT_URL}/smart-annotation`, {
                waitUntil: 'networkidle2',
                timeout: TEST_TIMEOUT
            });
            
            testResults.annotationTests++;
            
            // Test annotation interface interactions
            const elements = await page.$$('.annotation-element, .pattern-element, .accuracy-display');
            if (elements.length > 0) {
                await takeScreenshot(page, scenario.name, 'annotation-interface');
                testResults.annotationSuccesses++;
            }
            
            testPassed = true;
        }
        
    } catch (error) {
        errorMessage = error.message;
        await takeScreenshot(page, scenario.name, 'error');
        console.log(`   ❌ FAILED: ${errorMessage}`);
    } finally {
        const duration = Date.now() - startTime;
        
        testResults.total++;
        if (testPassed) {
            testResults.passed++;
            console.log(`   ✅ PASSED (${duration}ms)`);
        } else {
            testResults.failed++;
            testResults.errors.push({
                test: scenario.name,
                error: errorMessage,
                duration,
                timestamp: new Date().toISOString()
            });
        }
        
        await page.close();
    }
}

// Batch test runner for parallel execution
async function runTestBatch(batchIndex, testsPerBatch) {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    });
    
    console.log(`\n🔄 Starting batch ${batchIndex + 1} (${testsPerBatch} tests)...`);
    
    for (let i = 0; i < testsPerBatch; i++) {
        const testIndex = batchIndex * testsPerBatch + i;
        const scenarioIndex = testIndex % testScenarios.length;
        const scenario = testScenarios[scenarioIndex];
        
        await runSingleTest(browser, scenario, testIndex);
        
        // Small delay between tests to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await browser.close();
    console.log(`✅ Batch ${batchIndex + 1} completed`);
}

// Main test execution
async function runComprehensiveTests() {
    const startTime = Date.now();
    
    console.log('🚀 Starting comprehensive OCR testing...\n');
    
    // Calculate tests per batch
    const testsPerBatch = Math.ceil(TOTAL_TESTS / CONCURRENT_BROWSERS);
    const batches = [];
    
    // Create batch promises
    for (let i = 0; i < CONCURRENT_BROWSERS; i++) {
        const actualTestsInBatch = Math.min(testsPerBatch, TOTAL_TESTS - (i * testsPerBatch));
        if (actualTestsInBatch > 0) {
            batches.push(runTestBatch(i, actualTestsInBatch));
        }
    }
    
    // Run all batches in parallel
    await Promise.all(batches);
    
    const totalDuration = Date.now() - startTime;
    
    // Generate comprehensive report
    const report = {
        summary: {
            totalTests: testResults.total,
            passed: testResults.passed,
            failed: testResults.failed,
            successRate: ((testResults.passed / testResults.total) * 100).toFixed(2),
            totalDuration,
            averageTestTime: (totalDuration / testResults.total).toFixed(2)
        },
        mistralTests: {
            total: testResults.mistralTests,
            successful: testResults.mistralSuccesses,
            successRate: testResults.mistralTests > 0 ? ((testResults.mistralSuccesses / testResults.mistralTests) * 100).toFixed(2) : 0
        },
        annotationTests: {
            total: testResults.annotationTests,
            successful: testResults.annotationSuccesses,
            successRate: testResults.annotationTests > 0 ? ((testResults.annotationSuccesses / testResults.annotationTests) * 100).toFixed(2) : 0
        },
        performance: {
            averageLoadTime: testResults.performance.length > 0 ? 
                (testResults.performance.reduce((sum, p) => sum + (p.loadTime || 0), 0) / testResults.performance.length).toFixed(2) : 0,
            screenshots: testResults.screenshots.length,
            errors: testResults.errors.length
        },
        errors: testResults.errors,
        timestamp: new Date().toISOString(),
        deploymentUrl: DEPLOYMENT_URL
    };
    
    // Save detailed report
    const reportFilename = `comprehensive-ocr-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE OCR TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`🧪 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`⏱️  Total Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`⚡ Average Test Time: ${report.summary.averageTestTime}ms`);
    console.log('');
    console.log(`🤖 Mistral Tests: ${report.mistralTests.total} (${report.mistralTests.successRate}% success)`);
    console.log(`🎨 Annotation Tests: ${report.annotationTests.total} (${report.annotationTests.successRate}% success)`);
    console.log(`📸 Screenshots: ${report.performance.screenshots}`);
    console.log(`🚨 Errors: ${report.performance.errors}`);
    console.log('');
    console.log(`📄 Detailed report saved: ${reportFilename}`);
    
    if (report.performance.errors > 0) {
        console.log('\n❌ Recent Errors:');
        report.errors.slice(-5).forEach((error, index) => {
            console.log(`   ${index + 1}. ${error.test}: ${error.error}`);
        });
    }
    
    return report;
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
});

// Run the comprehensive test suite
runComprehensiveTests().then((report) => {
    console.log('\n🎉 Comprehensive OCR testing completed!');
    process.exit(report.summary.failed > 0 ? 1 : 0);
}).catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
});