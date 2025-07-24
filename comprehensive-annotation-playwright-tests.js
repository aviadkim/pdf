#!/usr/bin/env node

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://pdf-fzzi.onrender.com';
const TOTAL_TESTS = 300; // Even more tests for annotation system
const BROWSERS = ['chromium', 'firefox', 'webkit']; // Test across all browsers
const CONCURRENT_CONTEXTS = 3; // Multiple contexts per browser
const TEST_TIMEOUT = 90000; // 90 seconds for complex annotation tests

console.log('🎭 Comprehensive Annotation Testing Suite with Playwright');
console.log('=======================================================');
console.log(`📍 Testing deployment: ${DEPLOYMENT_URL}`);
console.log(`🧪 Total tests planned: ${TOTAL_TESTS}`);
console.log(`🌐 Browsers: ${BROWSERS.join(', ')}`);
console.log(`🔄 Concurrent contexts: ${CONCURRENT_CONTEXTS}`);
console.log(`⏱️  Timeout per test: ${TEST_TIMEOUT / 1000}s\n`);

// Global test results
const globalResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: [],
    screenshots: [],
    videos: [],
    performance: [],
    accessibility: [],
    browserResults: {},
    annotationWorkflows: 0,
    annotationSuccesses: 0,
    mistralIntegrations: 0,
    mistralSuccesses: 0,
    learningCycles: 0,
    learningImprovements: 0
};

// Initialize browser results tracking
BROWSERS.forEach(browser => {
    globalResults.browserResults[browser] = {
        total: 0,
        passed: 0,
        failed: 0,
        avgPerformance: 0
    };
});

// Comprehensive test scenarios for annotation system
const annotationTestScenarios = [
    {
        name: 'Homepage Accessibility Check',
        category: 'accessibility',
        url: '/',
        actions: ['checkAccessibility', 'checkKeyboardNavigation']
    },
    {
        name: 'Annotation Interface Load Test',
        category: 'interface',
        url: '/smart-annotation',
        actions: ['verifyElements', 'checkResponsiveness', 'measurePerformance']
    },
    {
        name: 'PDF Upload Workflow Test',
        category: 'workflow',
        url: '/smart-annotation',
        actions: ['uploadPDF', 'processDocument', 'verifyResults']
    },
    {
        name: 'Pattern Learning Simulation',
        category: 'learning',
        url: '/smart-annotation',
        actions: ['simulateAnnotation', 'verifyLearning', 'checkImprovement']
    },
    {
        name: 'Mistral OCR Integration Test',
        category: 'mistral',
        url: '/smart-annotation',
        actions: ['testMistralAPI', 'verifyOCRResults', 'checkAccuracy']
    },
    {
        name: 'Stats API Comprehensive Test',
        category: 'api',
        url: '/api/smart-ocr/stats',
        actions: ['verifyAPIResponse', 'checkDataIntegrity', 'validateMetrics']
    },
    {
        name: 'Patterns API Deep Test',
        category: 'api',
        url: '/api/smart-ocr/patterns',
        actions: ['verifyPatterns', 'checkTimestamp', 'validateStructure']
    },
    {
        name: 'Interactive Annotation Test',
        category: 'interaction',
        url: '/smart-annotation',
        actions: ['clickElements', 'fillForms', 'triggerEvents']
    },
    {
        name: 'Mobile Responsiveness Test',
        category: 'responsive',
        url: '/smart-annotation',
        actions: ['testMobileView', 'checkTouch', 'verifyLayout']
    },
    {
        name: 'Performance Stress Test',
        category: 'performance',
        url: '/smart-annotation',
        actions: ['loadMultipleResources', 'measureLoadTime', 'checkMemoryUsage']
    },
    {
        name: 'Error Handling Test',
        category: 'error',
        url: '/smart-annotation',
        actions: ['triggerErrors', 'checkErrorMessages', 'verifyRecovery']
    },
    {
        name: 'Learning Progress Test',
        category: 'learning',
        url: '/smart-annotation',
        actions: ['trackProgress', 'verifyImprovement', 'checkPersistence']
    }
];

// Generate synthetic PDF for testing
function createTestPDFBuffer() {
    const pdfContent = `
%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
/MediaBox [0 0 612 792]
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj
4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
5 0 obj
<<
/Length 80
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Document for Annotation Learning System) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000068 00000 n 
0000000157 00000 n 
0000000272 00000 n 
0000000358 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
489
%%EOF`;
    return Buffer.from(pdfContent);
}

// Screenshot and video capture helpers
async function captureScreenshot(page, testName, step, browser) {
    try {
        const timestamp = Date.now();
        const filename = `${browser}-${testName.replace(/\s+/g, '-')}-${step}-${timestamp}.png`;
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
        
        globalResults.screenshots.push({
            test: testName,
            step,
            browser,
            file: filename,
            timestamp
        });
        
        return filename;
    } catch (error) {
        console.log(`📸 Screenshot failed: ${error.message}`);
        return null;
    }
}

// Performance measurement
async function measurePagePerformance(page) {
    try {
        const metrics = await page.evaluate(() => {
            const perf = performance.timing;
            return {
                loadTime: perf.loadEventEnd - perf.navigationStart,
                domContentLoaded: perf.domContentLoadedEventEnd - perf.navigationStart,
                firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime || 0,
                firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
                resources: performance.getEntriesByType('resource').length
            };
        });
        
        return metrics;
    } catch (error) {
        return { error: error.message };
    }
}

// Accessibility testing
async function checkAccessibility(page) {
    try {
        const accessibilityIssues = await page.evaluate(() => {
            const issues = [];
            
            // Check for missing alt text
            const images = document.querySelectorAll('img');
            images.forEach((img, index) => {
                if (!img.alt) {
                    issues.push(`Image ${index + 1} missing alt text`);
                }
            });
            
            // Check for missing form labels
            const inputs = document.querySelectorAll('input, textarea, select');
            inputs.forEach((input, index) => {
                if (!input.labels || input.labels.length === 0) {
                    issues.push(`Form element ${index + 1} missing label`);
                }
            });
            
            // Check heading hierarchy
            const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
            let lastLevel = 0;
            headings.forEach((heading, index) => {
                const level = parseInt(heading.tagName.substring(1));
                if (level > lastLevel + 1) {
                    issues.push(`Heading hierarchy skip at heading ${index + 1}`);
                }
                lastLevel = level;
            });
            
            return issues;
        });
        
        return accessibilityIssues;
    } catch (error) {
        return [`Accessibility check failed: ${error.message}`];
    }
}

// Test action implementations
const testActions = {
    async checkAccessibility(page, context) {
        const issues = await checkAccessibility(page);
        globalResults.accessibility.push({
            test: context.testName,
            browser: context.browser,
            issues,
            timestamp: Date.now()
        });
        return issues.length === 0;
    },
    
    async checkKeyboardNavigation(page, context) {
        try {
            // Test Tab navigation
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
            
            const focusedElement = await page.evaluate(() => {
                return document.activeElement ? document.activeElement.tagName : null;
            });
            
            return focusedElement !== null;
        } catch (error) {
            return false;
        }
    },
    
    async verifyElements(page, context) {
        try {
            // Check for key annotation interface elements
            const elements = await page.evaluate(() => {
                const selectors = [
                    '.annotation-interface', '.upload-area', '.pattern-display',
                    '.accuracy-metrics', '.learning-progress', 'input[type="file"]'
                ];
                
                const found = {};
                selectors.forEach(selector => {
                    found[selector] = document.querySelector(selector) !== null;
                });
                
                return found;
            });
            
            const foundCount = Object.values(elements).filter(Boolean).length;
            return foundCount >= 3; // At least 3 key elements should be present
        } catch (error) {
            return false;
        }
    },
    
    async checkResponsiveness(page, context) {
        try {
            // Test different viewport sizes
            const viewports = [
                { width: 1920, height: 1080 }, // Desktop
                { width: 768, height: 1024 },  // Tablet
                { width: 375, height: 667 }    // Mobile
            ];
            
            let responsive = true;
            
            for (const viewport of viewports) {
                await page.setViewportSize(viewport);
                await page.waitForTimeout(500);
                
                const layout = await page.evaluate(() => {
                    const body = document.body;
                    return {
                        hasHorizontalScroll: body.scrollWidth > body.clientWidth,
                        hasOverflow: getComputedStyle(body).overflow !== 'visible'
                    };
                });
                
                if (layout.hasHorizontalScroll && viewport.width < 768) {
                    responsive = false;
                }
            }
            
            return responsive;
        } catch (error) {
            return false;
        }
    },
    
    async measurePerformance(page, context) {
        try {
            const metrics = await measurePagePerformance(page);
            globalResults.performance.push({
                test: context.testName,
                browser: context.browser,
                ...metrics,
                timestamp: Date.now()
            });
            
            return metrics.loadTime < 5000; // Less than 5 seconds is good
        } catch (error) {
            return false;
        }
    },
    
    async uploadPDF(page, context) {
        try {
            globalResults.annotationWorkflows++;
            
            // Look for file upload input
            const fileInput = await page.locator('input[type="file"]').first();
            if (await fileInput.count() === 0) {
                return false;
            }
            
            // Create temporary test PDF file
            const testPdf = createTestPDFBuffer();
            const tempFilePath = path.join(__dirname, 'test-temp', 'annotation-test.pdf');
            
            // Ensure temp directory exists
            const tempDir = path.dirname(tempFilePath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            fs.writeFileSync(tempFilePath, testPdf);
            
            // Upload the file
            await fileInput.setInputFiles(tempFilePath);
            await captureScreenshot(page, context.testName, 'file-uploaded', context.browser);
            
            // Clean up
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            
            return true;
        } catch (error) {
            return false;
        }
    },
    
    async processDocument(page, context) {
        try {
            // Look for process/submit button
            const processButton = page.locator('button:has-text("Process"), button:has-text("Submit"), .process-btn, .upload-btn').first();
            
            if (await processButton.count() > 0) {
                await processButton.click();
                await page.waitForTimeout(3000); // Wait for processing
                await captureScreenshot(page, context.testName, 'document-processed', context.browser);
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    },
    
    async verifyResults(page, context) {
        try {
            // Check for results indicators
            const hasResults = await page.evaluate(() => {
                const indicators = [
                    '.results', '.extracted-text', '.accuracy-display',
                    '.pattern-results', '.ocr-output'
                ];
                
                return indicators.some(selector => 
                    document.querySelector(selector) !== null
                );
            });
            
            if (hasResults) {
                globalResults.annotationSuccesses++;
            }
            
            return hasResults;
        } catch (error) {
            return false;
        }
    },
    
    async simulateAnnotation(page, context) {
        try {
            globalResults.learningCycles++;
            
            // Simulate annotation interactions
            const annotationElements = await page.locator('.annotation-element, .pattern-element, [data-annotation]').all();
            
            if (annotationElements.length > 0) {
                // Click on annotation elements
                for (let i = 0; i < Math.min(3, annotationElements.length); i++) {
                    await annotationElements[i].click();
                    await page.waitForTimeout(200);
                }
                
                await captureScreenshot(page, context.testName, 'annotation-simulated', context.browser);
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    },
    
    async verifyLearning(page, context) {
        try {
            // Check for learning indicators
            const learningActive = await page.evaluate(() => {
                const indicators = [
                    '.learning-progress', '.accuracy-improvement',
                    '.pattern-learned', '.improvement-metric'
                ];
                
                return indicators.some(selector => {
                    const element = document.querySelector(selector);
                    return element && element.textContent.length > 0;
                });
            });
            
            return learningActive;
        } catch (error) {
            return false;
        }
    },
    
    async checkImprovement(page, context) {
        try {
            // Look for accuracy improvements
            const improvement = await page.evaluate(() => {
                const accuracyElements = document.querySelectorAll('.accuracy, .improvement, [data-accuracy]');
                
                for (const element of accuracyElements) {
                    const text = element.textContent;
                    const percentMatch = text.match(/(\d+(?:\.\d+)?)%/);
                    if (percentMatch) {
                        const percentage = parseFloat(percentMatch[1]);
                        if (percentage > 85) { // Good accuracy threshold
                            return true;
                        }
                    }
                }
                
                return false;
            });
            
            if (improvement) {
                globalResults.learningImprovements++;
            }
            
            return improvement;
        } catch (error) {
            return false;
        }
    },
    
    async testMistralAPI(page, context) {
        try {
            globalResults.mistralIntegrations++;
            
            // Check if Mistral is enabled via stats API
            const response = await page.goto(`${DEPLOYMENT_URL}/api/smart-ocr/stats`);
            
            if (response.ok()) {
                const content = await page.textContent('body');
                const data = JSON.parse(content);
                
                if (data.mistralEnabled) {
                    globalResults.mistralSuccesses++;
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    },
    
    async verifyOCRResults(page, context) {
        try {
            // Navigate back to annotation interface
            await page.goto(`${DEPLOYMENT_URL}/smart-annotation`);
            
            // Look for OCR result indicators
            const hasOCRResults = await page.evaluate(() => {
                const ocrIndicators = [
                    '.ocr-result', '.extracted-text', '.text-output',
                    '.mistral-result', '.processing-result'
                ];
                
                return ocrIndicators.some(selector => 
                    document.querySelector(selector) !== null
                );
            });
            
            return hasOCRResults;
        } catch (error) {
            return false;
        }
    },
    
    async checkAccuracy(page, context) {
        try {
            // Check for accuracy metrics
            const accuracy = await page.evaluate(() => {
                const text = document.body.textContent;
                const accuracyMatch = text.match(/accuracy[:\s]*(\d+(?:\.\d+)?)%/i);
                
                if (accuracyMatch) {
                    return parseFloat(accuracyMatch[1]) > 80; // 80%+ accuracy is good
                }
                
                return false;
            });
            
            return accuracy;
        } catch (error) {
            return false;
        }
    },
    
    // Additional action implementations...
    async verifyAPIResponse(page, context) {
        try {
            const content = await page.textContent('body');
            const data = JSON.parse(content);
            return typeof data === 'object' && data !== null;
        } catch (error) {
            return false;
        }
    },
    
    async checkDataIntegrity(page, context) {
        try {
            const content = await page.textContent('body');
            const data = JSON.parse(content);
            
            // Check for expected data structure
            const hasExpectedFields = 'accuracy' in data || 'patterns' in data || 'mistralEnabled' in data;
            return hasExpectedFields;
        } catch (error) {
            return false;
        }
    },
    
    async validateMetrics(page, context) {
        try {
            const content = await page.textContent('body');
            const data = JSON.parse(content);
            
            // Validate numeric metrics
            if (typeof data.accuracy === 'number' && data.accuracy >= 0 && data.accuracy <= 100) {
                return true;
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
};

// Run individual test
async function runAnnotationTest(browser, browserName, scenario, testIndex) {
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: {
            dir: path.join(__dirname, 'test-videos'),
            size: { width: 1280, height: 720 }
        }
    });
    
    const page = await context.newPage();
    const startTime = Date.now();
    let testPassed = false;
    let errorMessage = '';
    
    try {
        console.log(`🧪 ${browserName} Test ${testIndex + 1}: ${scenario.name}...`);
        
        // Navigate to test URL
        await page.goto(`${DEPLOYMENT_URL}${scenario.url}`, {
            waitUntil: 'networkidle',
            timeout: TEST_TIMEOUT
        });
        
        await captureScreenshot(page, scenario.name, 'loaded', browserName);
        
        // Execute test actions
        const actionResults = [];
        const testContext = { testName: scenario.name, browser: browserName };
        
        for (const actionName of scenario.actions) {
            if (testActions[actionName]) {
                const result = await testActions[actionName](page, testContext);
                actionResults.push({ action: actionName, success: result });
            }
        }
        
        // Test passes if at least 70% of actions succeed
        const successfulActions = actionResults.filter(r => r.success).length;
        const successRate = successfulActions / actionResults.length;
        testPassed = successRate >= 0.7;
        
        if (!testPassed) {
            errorMessage = `Low success rate: ${(successRate * 100).toFixed(1)}% (${successfulActions}/${actionResults.length})`;
        }
        
    } catch (error) {
        errorMessage = error.message;
        await captureScreenshot(page, scenario.name, 'error', browserName);
    } finally {
        const duration = Date.now() - startTime;
        
        // Update results
        globalResults.total++;
        globalResults.browserResults[browserName].total++;
        
        if (testPassed) {
            globalResults.passed++;
            globalResults.browserResults[browserName].passed++;
            console.log(`   ✅ PASSED (${duration}ms)`);
        } else {
            globalResults.failed++;
            globalResults.browserResults[browserName].failed++;
            globalResults.errors.push({
                test: scenario.name,
                browser: browserName,
                error: errorMessage,
                duration,
                timestamp: new Date().toISOString()
            });
            console.log(`   ❌ FAILED: ${errorMessage} (${duration}ms)`);
        }
        
        await context.close();
    }
}

// Run tests for a specific browser
async function runBrowserTests(browserName) {
    console.log(`\n🌐 Starting ${browserName} tests...`);
    
    let browser;
    try {
        // Launch browser
        switch (browserName) {
            case 'chromium':
                browser = await chromium.launch({ headless: true });
                break;
            case 'firefox':
                browser = await firefox.launch({ headless: true });
                break;
            case 'webkit':
                browser = await webkit.launch({ headless: true });
                break;
        }
        
        const testsPerBrowser = Math.ceil(TOTAL_TESTS / BROWSERS.length);
        const batches = [];
        
        // Create concurrent test batches
        for (let batch = 0; batch < CONCURRENT_CONTEXTS; batch++) {
            const testsInBatch = Math.ceil(testsPerBrowser / CONCURRENT_CONTEXTS);
            const batchPromises = [];
            
            for (let i = 0; i < testsInBatch; i++) {
                const testIndex = batch * testsInBatch + i;
                if (testIndex < testsPerBrowser) {
                    const scenarioIndex = testIndex % annotationTestScenarios.length;
                    const scenario = annotationTestScenarios[scenarioIndex];
                    
                    batchPromises.push(
                        runAnnotationTest(browser, browserName, scenario, testIndex)
                    );
                }
            }
            
            batches.push(Promise.all(batchPromises));
        }
        
        // Wait for all batches to complete
        await Promise.all(batches);
        
    } catch (error) {
        console.error(`❌ ${browserName} testing failed:`, error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
        console.log(`✅ ${browserName} tests completed`);
    }
}

// Main test execution
async function runComprehensiveAnnotationTests() {
    const startTime = Date.now();
    
    console.log('🚀 Starting comprehensive annotation testing...\n');
    
    // Run tests across all browsers in parallel
    const browserPromises = BROWSERS.map(browserName => runBrowserTests(browserName));
    await Promise.all(browserPromises);
    
    const totalDuration = Date.now() - startTime;
    
    // Calculate browser-specific success rates
    Object.keys(globalResults.browserResults).forEach(browser => {
        const results = globalResults.browserResults[browser];
        results.successRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;
        
        const browserPerf = globalResults.performance.filter(p => p.browser === browser);
        results.avgPerformance = browserPerf.length > 0 ? 
            (browserPerf.reduce((sum, p) => sum + (p.loadTime || 0), 0) / browserPerf.length).toFixed(2) : 0;
    });
    
    // Generate comprehensive report
    const report = {
        summary: {
            totalTests: globalResults.total,
            passed: globalResults.passed,
            failed: globalResults.failed,
            successRate: ((globalResults.passed / globalResults.total) * 100).toFixed(2),
            totalDuration,
            averageTestTime: (totalDuration / globalResults.total).toFixed(2)
        },
        browserResults: globalResults.browserResults,
        annotationWorkflows: {
            total: globalResults.annotationWorkflows,
            successful: globalResults.annotationSuccesses,
            successRate: globalResults.annotationWorkflows > 0 ? 
                ((globalResults.annotationSuccesses / globalResults.annotationWorkflows) * 100).toFixed(2) : 0
        },
        mistralIntegration: {
            total: globalResults.mistralIntegrations,
            successful: globalResults.mistralSuccesses,
            successRate: globalResults.mistralIntegrations > 0 ? 
                ((globalResults.mistralSuccesses / globalResults.mistralIntegrations) * 100).toFixed(2) : 0
        },
        learningSystem: {
            cycles: globalResults.learningCycles,
            improvements: globalResults.learningImprovements,
            improvementRate: globalResults.learningCycles > 0 ? 
                ((globalResults.learningImprovements / globalResults.learningCycles) * 100).toFixed(2) : 0
        },
        quality: {
            screenshots: globalResults.screenshots.length,
            videos: globalResults.videos.length,
            accessibilityIssues: globalResults.accessibility.reduce((sum, a) => sum + a.issues.length, 0),
            performanceTests: globalResults.performance.length,
            averageLoadTime: globalResults.performance.length > 0 ? 
                (globalResults.performance.reduce((sum, p) => sum + (p.loadTime || 0), 0) / globalResults.performance.length).toFixed(2) : 0
        },
        errors: globalResults.errors,
        timestamp: new Date().toISOString(),
        deploymentUrl: DEPLOYMENT_URL
    };
    
    // Save comprehensive report
    const reportFilename = `comprehensive-annotation-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
    
    // Print detailed summary
    console.log('\n' + '='.repeat(70));
    console.log('🎭 COMPREHENSIVE ANNOTATION TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`🧪 Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📈 Overall Success Rate: ${report.summary.successRate}%`);
    console.log(`⏱️  Total Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`⚡ Average Test Time: ${report.summary.averageTestTime}ms`);
    console.log('');
    
    // Browser-specific results
    console.log('🌐 Browser Results:');
    Object.entries(report.browserResults).forEach(([browser, results]) => {
        console.log(`   ${browser}: ${results.passed}/${results.total} (${results.successRate}%) - Avg Load: ${results.avgPerformance}ms`);
    });
    console.log('');
    
    // Feature-specific results
    console.log(`🎨 Annotation Workflows: ${report.annotationWorkflows.total} (${report.annotationWorkflows.successRate}% success)`);
    console.log(`🤖 Mistral Integration: ${report.mistralIntegration.total} (${report.mistralIntegration.successRate}% success)`);
    console.log(`📚 Learning System: ${report.learningSystem.cycles} cycles (${report.learningSystem.improvementRate}% improvement)`);
    console.log('');
    
    // Quality metrics
    console.log(`📸 Screenshots: ${report.quality.screenshots}`);
    console.log(`🎥 Videos: ${report.quality.videos}`);
    console.log(`♿ Accessibility Issues: ${report.quality.accessibilityIssues}`);
    console.log(`⚡ Average Load Time: ${report.quality.averageLoadTime}ms`);
    console.log(`🚨 Total Errors: ${globalResults.errors.length}`);
    console.log('');
    console.log(`📄 Detailed report saved: ${reportFilename}`);
    
    if (globalResults.errors.length > 0) {
        console.log('\n❌ Recent Errors:');
        globalResults.errors.slice(-5).forEach((error, index) => {
            console.log(`   ${index + 1}. [${error.browser}] ${error.test}: ${error.error}`);
        });
    }
    
    return report;
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
});

// Run the comprehensive annotation test suite
runComprehensiveAnnotationTests().then((report) => {
    console.log('\n🎉 Comprehensive annotation testing completed!');
    process.exit(report.summary.failed > 0 ? 1 : 0);
}).catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
});