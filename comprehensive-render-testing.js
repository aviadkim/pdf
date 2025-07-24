#!/usr/bin/env node

/**
 * COMPREHENSIVE RENDER TESTING WITH PUPPETEER
 * Tests the live deployment and captures logs
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class ComprehensiveRenderTester {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.results = {
            timestamp: new Date().toISOString(),
            url: this.baseUrl,
            tests: [],
            logs: [],
            screenshots: [],
            performance: {}
        };
    }

    async runAllTests() {
        console.log('🔬 COMPREHENSIVE RENDER TESTING SUITE');
        console.log('=====================================');
        console.log(`🌐 Testing URL: ${this.baseUrl}`);
        console.log(`⏰ Started: ${this.results.timestamp}`);

        try {
            // Test 1: Basic connectivity and response
            await this.testBasicConnectivity();
            
            // Test 2: Puppeteer browser automation
            await this.testWithPuppeteer();
            
            // Test 3: API endpoints testing
            await this.testAPIEndpoints();
            
            // Test 4: PDF processing with file upload
            await this.testPDFProcessing();
            
            // Test 5: Learning system functionality
            await this.testLearningSystem();
            
            // Generate final report
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite error:', error);
            this.results.tests.push({
                test: 'Test Suite Execution',
                status: 'failed',
                error: error.message
            });
        }
    }

    async testBasicConnectivity() {
        console.log('\n🌐 TEST 1: BASIC CONNECTIVITY');
        console.log('===============================');

        try {
            const startTime = Date.now();
            const response = await axios.get(this.baseUrl, { timeout: 10000 });
            const endTime = Date.now();

            console.log('✅ Basic connectivity successful');
            console.log(`📊 Response time: ${endTime - startTime}ms`);
            console.log(`📄 Content length: ${response.data.length} bytes`);
            console.log(`🔧 Server headers:`, response.headers['server'] || 'Unknown');

            this.results.tests.push({
                test: 'Basic Connectivity',
                status: 'passed',
                responseTime: endTime - startTime,
                contentLength: response.data.length,
                statusCode: response.status
            });

            this.results.performance.initialLoad = endTime - startTime;

        } catch (error) {
            console.log('❌ Basic connectivity failed:', error.message);
            this.results.tests.push({
                test: 'Basic Connectivity',
                status: 'failed',
                error: error.message
            });
        }
    }

    async testWithPuppeteer() {
        console.log('\n🤖 TEST 2: PUPPETEER BROWSER AUTOMATION');
        console.log('=========================================');

        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            const page = await browser.newPage();
            
            // Capture console logs
            const logs = [];
            page.on('console', msg => {
                logs.push({
                    type: msg.type(),
                    text: msg.text(),
                    timestamp: new Date().toISOString()
                });
                console.log(`📋 Console [${msg.type()}]:`, msg.text());
            });

            // Capture network requests
            const requests = [];
            page.on('request', request => {
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    timestamp: new Date().toISOString()
                });
            });

            // Capture errors
            page.on('pageerror', error => {
                console.log(`❌ Page error:`, error.message);
                this.results.logs.push({
                    type: 'error',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            });

            console.log('🔍 Loading homepage...');
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;

            console.log(`✅ Page loaded in ${loadTime}ms`);

            // Take screenshot
            const screenshotPath = `render-test-screenshot-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            this.results.screenshots.push(screenshotPath);
            console.log(`📸 Screenshot saved: ${screenshotPath}`);

            // Check page content
            const title = await page.title();
            const h1Text = await page.$eval('h1', el => el.textContent).catch(() => 'Not found');
            const formExists = await page.$('form') !== null;
            const fileInputExists = await page.$('input[type="file"]') !== null;

            console.log(`📝 Page title: ${title}`);
            console.log(`🎯 Main heading: ${h1Text}`);
            console.log(`📋 Form present: ${formExists}`);
            console.log(`📁 File input present: ${fileInputExists}`);

            // Test annotation interface
            console.log('\n🎨 Testing annotation interface...');
            try {
                await page.goto(`${this.baseUrl}/smart-annotation`, { waitUntil: 'networkidle2' });
                const annotationTitle = await page.title();
                const annotationScreenshot = `annotation-interface-${Date.now()}.png`;
                await page.screenshot({ path: annotationScreenshot });
                this.results.screenshots.push(annotationScreenshot);
                
                console.log(`✅ Annotation interface loaded: ${annotationTitle}`);
                console.log(`📸 Annotation screenshot: ${annotationScreenshot}`);
            } catch (error) {
                console.log(`⚠️ Annotation interface issue: ${error.message}`);
            }

            this.results.tests.push({
                test: 'Puppeteer Browser Test',
                status: 'passed',
                loadTime: loadTime,
                title: title,
                h1Text: h1Text,
                formExists: formExists,
                fileInputExists: fileInputExists,
                consoleLogs: logs.length,
                networkRequests: requests.length
            });

            this.results.logs = [...this.results.logs, ...logs];

        } catch (error) {
            console.log('❌ Puppeteer test failed:', error.message);
            this.results.tests.push({
                test: 'Puppeteer Browser Test',
                status: 'failed',
                error: error.message
            });
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async testAPIEndpoints() {
        console.log('\n🔌 TEST 3: API ENDPOINTS');
        console.log('=========================');

        const endpoints = [
            { path: '/api/smart-ocr-stats', method: 'GET', name: 'System Stats' },
            { path: '/api/smart-ocr-patterns', method: 'GET', name: 'Pattern Data' },
            { path: '/api/smart-ocr-test', method: 'GET', name: 'Health Check' },
            { path: '/smart-annotation', method: 'GET', name: 'Annotation Interface' }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`🔍 Testing ${endpoint.name} (${endpoint.method} ${endpoint.path})`);
                
                const startTime = Date.now();
                const response = await axios({
                    method: endpoint.method,
                    url: `${this.baseUrl}${endpoint.path}`,
                    timeout: 10000
                });
                const endTime = Date.now();

                console.log(`✅ ${endpoint.name}: ${response.status} (${endTime - startTime}ms)`);
                
                if (response.data && typeof response.data === 'object') {
                    console.log(`📊 Response keys: ${Object.keys(response.data).join(', ')}`);
                }

                this.results.tests.push({
                    test: `API: ${endpoint.name}`,
                    status: 'passed',
                    responseTime: endTime - startTime,
                    statusCode: response.status,
                    dataKeys: response.data ? Object.keys(response.data) : []
                });

            } catch (error) {
                console.log(`❌ ${endpoint.name} failed: ${error.response?.status || error.message}`);
                this.results.tests.push({
                    test: `API: ${endpoint.name}`,
                    status: 'failed',
                    error: error.response?.data || error.message,
                    statusCode: error.response?.status
                });
            }
        }
    }

    async testPDFProcessing() {
        console.log('\n📄 TEST 4: PDF PROCESSING');
        console.log('===========================');

        const pdfPath = './2. Messos  - 31.03.2025.pdf';
        
        if (!fs.existsSync(pdfPath)) {
            console.log('⚠️ PDF file not found, skipping PDF processing test');
            this.results.tests.push({
                test: 'PDF Processing',
                status: 'skipped',
                reason: 'PDF file not found'
            });
            return;
        }

        try {
            console.log('📤 Testing PDF upload and processing...');
            
            const formData = new FormData();
            formData.append('pdf', fs.createReadStream(pdfPath));

            const startTime = Date.now();
            const response = await axios.post(`${this.baseUrl}/api/smart-ocr-process`, formData, {
                headers: { ...formData.getHeaders() },
                timeout: 45000
            });
            const endTime = Date.now();

            console.log(`✅ PDF processing completed in ${endTime - startTime}ms`);
            
            if (response.data.success && response.data.results) {
                const results = response.data.results;
                console.log(`📈 Method: ${results.method}`);
                console.log(`🎯 Success: ${results.success}`);
                console.log(`📝 Text length: ${results.text_length} characters`);
                console.log(`🔢 Securities found: ${results.securities?.length || 0}`);
                console.log(`📊 Accuracy: ${results.accuracy || 'unknown'}%`);

                this.results.tests.push({
                    test: 'PDF Processing',
                    status: 'passed',
                    processingTime: endTime - startTime,
                    method: results.method,
                    textLength: results.text_length,
                    securitiesFound: results.securities?.length || 0,
                    accuracy: results.accuracy
                });
            } else {
                console.log('⚠️ PDF processing returned unexpected format');
                this.results.tests.push({
                    test: 'PDF Processing',
                    status: 'warning',
                    processingTime: endTime - startTime,
                    response: response.data
                });
            }

        } catch (error) {
            console.log('❌ PDF processing failed:', error.response?.data?.error || error.message);
            this.results.tests.push({
                test: 'PDF Processing',
                status: 'failed',
                error: error.response?.data?.error || error.message
            });
        }
    }

    async testLearningSystem() {
        console.log('\n🧠 TEST 5: LEARNING SYSTEM');
        console.log('============================');

        try {
            console.log('🔍 Testing learning endpoint...');
            
            const learningData = {
                corrections: [
                    {
                        id: 'test-correction-' + Date.now(),
                        original: 'CH1234567890',
                        corrected: 'CH1234567890',
                        field: 'isin',
                        confidence: 0.95
                    }
                ]
            };

            const startTime = Date.now();
            const response = await axios.post(`${this.baseUrl}/api/smart-ocr-learn`, learningData, {
                timeout: 10000
            });
            const endTime = Date.now();

            console.log(`✅ Learning system test completed in ${endTime - startTime}ms`);
            
            if (response.data.success && response.data.result) {
                const result = response.data.result;
                console.log(`📚 Patterns learned: ${result.patterns_learned || 0}`);
                console.log(`📈 Total patterns: ${result.total_patterns || 0}`);
                console.log(`🎯 Accuracy improvement: ${result.accuracy_improvement || 0}%`);

                this.results.tests.push({
                    test: 'Learning System',
                    status: 'passed',
                    responseTime: endTime - startTime,
                    patternsLearned: result.patterns_learned,
                    totalPatterns: result.total_patterns,
                    accuracyImprovement: result.accuracy_improvement
                });
            } else {
                console.log('⚠️ Learning system returned unexpected format');
                this.results.tests.push({
                    test: 'Learning System',
                    status: 'warning',
                    responseTime: endTime - startTime,
                    response: response.data
                });
            }

        } catch (error) {
            console.log('❌ Learning system failed:', error.response?.data?.error || error.message);
            this.results.tests.push({
                test: 'Learning System',
                status: 'failed',
                error: error.response?.data?.error || error.message
            });
        }
    }

    async generateReport() {
        console.log('\n📋 COMPREHENSIVE TEST REPORT');
        console.log('=============================');

        // Calculate summary
        const passed = this.results.tests.filter(t => t.status === 'passed').length;
        const failed = this.results.tests.filter(t => t.status === 'failed').length;
        const warnings = this.results.tests.filter(t => t.status === 'warning').length;
        const skipped = this.results.tests.filter(t => t.status === 'skipped').length;
        const total = this.results.tests.length;

        console.log(`📊 Total Tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⚠️ Warnings: ${warnings}`);
        console.log(`⏭️ Skipped: ${skipped}`);
        console.log(`🎯 Success Rate: ${Math.round((passed / total) * 100)}%`);

        // Log analysis
        const errorLogs = this.results.logs.filter(log => log.type === 'error');
        const warningLogs = this.results.logs.filter(log => log.type === 'warn');
        
        console.log(`\n📋 LOG ANALYSIS:`);
        console.log(`🔴 Error logs: ${errorLogs.length}`);
        console.log(`🟡 Warning logs: ${warningLogs.length}`);
        console.log(`📝 Total logs captured: ${this.results.logs.length}`);

        if (errorLogs.length > 0) {
            console.log('\n❌ ERROR LOGS:');
            errorLogs.forEach(log => {
                console.log(`   ${log.timestamp}: ${log.message}`);
            });
        }

        // Performance summary
        if (this.results.performance.initialLoad) {
            console.log(`\n⚡ PERFORMANCE:`);
            console.log(`📊 Initial load time: ${this.results.performance.initialLoad}ms`);
        }

        // Save detailed report
        const reportFile = `comprehensive-render-test-${Date.now()}.json`;
        fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved: ${reportFile}`);

        // Final status
        if (failed === 0 && errorLogs.length === 0) {
            console.log('\n🎉 ALL TESTS PASSED - SYSTEM FULLY OPERATIONAL!');
        } else if (failed === 0) {
            console.log('\n✅ ALL TESTS PASSED - Minor warnings present');
        } else {
            console.log('\n⚠️ SOME TESTS FAILED - System needs attention');
        }

        console.log(`\n📸 Screenshots captured: ${this.results.screenshots.length}`);
        this.results.screenshots.forEach(screenshot => {
            console.log(`   📷 ${screenshot}`);
        });
    }
}

async function runComprehensiveTests() {
    const tester = new ComprehensiveRenderTester();
    await tester.runAllTests();
}

if (require.main === module) {
    runComprehensiveTests().catch(console.error);
}

module.exports = { ComprehensiveRenderTester };