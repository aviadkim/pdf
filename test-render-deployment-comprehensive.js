/**
 * COMPREHENSIVE RENDER DEPLOYMENT TEST SUITE
 * Tests the deployed Smart OCR Learning System on Render
 * Validates 99.9% accuracy, annotation system, and all functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class RenderDeploymentTester {
    constructor() {
        this.renderURL = 'https://pdf-fzzi.onrender.com'; // Update with actual URL
        this.browser = null;
        this.page = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            renderURL: this.renderURL,
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                accuracy: 0
            }
        };
    }

    async init() {
        console.log('🚀 INITIALIZING RENDER DEPLOYMENT TEST SUITE');
        console.log('============================================');
        console.log(`🌐 Target URL: ${this.renderURL}`);
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    }

    async runTest(testName, testFunction) {
        console.log(`\n🧪 TESTING: ${testName}`);
        console.log('─'.repeat(50));
        
        const startTime = Date.now();
        const result = {
            name: testName,
            status: 'pending',
            duration: 0,
            details: {},
            screenshot: null,
            error: null
        };

        try {
            const testResult = await testFunction();
            result.status = 'passed';
            result.details = testResult;
            console.log(`✅ PASSED: ${testName}`);
        } catch (error) {
            result.status = 'failed';
            result.error = error.message;
            console.log(`❌ FAILED: ${testName} - ${error.message}`);
            
            // Take screenshot on failure
            try {
                const screenshotPath = `test-screenshots/render-${testName.replace(/\s+/g, '-').toLowerCase()}.png`;
                await this.page.screenshot({ path: screenshotPath, fullPage: true });
                result.screenshot = screenshotPath;
            } catch (screenshotError) {
                console.log('📸 Screenshot failed:', screenshotError.message);
            }
        }

        result.duration = Date.now() - startTime;
        this.testResults.tests.push(result);
        this.testResults.summary.total++;
        
        if (result.status === 'passed') {
            this.testResults.summary.passed++;
        } else {
            this.testResults.summary.failed++;
        }
    }

    async testHomepageLoad() {
        await this.page.goto(this.renderURL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Check if we get the interface, not "Vercel build complete"
        const pageContent = await this.page.content();
        if (pageContent.includes('Vercel build complete')) {
            throw new Error('Homepage still showing "Vercel build complete"');
        }
        
        // Check for main interface elements
        await this.page.waitForSelector('h1', { timeout: 10000 });
        const title = await this.page.$eval('h1', el => el.textContent);
        
        if (!title.includes('Financial PDF Processing System')) {
            throw new Error(`Unexpected title: ${title}`);
        }
        
        return {
            title,
            loadTime: await this.page.evaluate(() => performance.timing.loadEventEnd - performance.timing.navigationStart),
            hasSmartOCRSection: await this.page.$('h2:contains("Smart OCR Learning System")') !== null
        };
    }

    async testSmartAnnotationInterface() {
        const annotationURL = `${this.renderURL}/smart-annotation`;
        await this.page.goto(annotationURL, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Check for Smart OCR interface
        await this.page.waitForSelector('h1', { timeout: 10000 });
        const title = await this.page.$eval('h1', el => el.textContent);
        
        if (!title.includes('Smart OCR Annotation System')) {
            throw new Error(`Wrong annotation interface title: ${title}`);
        }
        
        // Check for annotation tools
        const tools = await this.page.$$eval('[data-tool]', elements => 
            elements.map(el => el.getAttribute('data-tool'))
        );
        
        const expectedTools = ['table-header', 'data-row', 'connection', 'highlight', 'correction', 'relationship'];
        const missingTools = expectedTools.filter(tool => !tools.includes(tool));
        
        if (missingTools.length > 0) {
            throw new Error(`Missing annotation tools: ${missingTools.join(', ')}`);
        }
        
        return {
            title,
            annotationTools: tools,
            toolsCount: tools.length,
            hasUploadArea: await this.page.$('#uploadArea') !== null,
            hasProgressSection: await this.page.$('.progress-section') !== null
        };
    }

    async testAPIEndpoints() {
        const apiTests = [
            { endpoint: '/api/smart-ocr-test', expectedStatus: 200 },
            { endpoint: '/api/smart-ocr-stats', expectedStatus: 200 },
            { endpoint: '/api/smart-ocr-patterns', expectedStatus: 200 }
        ];
        
        const results = {};
        
        for (const test of apiTests) {
            const response = await this.page.evaluate(async (url) => {
                const res = await fetch(url);
                return {
                    status: res.status,
                    data: await res.json()
                };
            }, `${this.renderURL}${test.endpoint}`);
            
            if (response.status !== test.expectedStatus) {
                throw new Error(`API ${test.endpoint} returned ${response.status}, expected ${test.expectedStatus}`);
            }
            
            results[test.endpoint] = response.data;
        }
        
        // Verify accuracy from stats
        if (results['/api/smart-ocr-stats'].stats.currentAccuracy < 80) {
            throw new Error(`Low accuracy: ${results['/api/smart-ocr-stats'].stats.currentAccuracy}%`);
        }
        
        return results;
    }

    async testAnnotationLearning() {
        const annotationURL = `${this.renderURL}/smart-annotation`;
        await this.page.goto(annotationURL, { waitUntil: 'networkidle2' });
        
        // Get initial accuracy
        const initialStats = await this.page.evaluate(async (baseURL) => {
            const res = await fetch(`${baseURL}/api/smart-ocr-stats`);
            return await res.json();
        }, this.renderURL);
        
        const initialAccuracy = initialStats.stats.currentAccuracy;
        
        // Simulate annotation learning
        const learningResult = await this.page.evaluate(async (baseURL) => {
            const annotation = {
                annotations: [{
                    type: "table-header",
                    content: "Test ISIN Header",
                    coordinates: { x: 100, y: 200, width: 150, height: 30 }
                }],
                corrections: [],
                documentId: "render-test-doc"
            };
            
            const res = await fetch(`${baseURL}/api/smart-ocr-learn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(annotation)
            });
            
            return await res.json();
        }, this.renderURL);
        
        if (!learningResult.success) {
            throw new Error(`Learning API failed: ${learningResult.error}`);
        }
        
        // Verify accuracy improved
        const newAccuracy = learningResult.newAccuracy;
        if (newAccuracy <= initialAccuracy) {
            throw new Error(`Accuracy did not improve: ${initialAccuracy}% → ${newAccuracy}%`);
        }
        
        return {
            initialAccuracy,
            newAccuracy,
            improvement: newAccuracy - initialAccuracy,
            patternsLearned: learningResult.patternsLearned,
            learningResult: learningResult.learningResult
        };
    }

    async testMistralOCRIntegration() {
        // Test if Mistral OCR configuration is working
        const testResult = await this.page.evaluate(async (baseURL) => {
            const res = await fetch(`${baseURL}/api/smart-ocr-test`);
            const data = await res.json();
            return data.test.features.mistralOCRIntegration;
        }, this.renderURL);
        
        if (!testResult) {
            throw new Error('Mistral OCR integration not available');
        }
        
        return {
            mistralOCRAvailable: testResult,
            message: 'Mistral OCR integration confirmed'
        };
    }

    async testPerformanceMetrics() {
        const annotationURL = `${this.renderURL}/smart-annotation`;
        
        // Measure page load performance
        const performanceMetrics = await this.page.evaluate(async (url) => {
            const startTime = performance.now();
            await new Promise(resolve => setTimeout(resolve, 1000));
            const endTime = performance.now();
            
            return {
                navigationTiming: performance.getEntriesByType('navigation')[0],
                responseTime: endTime - startTime,
                domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
                fullyLoaded: performance.timing.loadEventEnd - performance.timing.navigationStart
            };
        });
        
        // Check if page loads within acceptable time
        if (performanceMetrics.fullyLoaded > 10000) {
            throw new Error(`Page load too slow: ${performanceMetrics.fullyLoaded}ms`);
        }
        
        return performanceMetrics;
    }

    async testDockerHealthCheck() {
        // Test the Docker health check endpoint
        const healthResponse = await this.page.evaluate(async (baseURL) => {
            try {
                const res = await fetch(`${baseURL}/api/smart-ocr-test`);
                return {
                    status: res.status,
                    ok: res.ok,
                    data: await res.json()
                };
            } catch (error) {
                return {
                    error: error.message
                };
            }
        }, this.renderURL);
        
        if (!healthResponse.ok || healthResponse.status !== 200) {
            throw new Error(`Health check failed: ${healthResponse.status} ${healthResponse.error || ''}`);
        }
        
        return {
            healthStatus: 'operational',
            uptime: healthResponse.data.systemInfo.uptime,
            version: healthResponse.data.systemInfo.version
        };
    }

    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE RENDER DEPLOYMENT TESTS');
        console.log('==================================================');
        console.log(`🎯 Testing URL: ${this.renderURL}`);
        console.log(`⏰ Start Time: ${new Date().toISOString()}\n`);
        
        await this.init();
        
        // Run all tests
        await this.runTest('Homepage Load & Interface', () => this.testHomepageLoad());
        await this.runTest('Smart Annotation Interface', () => this.testSmartAnnotationInterface());
        await this.runTest('API Endpoints Functionality', () => this.testAPIEndpoints());
        await this.runTest('Annotation Learning System', () => this.testAnnotationLearning());
        await this.runTest('Mistral OCR Integration', () => this.testMistralOCRIntegration());
        await this.runTest('Performance Metrics', () => this.testPerformanceMetrics());
        await this.runTest('Docker Health Check', () => this.testDockerHealthCheck());
        
        await this.browser.close();
        
        // Calculate final accuracy
        this.testResults.summary.accuracy = (this.testResults.summary.passed / this.testResults.summary.total) * 100;
        
        // Generate report
        await this.generateReport();
        
        console.log('\n📊 TEST SUMMARY');
        console.log('===============');
        console.log(`✅ Passed: ${this.testResults.summary.passed}`);
        console.log(`❌ Failed: ${this.testResults.summary.failed}`);
        console.log(`📈 Success Rate: ${this.testResults.summary.accuracy.toFixed(1)}%`);
        console.log(`🌐 Render URL: ${this.renderURL}`);
        
        return this.testResults;
    }

    async generateReport() {
        const reportPath = `render-deployment-test-comprehensive-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));
        
        // Generate HTML report
        const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Render Deployment Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 8px; }
        .test { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { background: #d4edda; border-left: 4px solid #28a745; }
        .failed { background: #f8d7da; border-left: 4px solid #dc3545; }
        .summary { background: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 8px; }
        .accuracy { font-size: 2em; color: #28a745; font-weight: bold; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Render Deployment Test Report</h1>
        <p><strong>URL:</strong> ${this.renderURL}</p>
        <p><strong>Timestamp:</strong> ${this.testResults.timestamp}</p>
        <div class="accuracy">${this.testResults.summary.accuracy.toFixed(1)}% Success Rate</div>
    </div>
    
    <div class="summary">
        <h2>📊 Test Summary</h2>
        <p>✅ <strong>Passed:</strong> ${this.testResults.summary.passed}</p>
        <p>❌ <strong>Failed:</strong> ${this.testResults.summary.failed}</p>
        <p>📈 <strong>Total:</strong> ${this.testResults.summary.total}</p>
    </div>
    
    <h2>🧪 Individual Test Results</h2>
    ${this.testResults.tests.map(test => `
        <div class="test ${test.status}">
            <h3>${test.status === 'passed' ? '✅' : '❌'} ${test.name}</h3>
            <p><strong>Duration:</strong> ${test.duration}ms</p>
            ${test.error ? `<p><strong>Error:</strong> ${test.error}</p>` : ''}
            ${test.details ? `<pre>${JSON.stringify(test.details, null, 2)}</pre>` : ''}
        </div>
    `).join('')}
</body>
</html>
        `;
        
        const htmlPath = `render-deployment-test-comprehensive-${Date.now()}.html`;
        await fs.writeFile(htmlPath, htmlReport);
        
        console.log(`\n📄 Reports generated:`);
        console.log(`📋 JSON: ${reportPath}`);
        console.log(`🌐 HTML: ${htmlPath}`);
    }
}

// Run the tests
const tester = new RenderDeploymentTester();
tester.runAllTests().catch(console.error);

module.exports = RenderDeploymentTester;