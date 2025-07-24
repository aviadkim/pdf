/**
 * COMPREHENSIVE LIVE TESTING SUITE
 * Complete Puppeteer testing with real-time monitoring and logging
 * Tests the live deployment with full result analysis
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fetch = require('node-fetch');

class ComprehensiveLiveTestingSuite {
    constructor() {
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        this.messosPdfPath = '2. Messos  - 31.03.2025.pdf';
        this.logFile = `live-testing-log-${Date.now()}.txt`;
        this.screenshots = [];
        
        console.log('🧪 COMPREHENSIVE LIVE TESTING SUITE');
        console.log('📊 Real-time monitoring with complete result analysis');
    }

    async log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}${data ? '\\n' + JSON.stringify(data, null, 2) : ''}\\n`;
        
        console.log(message);
        if (data) console.log(data);
        
        await fs.appendFile(this.logFile, logEntry);
    }

    async runComprehensiveTests() {
        await this.log('🚀 STARTING COMPREHENSIVE LIVE TESTING');
        const startTime = Date.now();
        
        const testResults = {
            timestamp: new Date().toISOString(),
            renderUrl: this.renderUrl,
            tests: [],
            screenshots: [],
            logFile: this.logFile,
            summary: {}
        };

        let browser = null;

        try {
            // Launch browser with full debugging
            await this.log('🌐 Launching browser for live testing...');
            browser = await puppeteer.launch({
                headless: false, // Show browser
                devtools: true,  // Open dev tools
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--enable-logging',
                    '--v=1'
                ]
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Enable console logging from the browser
            page.on('console', async (msg) => {
                await this.log(`🌐 BROWSER: ${msg.type()}: ${msg.text()}`);
            });
            
            page.on('response', async (response) => {
                if (response.url().includes('api/')) {
                    await this.log(`📡 API RESPONSE: ${response.url()} - ${response.status()}`);
                }
            });

            // Test 1: Check deployment system
            await this.testDeploymentSystem(page, testResults);
            
            // Test 2: Test API endpoints
            await this.testAllApiEndpoints(testResults);
            
            // Test 3: Upload and test Messos PDF
            await this.testMessosProcessing(page, testResults);
            
            // Test 4: Compare with expected results
            await this.compareWithExpectedResults(testResults);
            
            // Test 5: Test perfect extraction endpoint
            await this.testPerfectExtractionEndpoint(testResults);
            
        } catch (error) {
            await this.log('❌ Test suite failed', { error: error.message });
            testResults.error = error.message;
        } finally {
            if (browser) {
                await browser.close();
            }
        }

        // Generate final report
        const report = await this.generateComprehensiveReport(testResults, Date.now() - startTime);
        
        await this.log('📊 COMPREHENSIVE TESTING COMPLETE');
        return report;
    }

    async testDeploymentSystem(page, testResults) {
        await this.log('\\n🔍 TESTING DEPLOYMENT SYSTEM');
        
        try {
            const response = await page.goto(this.renderUrl, { 
                waitUntil: 'networkidle2', 
                timeout: 30000 
            });
            
            const title = await page.title();
            const url = page.url();
            
            // Take screenshot
            const screenshot = `deployment-${Date.now()}.png`;
            await page.screenshot({ path: screenshot, fullPage: true });
            this.screenshots.push(screenshot);
            
            // Check what system is running
            const pageContent = await page.content();
            const isNewSystem = pageContent.includes('Perfect Mistral') || 
                               pageContent.includes('100% accuracy') ||
                               pageContent.includes('mistral-large-latest');
            const isOldSystem = pageContent.includes('Smart OCR Learning System');
            
            const systemType = isNewSystem ? 'Perfect Mistral System' : 
                              isOldSystem ? 'Old Smart OCR System' : 'Unknown System';
            
            testResults.tests.push({
                test: 'deployment_system',
                passed: response.status() === 200,
                details: {
                    status: response.status(),
                    title: title,
                    url: url,
                    systemType: systemType,
                    isNewSystem: isNewSystem,
                    screenshot: screenshot
                }
            });
            
            await this.log(`✅ Deployment accessible: ${title}`);
            await this.log(`🎯 System type: ${systemType}`);
            
        } catch (error) {
            await this.log('❌ Deployment test failed', { error: error.message });
            testResults.tests.push({
                test: 'deployment_system',
                passed: false,
                error: error.message
            });
        }
    }

    async testAllApiEndpoints(testResults) {
        await this.log('\\n🔗 TESTING ALL API ENDPOINTS');
        
        const endpoints = [
            { path: '/api/system-capabilities', expected: 'json' },
            { path: '/api/smart-ocr-stats', expected: 'json' },
            { path: '/api/smart-ocr-patterns', expected: 'json' },
            { path: '/api/perfect-extraction', expected: 'endpoint', method: 'POST' },
            { path: '/api/bulletproof-processor', expected: 'endpoint', method: 'POST' },
            { path: '/perfect-results', expected: 'html' },
            { path: '/api/export/json', expected: 'json' },
            { path: '/api/export/csv', expected: 'csv' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const method = endpoint.method || 'GET';
                const response = await fetch(this.renderUrl + endpoint.path, {
                    method: method,
                    timeout: 10000
                });
                
                const content = await response.text();
                const isWorking = response.status !== 404;
                const hasExpectedContent = endpoint.expected === 'json' ? content.includes('{') :
                                         endpoint.expected === 'html' ? content.includes('<') :
                                         endpoint.expected === 'endpoint' ? response.status !== 404 :
                                         true;
                
                testResults.tests.push({
                    test: `endpoint_${endpoint.path.replace(/[^a-z0-9]/gi, '_')}`,
                    passed: isWorking && hasExpectedContent,
                    details: {
                        endpoint: endpoint.path,
                        method: method,
                        status: response.status(),
                        isWorking: isWorking,
                        hasExpectedContent: hasExpectedContent,
                        contentLength: content.length,
                        preview: content.substring(0, 200)
                    }
                });
                
                await this.log(`${isWorking ? '✅' : '❌'} ${endpoint.path}: ${response.status}`);
                
            } catch (error) {
                testResults.tests.push({
                    test: `endpoint_${endpoint.path.replace(/[^a-z0-9]/gi, '_')}`,
                    passed: false,
                    error: error.message
                });
                await this.log(`❌ ${endpoint.path}: ${error.message}`);
            }
        }
    }

    async testMessosProcessing(page, testResults) {
        await this.log('\\n📤 TESTING MESSOS PDF PROCESSING');
        
        try {
            // Check if PDF exists
            await fs.access(this.messosPdfPath);
            await this.log(`📄 PDF found: ${this.messosPdfPath}`);
            
            // Go to the main page
            await page.goto(this.renderUrl, { waitUntil: 'networkidle2' });
            
            // Take screenshot of interface
            const interfaceScreenshot = `interface-${Date.now()}.png`;
            await page.screenshot({ path: interfaceScreenshot });
            this.screenshots.push(interfaceScreenshot);
            
            // Look for upload form
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await this.log('📁 File input found - uploading Messos PDF...');
                
                // Upload file
                await fileInput.uploadFile(this.messosPdfPath);
                
                // Look for submit button
                const submitSelectors = [
                    'button[type="submit"]',
                    'input[type="submit"]',
                    'button:contains("Process")',
                    'button:contains("Upload")',
                    'button:contains("Submit")',
                    '.submit-button',
                    '#submit'
                ];
                
                let submitButton = null;
                for (const selector of submitSelectors) {
                    try {
                        submitButton = await page.$(selector);
                        if (submitButton) break;
                    } catch (e) {}
                }
                
                if (submitButton) {
                    await this.log('🔄 Submit button found - processing PDF...');
                    
                    // Click submit and wait for processing
                    await submitButton.click();
                    
                    // Wait for results
                    try {
                        await page.waitForFunction(
                            () => {
                                const text = document.body.innerText.toLowerCase();
                                return text.includes('securities') || 
                                       text.includes('isin') ||
                                       text.includes('result') ||
                                       text.includes('success') ||
                                       text.includes('extracted');
                            },
                            { timeout: 120000 }
                        );
                        
                        // Take screenshot of results
                        const resultsScreenshot = `results-${Date.now()}.png`;
                        await page.screenshot({ path: resultsScreenshot, fullPage: true });
                        this.screenshots.push(resultsScreenshot);
                        
                        // Extract results
                        const results = await this.extractResultsFromPage(page);
                        
                        testResults.tests.push({
                            test: 'messos_processing',
                            passed: true,
                            details: {
                                results: results,
                                screenshots: [interfaceScreenshot, resultsScreenshot]
                            }
                        });
                        
                        await this.log('✅ PDF processing completed', results);
                        
                    } catch (waitError) {
                        await this.log('⏰ Processing timeout - may still be working');
                        
                        const timeoutScreenshot = `timeout-${Date.now()}.png`;
                        await page.screenshot({ path: timeoutScreenshot });
                        this.screenshots.push(timeoutScreenshot);
                        
                        testResults.tests.push({
                            test: 'messos_processing',
                            passed: false,
                            error: 'Processing timeout',
                            details: { screenshot: timeoutScreenshot }
                        });
                    }
                } else {
                    await this.log('❌ No submit button found');
                    testResults.tests.push({
                        test: 'messos_processing',
                        passed: false,
                        error: 'Submit button not found'
                    });
                }
            } else {
                await this.log('❌ No file input found on page');
                testResults.tests.push({
                    test: 'messos_processing',
                    passed: false,
                    error: 'File input not found'
                });
            }
            
        } catch (error) {
            await this.log('❌ Messos processing test failed', { error: error.message });
            testResults.tests.push({
                test: 'messos_processing',
                passed: false,
                error: error.message
            });
        }
    }

    async extractResultsFromPage(page) {
        await this.log('🔍 Extracting results from page...');
        
        const results = {
            securities: [],
            totalValue: 0,
            accuracy: 0,
            isins: [],
            pageText: '',
            jsonData: null
        };
        
        try {
            // Get all page text
            const pageText = await page.evaluate(() => document.body.innerText);
            results.pageText = pageText;
            
            // Look for JSON data
            const jsonData = await page.evaluate(() => {
                // Check for JSON in script tags
                const scripts = Array.from(document.querySelectorAll('script'));
                for (const script of scripts) {
                    if (script.textContent.includes('securities') || script.textContent.includes('isin')) {
                        try {
                            const match = script.textContent.match(/\\{[^}]*securities[^}]*\\}/);
                            if (match) return JSON.parse(match[0]);
                        } catch (e) {}
                    }
                }
                
                // Check for data attributes
                const dataElements = Array.from(document.querySelectorAll('[data-results]'));
                for (const element of dataElements) {
                    try {
                        return JSON.parse(element.getAttribute('data-results'));
                    } catch (e) {}
                }
                
                return null;
            });
            
            if (jsonData) {
                results.jsonData = jsonData;
                results.securities = jsonData.securities || [];
                results.totalValue = jsonData.totalValue || jsonData.summary?.totalValue || 0;
            }
            
            // Extract ISINs from text
            const isinMatches = pageText.match(/[A-Z]{2}[A-Z0-9]{10}/g) || [];
            results.isins = [...new Set(isinMatches)];
            
            // Extract CHF amounts
            const chfMatches = pageText.match(/CHF[\\s]*([\\d,']+)/gi) || [];
            const amounts = chfMatches.map(match => {
                const num = match.replace(/[^\\d,]/g, '').replace(/,/g, '');
                return parseFloat(num) || 0;
            });
            
            if (amounts.length > 0) {
                results.totalValue = Math.max(...amounts);
            }
            
            // Calculate accuracy estimate
            if (results.securities.length > 0) {
                results.accuracy = Math.min(100, (results.securities.length / 39) * 100);
            } else if (results.isins.length > 0) {
                results.accuracy = Math.min(100, (results.isins.length / 39) * 100);
            }
            
            await this.log(`📊 Extracted ${results.securities.length} securities, ${results.isins.length} ISINs`);
            
        } catch (error) {
            await this.log('⚠️ Error extracting results', { error: error.message });
        }
        
        return results;
    }

    async testPerfectExtractionEndpoint(testResults) {
        await this.log('\\n🎯 TESTING PERFECT EXTRACTION ENDPOINT');
        
        try {
            const FormData = require('form-data');
            const pdfBuffer = await fs.readFile(this.messosPdfPath);
            
            const formData = new FormData();
            formData.append('pdf', pdfBuffer, {
                filename: this.messosPdfPath,
                contentType: 'application/pdf'
            });
            
            const response = await fetch(`${this.renderUrl}/api/perfect-extraction`, {
                method: 'POST',
                body: formData,
                timeout: 180000 // 3 minute timeout
            });
            
            const responseText = await response.text();
            let responseData;
            
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = { rawResponse: responseText.substring(0, 1000) };
            }
            
            const success = response.ok && responseData.success !== false;
            
            testResults.tests.push({
                test: 'perfect_extraction_endpoint',
                passed: success,
                details: {
                    endpoint: '/api/perfect-extraction',
                    status: response.status,
                    success: success,
                    securities: responseData.securities?.length || 0,
                    totalValue: responseData.totalValue || responseData.summary?.totalValue || 0,
                    accuracy: responseData.accuracy || responseData.summary?.accuracy || 0,
                    response: responseData
                }
            });
            
            if (success) {
                await this.log(`✅ Perfect extraction: ${responseData.securities?.length || 0} securities found`);
                await this.log(`💰 Total value: ${responseData.totalValue || 0}`);
            } else {
                await this.log(`❌ Perfect extraction failed: ${response.status}`);
            }
            
        } catch (error) {
            await this.log('❌ Perfect extraction endpoint test failed', { error: error.message });
            testResults.tests.push({
                test: 'perfect_extraction_endpoint',
                passed: false,
                error: error.message
            });
        }
    }

    async compareWithExpectedResults(testResults) {
        await this.log('\\n🎯 COMPARING WITH EXPECTED RESULTS');
        
        const expected = {
            securities: 39,
            totalValue: 19464431,
            targetAccuracy: 92.21
        };
        
        // Find the best result from all tests
        let bestResult = null;
        let bestScore = 0;
        
        for (const test of testResults.tests) {
            if (test.passed && (test.details.securities || test.details.results?.securities)) {
                const securities = test.details.securities || test.details.results?.securities?.length || 0;
                const totalValue = test.details.totalValue || test.details.results?.totalValue || 0;
                
                const score = securities + (totalValue > 1000000 ? 10 : 0);
                if (score > bestScore) {
                    bestScore = score;
                    bestResult = test;
                }
            }
        }
        
        if (bestResult) {
            const securities = bestResult.details.securities || bestResult.details.results?.securities?.length || 0;
            const totalValue = bestResult.details.totalValue || bestResult.details.results?.totalValue || 0;
            
            const securitiesAccuracy = (securities / expected.securities) * 100;
            const valueAccuracy = totalValue > 0 ? 
                Math.max(0, 100 - Math.abs(totalValue - expected.totalValue) / expected.totalValue * 100) : 0;
            
            const overallAccuracy = (securitiesAccuracy + valueAccuracy) / 2;
            
            testResults.tests.push({
                test: 'accuracy_comparison',
                passed: overallAccuracy >= 80,
                details: {
                    expected: expected,
                    actual: {
                        securities: securities,
                        totalValue: totalValue,
                        securitiesAccuracy: securitiesAccuracy,
                        valueAccuracy: valueAccuracy,
                        overallAccuracy: overallAccuracy
                    },
                    bestTest: bestResult.test
                }
            });
            
            await this.log(`📊 ACCURACY COMPARISON:`);
            await this.log(`   Securities: ${securities}/${expected.securities} (${securitiesAccuracy.toFixed(1)}%)`);
            await this.log(`   Value: ${totalValue.toLocaleString()} vs ${expected.totalValue.toLocaleString()}`);
            await this.log(`   Overall: ${overallAccuracy.toFixed(1)}%`);
        }
    }

    async generateComprehensiveReport(testResults, totalTime) {
        const passed = testResults.tests.filter(t => t.passed).length;
        const total = testResults.tests.length;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        const report = {
            ...testResults,
            summary: {
                totalTests: total,
                passed: passed,
                failed: total - passed,
                successRate: successRate,
                totalTime: Math.round(totalTime / 1000),
                screenshots: this.screenshots,
                logFile: this.logFile
            }
        };
        
        // Save comprehensive report
        const reportFile = `comprehensive-live-test-report-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        // Generate HTML report
        const htmlReport = await this.generateHtmlReport(report);
        const htmlFile = reportFile.replace('.json', '.html');
        await fs.writeFile(htmlFile, htmlReport);
        
        // Display results
        await this.log('\\n📋 COMPREHENSIVE TEST RESULTS');
        await this.log('='.repeat(50));
        await this.log(`✅ Passed: ${passed}`);
        await this.log(`❌ Failed: ${total - passed}`);
        await this.log(`📊 Success Rate: ${successRate}%`);
        await this.log(`⏱️ Total Time: ${Math.round(totalTime / 1000)}s`);
        await this.log(`📷 Screenshots: ${this.screenshots.length}`);
        await this.log(`📄 JSON Report: ${reportFile}`);
        await this.log(`🌐 HTML Report: ${htmlFile}`);
        await this.log(`📝 Log File: ${this.logFile}`);
        
        if (successRate >= 90) {
            await this.log('\\n🎉 EXCELLENT! Live deployment working perfectly');
        } else if (successRate >= 70) {
            await this.log('\\n✅ GOOD! Live deployment mostly working');
        } else {
            await this.log('\\n⚠️ ISSUES DETECTED - Need to investigate');
        }
        
        return report;
    }

    async generateHtmlReport(report) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Live Testing Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 10px; }
        .summary { background: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .test { margin: 10px 0; padding: 10px; border-left: 4px solid #bdc3c7; }
        .passed { border-left-color: #27ae60; }
        .failed { border-left-color: #e74c3c; }
        .screenshot { max-width: 300px; margin: 10px 0; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Comprehensive Live Testing Report</h1>
        <p>Timestamp: ${report.timestamp}</p>
        <p>Target: ${report.renderUrl}</p>
    </div>
    
    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Total Tests:</strong> ${report.summary.totalTests}</p>
        <p><strong>Passed:</strong> ${report.summary.passed}</p>
        <p><strong>Failed:</strong> ${report.summary.failed}</p>
        <p><strong>Success Rate:</strong> ${report.summary.successRate}%</p>
        <p><strong>Total Time:</strong> ${report.summary.totalTime}s</p>
        <p><strong>Screenshots:</strong> ${report.summary.screenshots.length}</p>
    </div>
    
    <h2>🔍 Test Results</h2>
    ${report.tests.map(test => `
        <div class="test ${test.passed ? 'passed' : 'failed'}">
            <h3>${test.passed ? '✅' : '❌'} ${test.test}</h3>
            ${test.details ? `<pre>${JSON.stringify(test.details, null, 2)}</pre>` : ''}
            ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
        </div>
    `).join('')}
    
    <h2>📷 Screenshots</h2>
    ${report.summary.screenshots.map(screenshot => 
        `<img src="${screenshot}" class="screenshot" alt="${screenshot}">`
    ).join('')}
    
    <p><em>Generated at ${new Date().toISOString()}</em></p>
</body>
</html>`;
    }
}

// Run if called directly
if (require.main === module) {
    const suite = new ComprehensiveLiveTestingSuite();
    suite.runComprehensiveTests().catch(console.error);
}

module.exports = { ComprehensiveLiveTestingSuite };