const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Configuration
const BASE_URL = 'https://pdf-fzzi.onrender.com';
const TEST_PDF_PATH = path.join(__dirname, 'Messos_Anlagestiftung_Full_Report.pdf');
const RESULTS_DIR = path.join(__dirname, 'test-results');
const TIMEOUT = 300000; // 5 minutes

// Test results storage
const testResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    tests: {},
    summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        averageTestTime: 0
    }
};

// Ensure results directory exists
fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Utility functions
function logTest(testName, status, details = {}) {
    const result = {
        status,
        timestamp: new Date().toISOString(),
        ...details
    };
    
    testResults.tests[testName] = result;
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
    if (details.duration) {
        console.log(`   Duration: ${details.duration.toFixed(2)}ms`);
    }
}

async function createBrowser() {
    return puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--allow-running-insecure-content'
        ],
        timeout: 60000
    });
}

async function testPageLoad() {
    const testName = 'Page Load Test';
    const startTime = performance.now();
    let browser, page;
    
    try {
        browser = await createBrowser();
        page = await browser.newPage();
        
        // Set viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Navigate to the page
        const response = await page.goto(BASE_URL, { 
            waitUntil: 'networkidle2',
            timeout: 60000 
        });
        
        const duration = performance.now() - startTime;
        
        // Check if page loaded successfully
        const status = response.status();
        const title = await page.title();
        
        // Take screenshot
        await page.screenshot({ 
            path: path.join(RESULTS_DIR, 'page-load.png'),
            fullPage: true 
        });
        
        if (status === 200) {
            logTest(testName, 'passed', {
                duration,
                pageTitle: title,
                httpStatus: status,
                url: BASE_URL
            });
        } else {
            logTest(testName, 'failed', {
                duration,
                error: `HTTP ${status}`,
                pageTitle: title
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            duration: performance.now() - startTime,
            error: error.message
        });
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

async function testFileUploadWorkflow() {
    const testName = 'File Upload Workflow';
    const startTime = performance.now();
    let browser, page;
    
    try {
        if (!fs.existsSync(TEST_PDF_PATH)) {
            logTest(testName, 'failed', {
                error: `Test PDF not found at ${TEST_PDF_PATH}`
            });
            return;
        }
        
        browser = await createBrowser();
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to the page
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Look for file input
        const fileInputSelectors = [
            'input[type="file"]',
            'input[accept*="pdf"]',
            'input[name*="pdf"]',
            'input[id*="upload"]'
        ];
        
        let fileInput = null;
        for (const selector of fileInputSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                fileInput = await page.$(selector);
                if (fileInput) break;
            } catch (e) {
                continue;
            }
        }
        
        if (fileInput) {
            // Upload the file
            await fileInput.uploadFile(TEST_PDF_PATH);
            console.log('   File uploaded successfully');
            
            // Wait for upload to be processed
            await page.waitForTimeout(2000);
            
            // Look for processing indicators
            const processingSelectors = [
                'text=processing',
                'text=analyzing',
                'text=uploading',
                '.spinner',
                '.loading',
                '.progress'
            ];
            
            let foundProcessing = false;
            for (const selector of processingSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    foundProcessing = true;
                    console.log(`   Found processing indicator: ${selector}`);
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            // Take screenshot after upload
            await page.screenshot({ 
                path: path.join(RESULTS_DIR, 'file-uploaded.png'),
                fullPage: true 
            });
            
            const duration = performance.now() - startTime;
            logTest(testName, 'passed', {
                duration,
                fileUploaded: true,
                processingDetected: foundProcessing
            });
        } else {
            // No file input found, check for drag-and-drop
            const dropZoneSelectors = [
                '.drop-zone',
                '.upload-area',
                '[data-testid="drop-zone"]',
                '.file-drop'
            ];
            
            let foundDropZone = false;
            for (const selector of dropZoneSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 5000 });
                    foundDropZone = true;
                    break;
                } catch (e) {
                    continue;
                }
            }
            
            await page.screenshot({ 
                path: path.join(RESULTS_DIR, 'no-file-input.png'),
                fullPage: true 
            });
            
            const duration = performance.now() - startTime;
            logTest(testName, foundDropZone ? 'passed' : 'failed', {
                duration,
                error: foundDropZone ? null : 'No file upload mechanism found',
                alternativeFound: foundDropZone ? 'Drop zone' : null
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            duration: performance.now() - startTime,
            error: error.message
        });
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

async function testAPIEndpointThroughUI() {
    const testName = 'API Endpoint Through UI';
    const startTime = performance.now();
    let browser, page;
    
    try {
        browser = await createBrowser();
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to demo or API testing page
        const testUrls = [
            `${BASE_URL}/demo`,
            `${BASE_URL}/live-demo.html`,
            `${BASE_URL}/test`,
            BASE_URL
        ];
        
        let successfulUrl = null;
        for (const url of testUrls) {
            try {
                const response = await page.goto(url, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
                if (response.status() === 200) {
                    successfulUrl = url;
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!successfulUrl) {
            throw new Error('No accessible test page found');
        }
        
        // Look for API test buttons or demo functionality
        const testButtons = [
            'button:contains("test")',
            'button:contains("demo")',
            'button:contains("extract")',
            'button:contains("process")',
            'button[onclick*="api"]',
            'input[type="submit"]'
        ];
        
        let foundButton = false;
        for (const selector of testButtons) {
            try {
                const button = await page.$(selector);
                if (button) {
                    await button.click();
                    foundButton = true;
                    console.log(`   Clicked test button: ${selector}`);
                    
                    // Wait for response
                    await page.waitForTimeout(5000);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // Look for results
        const resultSelectors = [
            '.results',
            '.output',
            '.response',
            'pre',
            'code',
            '.json'
        ];
        
        let foundResults = false;
        for (const selector of resultSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                foundResults = true;
                console.log(`   Found results: ${selector}`);
                break;
            } catch (e) {
                continue;
            }
        }
        
        // Take screenshot
        await page.screenshot({ 
            path: path.join(RESULTS_DIR, 'api-endpoint-test.png'),
            fullPage: true 
        });
        
        const duration = performance.now() - startTime;
        logTest(testName, foundButton || foundResults ? 'passed' : 'failed', {
            duration,
            accessibleUrl: successfulUrl,
            buttonFound: foundButton,
            resultsFound: foundResults
        });
    } catch (error) {
        logTest(testName, 'failed', {
            duration: performance.now() - startTime,
            error: error.message
        });
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

async function testRealTimeProcessingMonitoring() {
    const testName = 'Real-time Processing Monitoring';
    const startTime = performance.now();
    let browser, page;
    
    try {
        browser = await createBrowser();
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Set up console monitoring
        const consoleMessages = [];
        page.on('console', msg => {
            consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            });
        });
        
        // Set up network monitoring
        const networkRequests = [];
        page.on('request', request => {
            networkRequests.push({
                url: request.url(),
                method: request.method(),
                timestamp: Date.now()
            });
        });
        
        // Navigate to the page
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Try to trigger some processing
        if (fs.existsSync(TEST_PDF_PATH)) {
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.uploadFile(TEST_PDF_PATH);
                
                // Monitor for changes
                await page.waitForTimeout(10000);
                
                // Check for real-time updates
                const progressSelectors = [
                    '.progress',
                    '.status',
                    '.processing',
                    '.loading'
                ];
                
                let foundProgress = false;
                for (const selector of progressSelectors) {
                    try {
                        const element = await page.$(selector);
                        if (element) {
                            foundProgress = true;
                            break;
                        }
                    } catch (e) {
                        continue;
                    }
                }
                
                // Take screenshot
                await page.screenshot({ 
                    path: path.join(RESULTS_DIR, 'real-time-monitoring.png'),
                    fullPage: true 
                });
                
                const duration = performance.now() - startTime;
                logTest(testName, 'passed', {
                    duration,
                    consoleMessages: consoleMessages.length,
                    networkRequests: networkRequests.length,
                    progressIndicators: foundProgress,
                    monitoringData: {
                        console: consoleMessages.slice(-5), // Last 5 messages
                        network: networkRequests.slice(-3)  // Last 3 requests
                    }
                });
            } else {
                throw new Error('No file input found for monitoring test');
            }
        } else {
            // Monitor page activity without file upload
            await page.waitForTimeout(5000);
            
            const duration = performance.now() - startTime;
            logTest(testName, 'passed', {
                duration,
                consoleMessages: consoleMessages.length,
                networkRequests: networkRequests.length,
                note: 'Monitoring without file upload (no test PDF)'
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            duration: performance.now() - startTime,
            error: error.message
        });
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

async function testResultsValidation() {
    const testName = 'Results Validation';
    const startTime = performance.now();
    let browser, page;
    
    try {
        browser = await createBrowser();
        page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to the page
        await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
        
        // Try to get results from API demo
        if (fs.existsSync(TEST_PDF_PATH)) {
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.uploadFile(TEST_PDF_PATH);
                
                // Wait for processing to complete
                await page.waitForTimeout(30000);
                
                // Extract results from page
                const resultsData = await page.evaluate(() => {
                    // Look for various result containers
                    const selectors = [
                        '.results',
                        '.output',
                        'pre',
                        'code',
                        '.securities',
                        '.extracted-data'
                    ];
                    
                    for (const selector of selectors) {
                        const element = document.querySelector(selector);
                        if (element) {
                            const text = element.textContent || element.innerText;
                            try {
                                // Try to parse as JSON
                                return JSON.parse(text);
                            } catch {
                                // Return as text if not JSON
                                return { rawText: text };
                            }
                        }
                    }
                    return null;
                });
                
                // Validate results structure
                let validationPassed = false;
                if (resultsData) {
                    if (resultsData.securities && Array.isArray(resultsData.securities)) {
                        validationPassed = resultsData.securities.length > 0;
                    } else if (resultsData.rawText && resultsData.rawText.includes('ISIN')) {
                        validationPassed = true;
                    }
                }
                
                // Take screenshot
                await page.screenshot({ 
                    path: path.join(RESULTS_DIR, 'results-validation.png'),
                    fullPage: true 
                });
                
                const duration = performance.now() - startTime;
                logTest(testName, validationPassed ? 'passed' : 'failed', {
                    duration,
                    resultsFound: !!resultsData,
                    validationPassed,
                    resultsSample: resultsData ? JSON.stringify(resultsData).substring(0, 200) : null
                });
            } else {
                throw new Error('No file input found for validation test');
            }
        } else {
            // Try to find existing results on the page
            const hasResults = await page.evaluate(() => {
                const resultIndicators = ['ISIN', 'securities', 'extracted', 'total'];
                const pageText = document.body.textContent || document.body.innerText;
                return resultIndicators.some(indicator => 
                    pageText.toLowerCase().includes(indicator.toLowerCase())
                );
            });
            
            const duration = performance.now() - startTime;
            logTest(testName, hasResults ? 'passed' : 'failed', {
                duration,
                note: 'Validation without file upload (no test PDF)',
                hasResultIndicators: hasResults
            });
        }
    } catch (error) {
        logTest(testName, 'failed', {
            duration: performance.now() - startTime,
            error: error.message
        });
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

async function testMobileResponsiveness() {
    const testName = 'Mobile Responsiveness';
    const startTime = performance.now();
    let browser, page;
    
    try {
        browser = await createBrowser();
        page = await browser.newPage();
        
        // Test different mobile viewports
        const mobileViewports = [
            { width: 375, height: 667, name: 'iPhone SE' },
            { width: 414, height: 896, name: 'iPhone XR' },
            { width: 360, height: 640, name: 'Android' }
        ];
        
        let allTestsPassed = true;
        
        for (const viewport of mobileViewports) {
            await page.setViewport({ width: viewport.width, height: viewport.height });
            
            // Navigate to the page
            await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
            
            // Check if page is usable on mobile
            const isUsable = await page.evaluate(() => {
                // Check if content is visible and not cut off
                const body = document.body;
                const bodyRect = body.getBoundingClientRect();
                
                // Check for horizontal scrollbar (bad for mobile)
                const hasHorizontalScroll = body.scrollWidth > window.innerWidth;
                
                // Check for interactive elements
                const buttons = document.querySelectorAll('button, input, select');
                const hasInteractiveElements = buttons.length > 0;
                
                return {
                    hasHorizontalScroll,
                    hasInteractiveElements,
                    bodyWidth: bodyRect.width,
                    windowWidth: window.innerWidth
                };
            });
            
            // Take screenshot for this viewport
            await page.screenshot({ 
                path: path.join(RESULTS_DIR, `mobile-${viewport.name.replace(/\s+/g, '-')}.png`),
                fullPage: true 
            });
            
            if (isUsable.hasHorizontalScroll || !isUsable.hasInteractiveElements) {
                allTestsPassed = false;
            }
            
            console.log(`   ${viewport.name}: ${!isUsable.hasHorizontalScroll ? 'Good' : 'Issues'}`);
        }
        
        const duration = performance.now() - startTime;
        logTest(testName, allTestsPassed ? 'passed' : 'failed', {
            duration,
            testedViewports: mobileViewports.length,
            allViewportsWorking: allTestsPassed
        });
    } catch (error) {
        logTest(testName, 'failed', {
            duration: performance.now() - startTime,
            error: error.message
        });
    } finally {
        if (page) await page.close();
        if (browser) await browser.close();
    }
}

async function generateReport() {
    // Calculate average test time
    const testTimes = Object.values(testResults.tests)
        .filter(t => t.duration)
        .map(t => t.duration);
    
    if (testTimes.length > 0) {
        testResults.summary.averageTestTime = 
            testTimes.reduce((a, b) => a + b, 0) / testTimes.length;
    }
    
    // Save detailed report
    const reportPath = path.join(RESULTS_DIR, `puppeteer-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('PUPPETEER TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.summary.totalTests}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${(testResults.summary.passed / testResults.summary.totalTests * 100).toFixed(2)}%`);
    console.log(`Average Test Time: ${testResults.summary.averageTestTime.toFixed(2)}ms`);
    console.log(`\nDetailed report saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${RESULTS_DIR}`);
    console.log('='.repeat(60));
}

// Main test runner
async function runAllTests() {
    console.log('Starting Puppeteer Processing Tests');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
    // Run all tests
    await testPageLoad();
    await testFileUploadWorkflow();
    await testAPIEndpointThroughUI();
    await testRealTimeProcessingMonitoring();
    await testResultsValidation();
    await testMobileResponsiveness();
    
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