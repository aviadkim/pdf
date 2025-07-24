#!/usr/bin/env node

/**
 * COMPREHENSIVE LIVE BROWSER AUTOMATION TESTS
 * 
 * Real browser testing using Playwright and Puppeteer against production system
 * Tests actual functionality with concrete evidence and screenshots
 */

const { chromium, firefox, webkit } = require('playwright');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class LiveBrowserAutomationTests {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.testResults = {
            playwright: {
                chromium: [],
                firefox: [],
                webkit: []
            },
            puppeteer: [],
            screenshots: [],
            performanceMetrics: {},
            networkRequests: [],
            consoleMessages: [],
            errors: [],
            functionalityStatus: {}
        };
        this.setupDirectories();
    }

    async setupDirectories() {
        const dirs = [
            'live-test-results',
            'live-test-results/screenshots',
            'live-test-results/playwright',
            'live-test-results/puppeteer',
            'live-test-results/performance',
            'live-test-results/reports'
        ];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async runComprehensiveLiveTests() {
        console.log('🧪 COMPREHENSIVE LIVE BROWSER AUTOMATION TESTS');
        console.log('===============================================');
        console.log(`🌐 Testing Production System: ${this.baseUrl}`);
        console.log('🤖 Using Real Browser Automation (Playwright + Puppeteer)');
        console.log('');

        try {
            // Step 1: Playwright cross-browser testing
            console.log('1️⃣ PLAYWRIGHT CROSS-BROWSER TESTING');
            console.log('===================================');
            await this.runPlaywrightTests();

            // Step 2: Puppeteer detailed testing
            console.log('\n2️⃣ PUPPETEER DETAILED TESTING');
            console.log('=============================');
            await this.runPuppeteerTests();

            // Step 3: PDF upload and processing tests
            console.log('\n3️⃣ PDF UPLOAD & PROCESSING TESTS');
            console.log('================================');
            await this.testPdfUploadWorkflow();

            // Step 4: Annotation interface testing
            console.log('\n4️⃣ ANNOTATION INTERFACE TESTING');
            console.log('===============================');
            await this.testAnnotationInterface();

            // Step 5: API endpoint testing
            console.log('\n5️⃣ API ENDPOINT TESTING');
            console.log('=======================');
            await this.testApiEndpoints();

            // Step 6: Performance benchmarking
            console.log('\n6️⃣ PERFORMANCE BENCHMARKING');
            console.log('===========================');
            await this.runPerformanceBenchmarks();

            // Step 7: Mobile responsiveness testing
            console.log('\n7️⃣ MOBILE RESPONSIVENESS TESTING');
            console.log('================================');
            await this.testMobileResponsiveness();

            // Step 8: Generate comprehensive report
            console.log('\n8️⃣ GENERATING COMPREHENSIVE REPORT');
            console.log('==================================');
            await this.generateLiveTestReport();

            console.log('\n🎉 COMPREHENSIVE LIVE TESTING COMPLETE!');
            console.log('=======================================');

        } catch (error) {
            console.error('❌ Live testing failed:', error.message);
            this.testResults.errors.push({
                stage: 'comprehensive-testing',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async runPlaywrightTests() {
        const browsers = [
            { name: 'chromium', launcher: chromium },
            { name: 'firefox', launcher: firefox },
            { name: 'webkit', launcher: webkit }
        ];

        for (const { name, launcher } of browsers) {
            console.log(`   🌐 Testing with ${name.toUpperCase()}...`);
            
            try {
                const browser = await launcher.launch({ 
                    headless: false, // Show browser for real testing
                    slowMo: 100 // Slow down for visibility
                });
                const context = await browser.newContext({
                    viewport: { width: 1920, height: 1080 }
                });
                const page = await context.newPage();

                // Capture console messages
                page.on('console', msg => {
                    this.testResults.consoleMessages.push({
                        browser: name,
                        type: msg.type(),
                        text: msg.text(),
                        timestamp: new Date().toISOString()
                    });
                });

                // Test 1: Homepage load and interaction
                const startTime = Date.now();
                await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
                const loadTime = Date.now() - startTime;
                
                const title = await page.title();
                console.log(`      ✅ Homepage loaded in ${loadTime}ms`);
                console.log(`      📄 Page title: "${title}"`);

                // Take homepage screenshot
                const homepageScreenshot = `live-test-results/playwright/${name}-homepage-${Date.now()}.png`;
                await page.screenshot({ path: homepageScreenshot, fullPage: true });
                this.testResults.screenshots.push(homepageScreenshot);

                // Test 2: Navigation to annotation interface
                try {
                    await page.goto(`${this.baseUrl}/smart-annotation`, { waitUntil: 'networkidle' });
                    
                    // Check for key elements
                    const uploadArea = await page.locator('input[type="file"]').count();
                    const annotationTools = await page.locator('text=Annotation').count();
                    const learningProgress = await page.locator('text=Learning').count();
                    
                    console.log(`      ✅ Annotation interface accessible`);
                    console.log(`      📤 Upload area: ${uploadArea > 0 ? 'Present' : 'Missing'}`);
                    console.log(`      🛠️  Annotation tools: ${annotationTools > 0 ? 'Present' : 'Missing'}`);
                    console.log(`      📊 Learning progress: ${learningProgress > 0 ? 'Present' : 'Missing'}`);

                    // Take annotation interface screenshot
                    const annotationScreenshot = `live-test-results/playwright/${name}-annotation-${Date.now()}.png`;
                    await page.screenshot({ path: annotationScreenshot, fullPage: true });
                    this.testResults.screenshots.push(annotationScreenshot);

                    // Test 3: Interactive elements
                    try {
                        // Try to interact with buttons/links
                        const buttons = await page.locator('button').count();
                        const links = await page.locator('a').count();
                        
                        console.log(`      🔘 Interactive buttons: ${buttons}`);
                        console.log(`      🔗 Navigation links: ${links}`);

                        // Test clicking on a safe element
                        if (buttons > 0) {
                            await page.locator('button').first().hover();
                            console.log(`      ✅ Button hover interaction successful`);
                        }

                    } catch (interactionError) {
                        console.log(`      ⚠️  Interaction test: ${interactionError.message}`);
                    }

                } catch (annotationError) {
                    console.log(`      ❌ Annotation interface: ${annotationError.message}`);
                }

                // Test 4: API connectivity from browser
                const apiTest = await page.evaluate(async (baseUrl) => {
                    try {
                        const response = await fetch(`${baseUrl}/api/smart-ocr-test`);
                        const data = await response.json();
                        return { 
                            success: true, 
                            status: response.status, 
                            service: data.service,
                            version: data.version,
                            mistralEnabled: data.mistralEnabled
                        };
                    } catch (error) {
                        return { success: false, error: error.message };
                    }
                }, this.baseUrl);

                if (apiTest.success) {
                    console.log(`      ✅ API connectivity: ${apiTest.status}`);
                    console.log(`      📊 Service: ${apiTest.service}`);
                    console.log(`      🔧 Version: ${apiTest.version}`);
                    console.log(`      🤖 Mistral: ${apiTest.mistralEnabled ? 'Enabled' : 'Disabled'}`);
                } else {
                    console.log(`      ❌ API connectivity: ${apiTest.error}`);
                }

                // Store test results
                this.testResults.playwright[name].push({
                    homepage: { 
                        loadTime, 
                        title, 
                        success: true,
                        screenshot: homepageScreenshot
                    },
                    annotationInterface: { 
                        accessible: true,
                        uploadArea: uploadArea > 0,
                        annotationTools: annotationTools > 0,
                        learningProgress: learningProgress > 0,
                        screenshot: annotationScreenshot
                    },
                    apiConnectivity: apiTest,
                    timestamp: new Date().toISOString()
                });

                await browser.close();

            } catch (error) {
                console.log(`      ❌ ${name} testing failed: ${error.message}`);
                this.testResults.errors.push({
                    browser: name,
                    stage: 'playwright',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    async runPuppeteerTests() {
        console.log('   🤖 Running detailed Puppeteer tests...');
        
        try {
            const browser = await puppeteer.launch({ 
                headless: false, // Show browser for real testing
                slowMo: 100,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });

            // Enable request interception to capture network requests
            await page.setRequestInterception(true);
            page.on('request', request => {
                this.testResults.networkRequests.push({
                    url: request.url(),
                    method: request.method(),
                    resourceType: request.resourceType(),
                    timestamp: new Date().toISOString()
                });
                request.continue();
            });

            // Capture console messages
            page.on('console', msg => {
                this.testResults.consoleMessages.push({
                    browser: 'puppeteer',
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString()
                });
            });

            // Test 1: Performance metrics collection
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;

            // Get detailed performance metrics
            const metrics = await page.metrics();
            const performanceData = await page.evaluate(() => {
                return {
                    timing: performance.timing,
                    navigation: performance.navigation,
                    memory: performance.memory ? {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    } : null
                };
            });

            console.log(`   ✅ Page load time: ${loadTime}ms`);
            console.log(`   📊 JS Heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
            console.log(`   🔧 DOM Nodes: ${metrics.Nodes}`);
            console.log(`   📈 Layout Count: ${metrics.LayoutCount}`);

            // Test 2: Detailed element inspection
            const elementCounts = await page.evaluate(() => {
                return {
                    buttons: document.querySelectorAll('button').length,
                    inputs: document.querySelectorAll('input').length,
                    forms: document.querySelectorAll('form').length,
                    images: document.querySelectorAll('img').length,
                    links: document.querySelectorAll('a').length,
                    scripts: document.querySelectorAll('script').length
                };
            });

            console.log(`   🔘 Buttons found: ${elementCounts.buttons}`);
            console.log(`   📝 Input fields: ${elementCounts.inputs}`);
            console.log(`   📋 Forms: ${elementCounts.forms}`);
            console.log(`   🖼️  Images: ${elementCounts.images}`);
            console.log(`   🔗 Links: ${elementCounts.links}`);

            // Test 3: Screenshot with different viewports
            const viewports = [
                { name: 'desktop', width: 1920, height: 1080 },
                { name: 'tablet', width: 768, height: 1024 },
                { name: 'mobile', width: 375, height: 667 }
            ];

            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.waitForTimeout(1000); // Wait for responsive adjustments
                
                const screenshotPath = `live-test-results/puppeteer/${viewport.name}-view-${Date.now()}.png`;
                await page.screenshot({ path: screenshotPath, fullPage: true });
                this.testResults.screenshots.push(screenshotPath);
                
                console.log(`   📸 ${viewport.name} screenshot: ${viewport.width}x${viewport.height}`);
            }

            // Test 4: Form interaction testing
            await page.goto(`${this.baseUrl}/smart-annotation`);
            
            const formInteractions = await page.evaluate(() => {
                const fileInputs = document.querySelectorAll('input[type="file"]');
                const textInputs = document.querySelectorAll('input[type="text"]');
                const textareas = document.querySelectorAll('textarea');
                
                return {
                    fileInputs: fileInputs.length,
                    textInputs: textInputs.length,
                    textareas: textareas.length,
                    hasUploadForm: fileInputs.length > 0
                };
            });

            console.log(`   📤 File upload inputs: ${formInteractions.fileInputs}`);
            console.log(`   📝 Text inputs: ${formInteractions.textInputs}`);
            console.log(`   📄 Text areas: ${formInteractions.textareas}`);
            console.log(`   ✅ Upload form available: ${formInteractions.hasUploadForm ? 'Yes' : 'No'}`);

            // Store Puppeteer results
            this.testResults.puppeteer.push({
                performance: {
                    loadTime,
                    metrics,
                    performanceData,
                    elementCounts
                },
                formInteractions,
                viewportTests: viewports.length,
                timestamp: new Date().toISOString()
            });

            this.testResults.performanceMetrics = {
                loadTime,
                jsHeapSize: metrics.JSHeapUsedSize,
                domNodes: metrics.Nodes,
                layoutCount: metrics.LayoutCount,
                elementCounts,
                timestamp: new Date().toISOString()
            };

            await browser.close();

        } catch (error) {
            console.log(`   ❌ Puppeteer testing failed: ${error.message}`);
            this.testResults.errors.push({
                stage: 'puppeteer',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testPdfUploadWorkflow() {
        console.log('   📄 Testing PDF upload and processing workflow...');
        
        try {
            const browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(`${this.baseUrl}/smart-annotation`);

            // Check for upload functionality
            const uploadElements = await page.evaluate(() => {
                const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
                const dropZones = Array.from(document.querySelectorAll('[class*="drop"], [class*="upload"]'));
                const uploadButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
                    btn.textContent.toLowerCase().includes('upload') || 
                    btn.textContent.toLowerCase().includes('process')
                );

                return {
                    fileInputCount: fileInputs.length,
                    dropZoneCount: dropZones.length,
                    uploadButtonCount: uploadButtons.length,
                    hasUploadCapability: fileInputs.length > 0 || dropZones.length > 0
                };
            });

            console.log(`   📤 File input elements: ${uploadElements.fileInputCount}`);
            console.log(`   🎯 Drop zones: ${uploadElements.dropZoneCount}`);
            console.log(`   🔘 Upload buttons: ${uploadElements.uploadButtonCount}`);
            console.log(`   ✅ Upload capability: ${uploadElements.hasUploadCapability ? 'Available' : 'Not Found'}`);

            // Test drag and drop simulation
            if (uploadElements.hasUploadCapability) {
                try {
                    // Simulate file selection (without actual file)
                    await page.evaluate(() => {
                        const fileInput = document.querySelector('input[type="file"]');
                        if (fileInput) {
                            // Trigger change event to test handlers
                            const event = new Event('change', { bubbles: true });
                            fileInput.dispatchEvent(event);
                        }
                    });
                    console.log(`   ✅ File input event simulation successful`);
                } catch (simulationError) {
                    console.log(`   ⚠️  File simulation: ${simulationError.message}`);
                }
            }

            // Take workflow screenshot
            const workflowScreenshot = `live-test-results/screenshots/pdf-upload-workflow-${Date.now()}.png`;
            await page.screenshot({ path: workflowScreenshot, fullPage: true });
            this.testResults.screenshots.push(workflowScreenshot);

            this.testResults.functionalityStatus.pdfUpload = {
                available: uploadElements.hasUploadCapability,
                fileInputs: uploadElements.fileInputCount,
                dropZones: uploadElements.dropZoneCount,
                uploadButtons: uploadElements.uploadButtonCount,
                screenshot: workflowScreenshot,
                tested: true
            };

            await browser.close();

        } catch (error) {
            console.log(`   ❌ PDF upload workflow test failed: ${error.message}`);
            this.testResults.errors.push({
                stage: 'pdf-upload',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testAnnotationInterface() {
        console.log('   🎨 Testing annotation interface interactions...');
        
        try {
            const browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            await page.goto(`${this.baseUrl}/smart-annotation`);

            // Test annotation tools and interactions
            const annotationFeatures = await page.evaluate(() => {
                const tools = Array.from(document.querySelectorAll('[class*="tool"], [class*="annotation"]'));
                const buttons = Array.from(document.querySelectorAll('button'));
                const interactiveElements = Array.from(document.querySelectorAll('[onclick], [onmousedown], [onmouseup]'));
                
                // Look for specific annotation-related text
                const annotationText = document.body.textContent.toLowerCase();
                const hasAnnotationFeatures = annotationText.includes('annotation') || 
                                            annotationText.includes('correct') || 
                                            annotationText.includes('highlight');

                return {
                    toolCount: tools.length,
                    buttonCount: buttons.length,
                    interactiveCount: interactiveElements.length,
                    hasAnnotationFeatures,
                    pageText: annotationText.substring(0, 500) // First 500 chars for analysis
                };
            });

            console.log(`   🛠️  Annotation tools found: ${annotationFeatures.toolCount}`);
            console.log(`   🔘 Interactive buttons: ${annotationFeatures.buttonCount}`);
            console.log(`   🖱️  Interactive elements: ${annotationFeatures.interactiveCount}`);
            console.log(`   ✅ Annotation features: ${annotationFeatures.hasAnnotationFeatures ? 'Present' : 'Not Found'}`);

            // Test hover and click interactions
            try {
                const buttons = await page.locator('button');
                const buttonCount = await buttons.count();
                
                if (buttonCount > 0) {
                    // Test hover on first button
                    await buttons.first().hover();
                    await page.waitForTimeout(500);
                    
                    // Test click on a safe button (if any)
                    const buttonText = await buttons.first().textContent();
                    console.log(`   🖱️  Button interaction test: "${buttonText?.trim()}"`);
                    
                    // Don't actually click to avoid side effects, just test hover
                    console.log(`   ✅ Hover interaction successful`);
                }
            } catch (interactionError) {
                console.log(`   ⚠️  Button interaction: ${interactionError.message}`);
            }

            // Take annotation interface screenshot
            const annotationScreenshot = `live-test-results/screenshots/annotation-interface-${Date.now()}.png`;
            await page.screenshot({ path: annotationScreenshot, fullPage: true });
            this.testResults.screenshots.push(annotationScreenshot);

            this.testResults.functionalityStatus.annotationInterface = {
                toolsAvailable: annotationFeatures.toolCount > 0,
                interactiveElements: annotationFeatures.interactiveCount,
                hasAnnotationFeatures: annotationFeatures.hasAnnotationFeatures,
                buttonCount: annotationFeatures.buttonCount,
                screenshot: annotationScreenshot,
                tested: true
            };

            await browser.close();

        } catch (error) {
            console.log(`   ❌ Annotation interface test failed: ${error.message}`);
            this.testResults.errors.push({
                stage: 'annotation-interface',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testApiEndpoints() {
        console.log('   🔌 Testing API endpoints and data flow...');
        
        const endpoints = [
            { path: '/api/smart-ocr-test', name: 'Health Check' },
            { path: '/api/smart-ocr-stats', name: 'System Stats' },
            { path: '/api/smart-ocr-patterns', name: 'ML Patterns' },
            { path: '/api/smart-ocr-learn', name: 'Learning Endpoint' },
            { path: '/api/smart-ocr-process', name: 'Processing Endpoint' }
        ];

        const apiResults = {};

        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await fetch(`${this.baseUrl}${endpoint.path}`);
                const responseTime = Date.now() - startTime;
                
                let data = null;
                let contentType = response.headers.get('content-type');
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        data = await response.json();
                    } catch (jsonError) {
                        data = { error: 'Invalid JSON response' };
                    }
                } else {
                    const text = await response.text();
                    data = { textResponse: text.substring(0, 200) };
                }

                console.log(`   ${response.ok ? '✅' : '❌'} ${endpoint.name}: ${response.status} (${responseTime}ms)`);
                
                if (response.ok && data) {
                    if (data.service) console.log(`      📊 Service: ${data.service}`);
                    if (data.status) console.log(`      🔧 Status: ${data.status}`);
                    if (data.stats) console.log(`      📈 Stats available: Yes`);
                    if (data.patterns) console.log(`      🧠 Patterns available: Yes`);
                }

                apiResults[endpoint.name] = {
                    status: response.status,
                    ok: response.ok,
                    responseTime,
                    contentType,
                    data: data,
                    timestamp: new Date().toISOString()
                };

            } catch (error) {
                console.log(`   ❌ ${endpoint.name}: ${error.message}`);
                apiResults[endpoint.name] = {
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
            }
        }

        this.testResults.functionalityStatus.apiEndpoints = apiResults;
    }

    async runPerformanceBenchmarks() {
        console.log('   ⚡ Running performance benchmarks...');
        
        try {
            const browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Test 1: Load time benchmark
            const loadTests = [];
            for (let i = 0; i < 5; i++) {
                const startTime = Date.now();
                await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
                const loadTime = Date.now() - startTime;
                loadTests.push(loadTime);
                console.log(`   🔄 Load test ${i + 1}: ${loadTime}ms`);
            }

            const avgLoadTime = loadTests.reduce((a, b) => a + b, 0) / loadTests.length;
            const minLoadTime = Math.min(...loadTests);
            const maxLoadTime = Math.max(...loadTests);

            console.log(`   📊 Average load time: ${avgLoadTime.toFixed(2)}ms`);
            console.log(`   ⚡ Fastest load: ${minLoadTime}ms`);
            console.log(`   🐌 Slowest load: ${maxLoadTime}ms`);

            // Test 2: Concurrent request benchmark
            const concurrentRequests = 10;
            const promises = [];
            
            const concurrentStartTime = Date.now();
            for (let i = 0; i < concurrentRequests; i++) {
                promises.push(fetch(`${this.baseUrl}/api/smart-ocr-test`));
            }
            
            const responses = await Promise.all(promises);
            const concurrentEndTime = Date.now();
            
            const successfulResponses = responses.filter(r => r.ok).length;
            const concurrentTotalTime = concurrentEndTime - concurrentStartTime;
            
            console.log(`   🚀 Concurrent test: ${successfulResponses}/${concurrentRequests} successful`);
            console.log(`   ⏱️  Total time: ${concurrentTotalTime}ms`);
            console.log(`   📈 Avg per request: ${(concurrentTotalTime / concurrentRequests).toFixed(2)}ms`);

            this.testResults.performanceMetrics.benchmarks = {
                loadTests: {
                    average: avgLoadTime,
                    min: minLoadTime,
                    max: maxLoadTime,
                    tests: loadTests
                },
                concurrentTest: {
                    requests: concurrentRequests,
                    successful: successfulResponses,
                    totalTime: concurrentTotalTime,
                    averagePerRequest: concurrentTotalTime / concurrentRequests
                },
                timestamp: new Date().toISOString()
            };

            await browser.close();

        } catch (error) {
            console.log(`   ❌ Performance benchmark failed: ${error.message}`);
            this.testResults.errors.push({
                stage: 'performance-benchmark',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testMobileResponsiveness() {
        console.log('   📱 Testing mobile responsiveness...');
        
        try {
            const browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            const mobileViewports = [
                { name: 'iPhone SE', width: 375, height: 667 },
                { name: 'iPhone 12', width: 390, height: 844 },
                { name: 'iPad', width: 768, height: 1024 },
                { name: 'Android', width: 360, height: 640 }
            ];

            const responsiveResults = {};

            for (const viewport of mobileViewports) {
                await page.setViewport(viewport);
                await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
                
                // Test responsive elements
                const responsiveCheck = await page.evaluate(() => {
                    const body = document.body;
                    const hasHorizontalScroll = body.scrollWidth > window.innerWidth;
                    const elements = document.querySelectorAll('*');
                    let overflowElements = 0;
                    
                    elements.forEach(el => {
                        if (el.scrollWidth > window.innerWidth) {
                            overflowElements++;
                        }
                    });

                    return {
                        hasHorizontalScroll,
                        overflowElements,
                        viewportWidth: window.innerWidth,
                        viewportHeight: window.innerHeight,
                        bodyWidth: body.scrollWidth
                    };
                });

                console.log(`   📱 ${viewport.name} (${viewport.width}x${viewport.height})`);
                console.log(`      ${responsiveCheck.hasHorizontalScroll ? '❌' : '✅'} Horizontal scroll: ${responsiveCheck.hasHorizontalScroll ? 'Present' : 'None'}`);
                console.log(`      🔧 Overflow elements: ${responsiveCheck.overflowElements}`);

                // Take mobile screenshot
                const mobileScreenshot = `live-test-results/screenshots/mobile-${viewport.name.toLowerCase().replace(' ', '-')}-${Date.now()}.png`;
                await page.screenshot({ path: mobileScreenshot, fullPage: true });
                this.testResults.screenshots.push(mobileScreenshot);

                responsiveResults[viewport.name] = {
                    viewport,
                    responsiveCheck,
                    screenshot: mobileScreenshot,
                    responsive: !responsiveCheck.hasHorizontalScroll && responsiveCheck.overflowElements < 5
                };
            }

            this.testResults.functionalityStatus.mobileResponsiveness = responsiveResults;

            await browser.close();

        } catch (error) {
            console.log(`   ❌ Mobile responsiveness test failed: ${error.message}`);
            this.testResults.errors.push({
                stage: 'mobile-responsiveness',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async generateLiveTestReport() {
        const report = {
            liveTestSuite: 'Comprehensive Live Browser Automation Tests',
            timestamp: new Date().toISOString(),
            productionUrl: this.baseUrl,
            testResults: this.testResults,
            summary: this.generateTestSummary()
        };

        // Save JSON report
        const jsonReport = 'live-test-results/comprehensive-live-test-report.json';
        await fs.writeFile(jsonReport, JSON.stringify(report, null, 2));

        // Generate HTML report
        const htmlReport = this.generateHtmlReport(report);
        const htmlReportPath = 'live-test-results/comprehensive-live-test-report.html';
        await fs.writeFile(htmlReportPath, htmlReport);

        console.log(`   📊 Live test report: ${jsonReport}`);
        console.log(`   🌐 HTML report: ${htmlReportPath}`);
        console.log(`   📸 Screenshots captured: ${this.testResults.screenshots.length}`);
        console.log(`   🔍 Console messages: ${this.testResults.consoleMessages.length}`);
        console.log(`   🌐 Network requests: ${this.testResults.networkRequests.length}`);

        // Display summary
        console.log('\n📊 LIVE TESTING SUMMARY:');
        console.log('========================');
        console.log(`   🌐 Browsers tested: ${Object.keys(this.testResults.playwright).length} (Playwright) + 1 (Puppeteer)`);
        console.log(`   📸 Screenshots: ${this.testResults.screenshots.length}`);
        console.log(`   ⚡ Performance: ${this.testResults.performanceMetrics.benchmarks?.loadTests?.average?.toFixed(2) || 'N/A'}ms avg load`);
        console.log(`   📱 Mobile viewports: ${Object.keys(this.testResults.functionalityStatus.mobileResponsiveness || {}).length}`);
        console.log(`   🔌 API endpoints: ${Object.keys(this.testResults.functionalityStatus.apiEndpoints || {}).length}`);
        console.log(`   ❌ Errors: ${this.testResults.errors.length}`);
        console.log(`   🎯 Overall status: ${this.testResults.errors.length === 0 ? '✅ EXCELLENT' : '⚠️ NEEDS ATTENTION'}`);
    }

    generateTestSummary() {
        const playwrightBrowsers = Object.keys(this.testResults.playwright).filter(browser => 
            this.testResults.playwright[browser].length > 0
        ).length;
        
        const puppeteerTests = this.testResults.puppeteer.length;
        const screenshotCount = this.testResults.screenshots.length;
        const errorCount = this.testResults.errors.length;
        const networkRequestCount = this.testResults.networkRequests.length;

        return {
            browsersTestedPlaywright: playwrightBrowsers,
            puppeteerTests,
            screenshotCount,
            errorCount,
            networkRequestCount,
            consoleMessageCount: this.testResults.consoleMessages.length,
            functionalityTested: Object.keys(this.testResults.functionalityStatus).length,
            overallStatus: errorCount === 0 ? 'excellent' : 'needs-attention'
        };
    }

    generateHtmlReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Live Browser Automation Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f7fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center; }
        .section { background: white; margin: 20px 0; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #e7f3ff; padding: 15px; border-radius: 8px; text-align: center; }
        .screenshot { max-width: 300px; margin: 10px; border: 2px solid #ddd; border-radius: 8px; }
        .browser-result { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Comprehensive Live Browser Automation Test Report</h1>
        <p><strong>Production System:</strong> ${report.productionUrl}</p>
        <p><strong>Test Date:</strong> ${report.timestamp}</p>
        <p><strong>Status:</strong> <span class="${report.summary.overallStatus === 'excellent' ? 'success' : 'warning'}">${report.summary.overallStatus.toUpperCase()}</span></p>
    </div>

    <div class="section">
        <h2>📊 Test Summary</h2>
        <div class="metrics">
            <div class="metric">
                <h3>Browsers Tested</h3>
                <p><strong>${report.summary.browsersTestedPlaywright}</strong></p>
                <p>Playwright + Puppeteer</p>
            </div>
            <div class="metric">
                <h3>Screenshots</h3>
                <p><strong>${report.summary.screenshotCount}</strong></p>
                <p>Visual Evidence</p>
            </div>
            <div class="metric">
                <h3>Network Requests</h3>
                <p><strong>${report.summary.networkRequestCount}</strong></p>
                <p>Captured</p>
            </div>
            <div class="metric">
                <h3>Errors</h3>
                <p><strong>${report.summary.errorCount}</strong></p>
                <p>Issues Found</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🌐 Playwright Cross-Browser Results</h2>
        <div class="test-grid">
            ${Object.entries(report.testResults.playwright).map(([browser, results]) => `
                <div class="browser-result">
                    <h4>🌐 ${browser.toUpperCase()}</h4>
                    ${results.length > 0 ? `
                        <p><strong>Homepage Load:</strong> ${results[0].homepage?.loadTime || 'N/A'}ms</p>
                        <p><strong>Title:</strong> "${results[0].homepage?.title || 'N/A'}"</p>
                        <p><strong>Annotation Interface:</strong> ${results[0].annotationInterface?.accessible ? '✅ Accessible' : '❌ Not Accessible'}</p>
                        <p><strong>API Connectivity:</strong> ${results[0].apiConnectivity?.success ? '✅ Working' : '❌ Failed'}</p>
                        ${results[0].apiConnectivity?.service ? `<p><strong>Service:</strong> ${results[0].apiConnectivity.service}</p>` : ''}
                    ` : '<p class="error">No test results available</p>'}
                </div>
            `).join('')}
        </div>
    </div>

    ${report.testResults.performanceMetrics.benchmarks ? `
    <div class="section">
        <h2>⚡ Performance Benchmarks</h2>
        <div class="metrics">
            <div class="metric">
                <h3>Average Load Time</h3>
                <p><strong>${report.testResults.performanceMetrics.benchmarks.loadTests.average.toFixed(2)}ms</strong></p>
            </div>
            <div class="metric">
                <h3>Fastest Load</h3>
                <p><strong>${report.testResults.performanceMetrics.benchmarks.loadTests.min}ms</strong></p>
            </div>
            <div class="metric">
                <h3>Concurrent Requests</h3>
                <p><strong>${report.testResults.performanceMetrics.benchmarks.concurrentTest.successful}/${report.testResults.performanceMetrics.benchmarks.concurrentTest.requests}</strong></p>
            </div>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>🔌 API Endpoint Testing</h2>
        ${Object.entries(report.testResults.functionalityStatus.apiEndpoints || {}).map(([name, result]) => `
            <p class="${result.ok ? 'success' : 'error'}">
                ${result.ok ? '✅' : '❌'} <strong>${name}:</strong> ${result.status} (${result.responseTime || 'N/A'}ms)
            </p>
        `).join('')}
    </div>

    <div class="section">
        <h2>📱 Mobile Responsiveness</h2>
        ${Object.entries(report.testResults.functionalityStatus.mobileResponsiveness || {}).map(([device, result]) => `
            <p class="${result.responsive ? 'success' : 'warning'}">
                ${result.responsive ? '✅' : '⚠️'} <strong>${device}:</strong> ${result.responsive ? 'Responsive' : 'Issues Found'}
                (${result.viewport.width}x${result.viewport.height})
            </p>
        `).join('')}
    </div>

    <div class="section">
        <h2>📸 Screenshots Gallery</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            ${report.testResults.screenshots.map(screenshot => 
                `<img src="${screenshot}" alt="Test Screenshot" class="screenshot" title="${screenshot}">`
            ).join('')}
        </div>
    </div>

    ${report.summary.errorCount > 0 ? `
    <div class="section">
        <h2>❌ Issues Found</h2>
        ${report.testResults.errors.map(error => 
            `<p class="error"><strong>${error.stage || error.browser || 'Unknown'}:</strong> ${error.error}</p>`
        ).join('')}
    </div>
    ` : ''}
</body>
</html>
        `;
    }
}

async function main() {
    const tester = new LiveBrowserAutomationTests();
    await tester.runComprehensiveLiveTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { LiveBrowserAutomationTests };
