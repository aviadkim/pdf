#!/usr/bin/env node

/**
 * REAL LIVE SYSTEM TESTS
 * 
 * Actual Playwright and Puppeteer tests against the live system
 * Tests the real PDF upload and processing functionality
 */

const { chromium, firefox, webkit } = require('playwright');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class RealLiveSystemTester {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.testResults = {
            playwright: {},
            puppeteer: {},
            errors: [],
            screenshots: []
        };
    }

    async runAllTests() {
        console.log('🚀 Starting REAL live system tests...');
        console.log(`🌐 Testing URL: ${this.baseUrl}`);
        console.log('');

        try {
            // Test with Playwright (multiple browsers)
            await this.runPlaywrightTests();
            
            // Test with Puppeteer
            await this.runPuppeteerTests();
            
            // Generate report
            await this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.errors.push({
                type: 'SUITE_FAILURE',
                error: error.message,
                stack: error.stack
            });
        }
    }

    async runPlaywrightTests() {
        console.log('🎭 Running Playwright tests...');
        
        const browsers = [
            { name: 'chromium', launcher: chromium },
            { name: 'firefox', launcher: firefox },
            { name: 'webkit', launcher: webkit }
        ];

        for (const browserInfo of browsers) {
            try {
                console.log(`\n🌐 Testing with ${browserInfo.name}...`);
                await this.testWithPlaywright(browserInfo);
            } catch (error) {
                console.error(`❌ ${browserInfo.name} test failed:`, error.message);
                this.testResults.errors.push({
                    type: 'PLAYWRIGHT_BROWSER_FAILURE',
                    browser: browserInfo.name,
                    error: error.message
                });
            }
        }
    }

    async testWithPlaywright(browserInfo) {
        const browser = await browserInfo.launcher.launch({ 
            headless: false, // Show browser for debugging
            slowMo: 1000 // Slow down for observation
        });
        
        try {
            const context = await browser.newContext();
            const page = await context.newPage();
            
            // Enable console logging
            page.on('console', msg => {
                console.log(`📝 [${browserInfo.name}] Console: ${msg.text()}`);
            });
            
            // Capture errors
            page.on('pageerror', error => {
                console.error(`❌ [${browserInfo.name}] Page Error: ${error.message}`);
                this.testResults.errors.push({
                    type: 'PAGE_ERROR',
                    browser: browserInfo.name,
                    error: error.message
                });
            });

            // Test 1: Load homepage
            console.log(`  📄 Loading homepage...`);
            await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
            await page.screenshot({ 
                path: `test-results/playwright-${browserInfo.name}-homepage.png`,
                fullPage: true 
            });
            console.log(`  ✅ Homepage loaded`);

            // Test 2: Navigate to annotation interface
            console.log(`  🎨 Navigating to annotation interface...`);
            await page.goto(`${this.baseUrl}/smart-annotation`, { waitUntil: 'networkidle' });
            await page.screenshot({ 
                path: `test-results/playwright-${browserInfo.name}-annotation.png`,
                fullPage: true 
            });
            console.log(`  ✅ Annotation interface loaded`);

            // Test 3: Check for file upload element
            console.log(`  📤 Checking file upload functionality...`);
            const fileInput = await page.locator('input[type="file"]').first();
            const isVisible = await fileInput.isVisible();
            console.log(`  📤 File input visible: ${isVisible}`);

            // Test 4: Try to upload a test file (if exists)
            const testFiles = ['2. Messos - 31.03.2025.pdf', 'test.pdf'];
            let testFile = null;
            
            for (const fileName of testFiles) {
                try {
                    await fs.access(fileName);
                    testFile = fileName;
                    break;
                } catch {}
            }

            if (testFile) {
                console.log(`  📄 Uploading test file: ${testFile}`);
                
                // Listen for network requests
                const responses = [];
                page.on('response', response => {
                    responses.push({
                        url: response.url(),
                        status: response.status(),
                        statusText: response.statusText()
                    });
                });

                try {
                    await fileInput.setInputFiles(testFile);
                    
                    // Wait for processing
                    await page.waitForTimeout(5000);
                    
                    // Capture screenshot after upload
                    await page.screenshot({ 
                        path: `test-results/playwright-${browserInfo.name}-after-upload.png`,
                        fullPage: true 
                    });
                    
                    console.log(`  ✅ File upload completed`);
                    
                    // Log network responses
                    console.log(`  📡 Network responses:`);
                    responses.forEach(resp => {
                        console.log(`    ${resp.status} ${resp.url}`);
                    });
                    
                } catch (uploadError) {
                    console.error(`  ❌ Upload failed: ${uploadError.message}`);
                    this.testResults.errors.push({
                        type: 'UPLOAD_FAILURE',
                        browser: browserInfo.name,
                        error: uploadError.message
                    });
                }
            } else {
                console.log(`  ⚠️ No test PDF file found`);
            }

            // Test 5: Check for JavaScript errors
            const jsErrors = await page.evaluate(() => {
                return window.jsErrors || [];
            });
            
            if (jsErrors.length > 0) {
                console.log(`  ❌ JavaScript errors found: ${jsErrors.length}`);
                jsErrors.forEach(error => {
                    this.testResults.errors.push({
                        type: 'JAVASCRIPT_ERROR',
                        browser: browserInfo.name,
                        error: error
                    });
                });
            }

            this.testResults.playwright[browserInfo.name] = {
                success: true,
                homepageLoaded: true,
                annotationLoaded: true,
                fileInputVisible: isVisible,
                testFileUploaded: !!testFile,
                jsErrors: jsErrors.length
            };

        } finally {
            await browser.close();
        }
    }

    async runPuppeteerTests() {
        console.log('\n🎪 Running Puppeteer tests...');
        
        const browser = await puppeteer.launch({ 
            headless: false,
            slowMo: 1000,
            devtools: true
        });
        
        try {
            const page = await browser.newPage();
            
            // Enable console logging
            page.on('console', msg => {
                console.log(`📝 [Puppeteer] Console: ${msg.text()}`);
            });
            
            // Capture errors
            page.on('pageerror', error => {
                console.error(`❌ [Puppeteer] Page Error: ${error.message}`);
                this.testResults.errors.push({
                    type: 'PUPPETEER_PAGE_ERROR',
                    error: error.message
                });
            });

            // Test 1: Load and analyze the annotation page
            console.log(`  📄 Loading annotation interface...`);
            await page.goto(`${this.baseUrl}/smart-annotation`, { 
                waitUntil: 'networkidle2' 
            });
            
            await page.screenshot({ 
                path: 'test-results/puppeteer-annotation-page.png',
                fullPage: true 
            });

            // Test 2: Analyze the page structure
            console.log(`  🔍 Analyzing page structure...`);
            const pageAnalysis = await page.evaluate(() => {
                return {
                    title: document.title,
                    hasFileInput: !!document.querySelector('input[type="file"]'),
                    hasUploadButton: !!document.querySelector('button[onclick*="upload"], button[id*="upload"], .upload-btn'),
                    hasAnnotationTools: !!document.querySelector('.annotation-tool, .tool-btn, [class*="annotation"]'),
                    scriptTags: Array.from(document.querySelectorAll('script')).length,
                    errorElements: Array.from(document.querySelectorAll('.error, .alert-danger')).map(el => el.textContent),
                    consoleErrors: window.console.errors || []
                };
            });
            
            console.log(`  📊 Page analysis:`, pageAnalysis);

            // Test 3: Try to trigger the upload functionality
            console.log(`  🧪 Testing upload functionality...`);
            
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                console.log(`  ✅ File input found`);
                
                // Check if we have a test file
                const testFiles = ['2. Messos - 31.03.2025.pdf', 'test.pdf'];
                let testFile = null;
                
                for (const fileName of testFiles) {
                    try {
                        await fs.access(fileName);
                        testFile = fileName;
                        break;
                    } catch {}
                }

                if (testFile) {
                    console.log(`  📤 Attempting to upload: ${testFile}`);
                    
                    // Monitor network requests
                    const requests = [];
                    page.on('request', request => {
                        requests.push({
                            url: request.url(),
                            method: request.method(),
                            headers: request.headers()
                        });
                    });

                    const responses = [];
                    page.on('response', response => {
                        responses.push({
                            url: response.url(),
                            status: response.status(),
                            statusText: response.statusText()
                        });
                    });

                    try {
                        await fileInput.uploadFile(testFile);
                        
                        // Wait for any processing
                        await page.waitForTimeout(3000);
                        
                        // Check for any error messages
                        const errorMessages = await page.evaluate(() => {
                            const errors = [];
                            document.querySelectorAll('.error, .alert-danger, [class*="error"]').forEach(el => {
                                if (el.textContent.trim()) {
                                    errors.push(el.textContent.trim());
                                }
                            });
                            return errors;
                        });
                        
                        if (errorMessages.length > 0) {
                            console.log(`  ❌ Error messages found:`, errorMessages);
                            errorMessages.forEach(msg => {
                                this.testResults.errors.push({
                                    type: 'UI_ERROR_MESSAGE',
                                    error: msg
                                });
                            });
                        }
                        
                        // Capture final screenshot
                        await page.screenshot({ 
                            path: 'test-results/puppeteer-after-upload.png',
                            fullPage: true 
                        });
                        
                        console.log(`  📡 Network activity:`);
                        responses.forEach(resp => {
                            console.log(`    ${resp.status} ${resp.url}`);
                        });
                        
                    } catch (uploadError) {
                        console.error(`  ❌ Upload error: ${uploadError.message}`);
                        this.testResults.errors.push({
                            type: 'PUPPETEER_UPLOAD_ERROR',
                            error: uploadError.message
                        });
                    }
                }
            } else {
                console.log(`  ❌ No file input found`);
            }

            this.testResults.puppeteer = {
                success: true,
                pageAnalysis: pageAnalysis,
                fileInputFound: !!fileInput,
                testCompleted: true
            };

        } finally {
            await browser.close();
        }
    }

    async generateTestReport() {
        console.log('\n📊 Generating test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            testResults: this.testResults,
            summary: {
                totalErrors: this.testResults.errors.length,
                playwrightBrowsers: Object.keys(this.testResults.playwright).length,
                puppeteerCompleted: !!this.testResults.puppeteer.success
            }
        };

        // Save detailed report
        await fs.writeFile(
            'test-results/real-live-system-test-report.json',
            JSON.stringify(report, null, 2)
        );

        // Generate human-readable report
        const readableReport = this.generateReadableReport(report);
        await fs.writeFile(
            'test-results/real-live-system-test-report.md',
            readableReport
        );

        console.log('✅ Test report saved to test-results/');
        console.log('\n📋 SUMMARY:');
        console.log(`- Total errors: ${report.summary.totalErrors}`);
        console.log(`- Playwright browsers tested: ${report.summary.playwrightBrowsers}`);
        console.log(`- Puppeteer test completed: ${report.summary.puppeteerCompleted}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ ERRORS FOUND:');
            this.testResults.errors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.type}] ${error.error}`);
            });
        } else {
            console.log('\n✅ No errors found!');
        }
    }

    generateReadableReport(report) {
        return `# Real Live System Test Report

**Generated:** ${report.timestamp}
**System URL:** ${report.baseUrl}

## Summary
- **Total Errors:** ${report.summary.totalErrors}
- **Playwright Browsers:** ${report.summary.playwrightBrowsers}
- **Puppeteer Completed:** ${report.summary.puppeteerCompleted}

## Playwright Results
${Object.entries(report.testResults.playwright).map(([browser, results]) => `
### ${browser}
- Homepage Loaded: ${results.homepageLoaded ? '✅' : '❌'}
- Annotation Loaded: ${results.annotationLoaded ? '✅' : '❌'}
- File Input Visible: ${results.fileInputVisible ? '✅' : '❌'}
- Test File Uploaded: ${results.testFileUploaded ? '✅' : '❌'}
- JavaScript Errors: ${results.jsErrors}
`).join('')}

## Puppeteer Results
${report.testResults.puppeteer ? `
- **Success:** ${report.testResults.puppeteer.success ? '✅' : '❌'}
- **File Input Found:** ${report.testResults.puppeteer.fileInputFound ? '✅' : '❌'}
- **Page Analysis:** ${JSON.stringify(report.testResults.puppeteer.pageAnalysis, null, 2)}
` : 'Not completed'}

## Errors
${report.testResults.errors.map((error, index) => `
${index + 1}. **${error.type}**
   - Error: ${error.error}
   - Browser: ${error.browser || 'N/A'}
`).join('')}

## Screenshots
Screenshots are saved in the test-results/ directory with names indicating the browser and test phase.
`;
    }
}

// Ensure test-results directory exists
async function ensureTestResultsDir() {
    try {
        await fs.mkdir('test-results', { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

// Main execution
async function main() {
    console.log('🎯 REAL LIVE SYSTEM TESTING');
    console.log('===========================');
    console.log('This will run actual browser tests against your live system.');
    console.log('');

    await ensureTestResultsDir();
    
    const tester = new RealLiveSystemTester();
    await tester.runAllTests();
    
    console.log('\n🏁 Testing complete!');
    console.log('Check test-results/ directory for screenshots and detailed reports.');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { RealLiveSystemTester };
