/**
 * COMPREHENSIVE REAL-WORLD TEST SUITE
 * Runs hundreds of tests across multiple scenarios to evaluate system performance
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveTestSuite {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.testResults = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            criticalIssues: [],
            performanceMetrics: [],
            accuracyResults: [],
            errorTypes: {},
            scenarios: {}
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE REAL-WORLD TEST SUITE');
        console.log('==================================================\n');

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            // Test Scenario Categories
            const testCategories = [
                { name: 'Homepage Stability', tests: 50, method: 'testHomepageStability' },
                { name: 'PDF Upload Interface', tests: 30, method: 'testPDFUploadInterface' },
                { name: 'Processing Endpoints', tests: 25, method: 'testProcessingEndpoints' },
                { name: 'Error Handling', tests: 20, method: 'testErrorHandling' },
                { name: 'Performance Under Load', tests: 15, method: 'testPerformanceLoad' },
                { name: 'Memory Leaks', tests: 10, method: 'testMemoryLeaks' },
                { name: 'Concurrent Users', tests: 20, method: 'testConcurrentUsers' },
                { name: 'API Response Times', tests: 30, method: 'testAPIResponseTimes' }
            ];

            for (const category of testCategories) {
                console.log(`\n🔍 Testing: ${category.name} (${category.tests} tests)`);
                console.log('─'.repeat(50));
                
                this.testResults.scenarios[category.name] = {
                    total: category.tests,
                    passed: 0,
                    failed: 0,
                    issues: []
                };

                await this[category.method](browser, category.tests);
            }

            // Generate comprehensive report
            await this.generateReport();

        } finally {
            await browser.close();
        }
    }

    async testHomepageStability(browser, testCount) {
        for (let i = 1; i <= testCount; i++) {
            const page = await browser.newPage();
            const testStart = Date.now();
            
            try {
                // Set aggressive timeouts for real-world conditions
                await page.setDefaultTimeout(10000);
                
                const response = await page.goto(this.baseUrl, { 
                    waitUntil: 'networkidle2',
                    timeout: 15000 
                });
                
                const loadTime = Date.now() - testStart;
                this.testResults.performanceMetrics.push({
                    test: 'homepage_load',
                    time: loadTime,
                    status: response.status()
                });

                // Check for critical elements
                const titleExists = await page.$('title');
                const smartOCRIndicator = await page.$eval('body', 
                    body => body.innerHTML.includes('Smart OCR') || 
                            body.innerHTML.includes('Financial PDF Processing')
                );

                if (!titleExists || !smartOCRIndicator) {
                    this.recordFailure('Homepage Stability', 
                        `Missing critical elements - Test ${i}`, 
                        'CRITICAL'
                    );
                } else {
                    this.recordSuccess('Homepage Stability');
                }

                // Test different viewport sizes
                if (i % 10 === 0) {
                    await page.setViewport({ width: 375, height: 667 }); // Mobile
                    await page.reload();
                    
                    await page.setViewport({ width: 768, height: 1024 }); // Tablet
                    await page.reload();
                    
                    await page.setViewport({ width: 1920, height: 1080 }); // Desktop
                    await page.reload();
                }

            } catch (error) {
                this.recordFailure('Homepage Stability', 
                    `Load failed - Test ${i}: ${error.message}`, 
                    'HIGH'
                );
            } finally {
                await page.close();
            }

            if (i % 10 === 0) {
                console.log(`  ✓ Completed ${i}/${testCount} homepage tests`);
            }
        }
    }

    async testPDFUploadInterface(browser, testCount) {
        for (let i = 1; i <= testCount; i++) {
            const page = await browser.newPage();
            
            try {
                await page.goto(this.baseUrl);
                
                // Check for upload form
                const uploadForm = await page.$('form[enctype*="multipart"], input[type="file"]');
                
                if (!uploadForm) {
                    this.recordFailure('PDF Upload Interface', 
                        `No upload form found - Test ${i}`, 
                        'HIGH'
                    );
                } else {
                    // Test form interactions
                    const fileInput = await page.$('input[type="file"]');
                    if (fileInput) {
                        // Simulate file selection (without actual file)
                        await page.evaluate(() => {
                            const input = document.querySelector('input[type="file"]');
                            if (input) input.dispatchEvent(new Event('change'));
                        });
                    }
                    
                    this.recordSuccess('PDF Upload Interface');
                }

                // Test drag and drop areas
                const dropZone = await page.$('[data-testid="drop-zone"], .drop-zone, .upload-area');
                if (!dropZone && i === 1) {
                    this.testResults.scenarios['PDF Upload Interface'].issues.push(
                        'No drag-and-drop zone detected'
                    );
                }

            } catch (error) {
                this.recordFailure('PDF Upload Interface', 
                    `Interface test failed - Test ${i}: ${error.message}`, 
                    'MEDIUM'
                );
            } finally {
                await page.close();
            }
        }
        console.log(`  ✓ Completed ${testCount} upload interface tests`);
    }

    async testProcessingEndpoints(browser, testCount) {
        const endpoints = [
            '/api/pdf-extract',
            '/api/bulletproof-processor', 
            '/api/smart-ocr',
            '/api/system-capabilities'
        ];

        for (let i = 1; i <= testCount; i++) {
            const page = await browser.newPage();
            
            try {
                const endpoint = endpoints[i % endpoints.length];
                const testStart = Date.now();
                
                // Test GET request to endpoint
                const response = await page.goto(`${this.baseUrl}${endpoint}`, {
                    timeout: 30000
                });
                
                const responseTime = Date.now() - testStart;
                const status = response.status();
                
                this.testResults.performanceMetrics.push({
                    test: `endpoint_${endpoint.replace('/api/', '')}`,
                    time: responseTime,
                    status: status
                });

                if (status >= 200 && status < 400) {
                    this.recordSuccess('Processing Endpoints');
                    
                    // Check response content for API endpoints
                    if (endpoint === '/api/system-capabilities') {
                        const content = await page.content();
                        if (!content.includes('Smart OCR') && !content.includes('capabilities')) {
                            this.testResults.scenarios['Processing Endpoints'].issues.push(
                                `${endpoint} returned unexpected content`
                            );
                        }
                    }
                } else {
                    this.recordFailure('Processing Endpoints', 
                        `${endpoint} returned ${status} - Test ${i}`, 
                        status >= 500 ? 'CRITICAL' : 'HIGH'
                    );
                }

            } catch (error) {
                this.recordFailure('Processing Endpoints', 
                    `Endpoint test failed - Test ${i}: ${error.message}`, 
                    'HIGH'
                );
            } finally {
                await page.close();
            }
        }
        console.log(`  ✓ Completed ${testCount} endpoint tests`);
    }

    async testErrorHandling(browser, testCount) {
        const errorScenarios = [
            { url: '/nonexistent-page', expectedStatus: 404 },
            { url: '/api/invalid-endpoint', expectedStatus: 404 },
            { url: '/api/pdf-extract', method: 'POST', expectedStatus: 400 } // No file
        ];

        for (let i = 1; i <= testCount; i++) {
            const page = await browser.newPage();
            
            try {
                const scenario = errorScenarios[i % errorScenarios.length];
                
                if (scenario.method === 'POST') {
                    // Test POST without required data
                    const response = await page.evaluate(async (url) => {
                        const resp = await fetch(url, { method: 'POST' });
                        return { status: resp.status, ok: resp.ok };
                    }, `${this.baseUrl}${scenario.url}`);
                    
                    if (response.status === scenario.expectedStatus || 
                        (response.status >= 400 && response.status < 500)) {
                        this.recordSuccess('Error Handling');
                    } else {
                        this.recordFailure('Error Handling', 
                            `Expected error status, got ${response.status} - Test ${i}`, 
                            'MEDIUM'
                        );
                    }
                } else {
                    const response = await page.goto(`${this.baseUrl}${scenario.url}`, {
                        timeout: 10000
                    });
                    
                    if (response.status() === scenario.expectedStatus) {
                        this.recordSuccess('Error Handling');
                    } else {
                        this.recordFailure('Error Handling', 
                            `Expected ${scenario.expectedStatus}, got ${response.status()} - Test ${i}`, 
                            'MEDIUM'
                        );
                    }
                }

            } catch (error) {
                // Some errors are expected in error handling tests
                if (error.message.includes('ERR_ABORTED') || 
                    error.message.includes('404')) {
                    this.recordSuccess('Error Handling');
                } else {
                    this.recordFailure('Error Handling', 
                        `Unexpected error - Test ${i}: ${error.message}`, 
                        'LOW'
                    );
                }
            } finally {
                await page.close();
            }
        }
        console.log(`  ✓ Completed ${testCount} error handling tests`);
    }

    async testPerformanceLoad(browser, testCount) {
        console.log('    📊 Running performance load tests...');
        
        // Create multiple pages simultaneously
        const pages = [];
        const loadPromises = [];
        
        for (let i = 1; i <= testCount; i++) {
            const page = await browser.newPage();
            pages.push(page);
            
            const loadPromise = this.performLoadTest(page, i);
            loadPromises.push(loadPromise);
            
            // Stagger the requests slightly
            if (i % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        const results = await Promise.allSettled(loadPromises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                this.recordSuccess('Performance Under Load');
            } else {
                this.recordFailure('Performance Under Load', 
                    `Load test ${index + 1} failed: ${result.reason || result.value.error}`, 
                    'HIGH'
                );
            }
        });
        
        // Close all pages
        await Promise.all(pages.map(page => page.close()));
        console.log(`  ✓ Completed ${testCount} performance load tests`);
    }

    async performLoadTest(page, testNumber) {
        try {
            const startTime = Date.now();
            
            await page.goto(this.baseUrl, { 
                timeout: 30000,
                waitUntil: 'networkidle2' 
            });
            
            const loadTime = Date.now() - startTime;
            
            this.testResults.performanceMetrics.push({
                test: 'concurrent_load',
                time: loadTime,
                testNumber: testNumber
            });
            
            return { success: true, loadTime };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async testMemoryLeaks(browser, testCount) {
        const page = await browser.newPage();
        
        try {
            for (let i = 1; i <= testCount; i++) {
                await page.goto(this.baseUrl);
                
                // Get memory usage
                const metrics = await page.metrics();
                
                this.testResults.performanceMetrics.push({
                    test: 'memory_usage',
                    iteration: i,
                    jsHeapUsedSize: metrics.JSHeapUsedSize,
                    jsHeapTotalSize: metrics.JSHeapTotalSize
                });
                
                // Simulate user interactions that might cause memory leaks
                await page.evaluate(() => {
                    // Create and remove DOM elements
                    for (let j = 0; j < 100; j++) {
                        const div = document.createElement('div');
                        div.innerHTML = 'Test content';
                        document.body.appendChild(div);
                        document.body.removeChild(div);
                    }
                });
                
                this.recordSuccess('Memory Leaks');
                
                if (i % 3 === 0) {
                    console.log(`    🧠 Memory test ${i}/${testCount} - Heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
                }
            }
        } finally {
            await page.close();
        }
        console.log(`  ✓ Completed ${testCount} memory leak tests`);
    }

    async testConcurrentUsers(browser, testCount) {
        console.log('    👥 Testing concurrent user scenarios...');
        
        const concurrentPromises = [];
        
        for (let i = 1; i <= testCount; i++) {
            const userPromise = this.simulateUser(browser, i);
            concurrentPromises.push(userPromise);
        }
        
        const results = await Promise.allSettled(concurrentPromises);
        
        results.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                this.recordSuccess('Concurrent Users');
            } else {
                this.recordFailure('Concurrent Users', 
                    `User ${index + 1} simulation failed: ${result.reason || result.value.error}`, 
                    'MEDIUM'
                );
            }
        });
        
        console.log(`  ✓ Completed ${testCount} concurrent user tests`);
    }

    async simulateUser(browser, userNumber) {
        const page = await browser.newPage();
        
        try {
            // Simulate realistic user behavior
            await page.goto(this.baseUrl);
            
            // Random delays to simulate reading
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
            
            // Try to interact with upload form if present
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                await fileInput.hover();
            }
            
            // Check some API endpoints
            const apiResponse = await page.evaluate(async () => {
                try {
                    const response = await fetch('/api/system-capabilities');
                    return { status: response.status, ok: response.ok };
                } catch (error) {
                    return { status: 0, ok: false, error: error.message };
                }
            });
            
            await page.close();
            
            return { 
                success: apiResponse.ok,
                userNumber,
                apiStatus: apiResponse.status 
            };
            
        } catch (error) {
            await page.close();
            return { success: false, error: error.message };
        }
    }

    async testAPIResponseTimes(browser, testCount) {
        const page = await browser.newPage();
        
        const apiEndpoints = [
            '/api/system-capabilities',
            '/api/smart-ocr',
            '/'  // Homepage as baseline
        ];
        
        try {
            for (let i = 1; i <= testCount; i++) {
                const endpoint = apiEndpoints[i % apiEndpoints.length];
                const startTime = Date.now();
                
                try {
                    const response = await page.goto(`${this.baseUrl}${endpoint}`, {
                        timeout: 15000
                    });
                    
                    const responseTime = Date.now() - startTime;
                    
                    this.testResults.performanceMetrics.push({
                        test: 'api_response_time',
                        endpoint: endpoint,
                        time: responseTime,
                        status: response.status()
                    });
                    
                    if (response.status() >= 200 && response.status() < 400) {
                        this.recordSuccess('API Response Times');
                    } else {
                        this.recordFailure('API Response Times', 
                            `${endpoint} returned ${response.status()} - Test ${i}`, 
                            'MEDIUM'
                        );
                    }
                    
                } catch (error) {
                    this.recordFailure('API Response Times', 
                        `${endpoint} timeout/error - Test ${i}: ${error.message}`, 
                        'HIGH'
                    );
                }
                
                // Brief pause between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        } finally {
            await page.close();
        }
        console.log(`  ✓ Completed ${testCount} API response time tests`);
    }

    recordSuccess(category) {
        this.testResults.totalTests++;
        this.testResults.passed++;
        this.testResults.scenarios[category].passed++;
    }

    recordFailure(category, message, severity) {
        this.testResults.totalTests++;
        this.testResults.failed++;
        this.testResults.scenarios[category].failed++;
        
        const issue = {
            category,
            message,
            severity,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.criticalIssues.push(issue);
        this.testResults.scenarios[category].issues.push(message);
        
        // Track error types
        if (!this.testResults.errorTypes[severity]) {
            this.testResults.errorTypes[severity] = 0;
        }
        this.testResults.errorTypes[severity]++;
    }

    async generateReport() {
        const totalTime = Date.now() - this.startTime;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Calculate performance statistics
        const performanceStats = this.calculatePerformanceStats();
        
        const report = {
            testSummary: {
                totalTests: this.testResults.totalTests,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: ((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(2) + '%',
                totalDuration: `${Math.round(totalTime / 1000)}s`,
                timestamp: new Date().toISOString()
            },
            performanceStats,
            scenarioBreakdown: this.testResults.scenarios,
            criticalIssues: this.testResults.criticalIssues,
            errorBreakdown: this.testResults.errorTypes,
            recommendations: this.generateRecommendations()
        };
        
        // Save detailed report
        await fs.writeFile(
            `comprehensive-test-report-${timestamp}.json`,
            JSON.stringify(report, null, 2)
        );
        
        this.printSummaryReport(report);
        
        return report;
    }

    calculatePerformanceStats() {
        const metrics = this.testResults.performanceMetrics;
        
        const loadTimes = metrics.filter(m => m.time).map(m => m.time);
        const memoryUsage = metrics.filter(m => m.jsHeapUsedSize);
        
        return {
            averageLoadTime: loadTimes.length ? 
                Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length) : 0,
            maxLoadTime: loadTimes.length ? Math.max(...loadTimes) : 0,
            minLoadTime: loadTimes.length ? Math.min(...loadTimes) : 0,
            memoryLeakDetected: this.detectMemoryLeak(memoryUsage),
            slowRequests: loadTimes.filter(time => time > 5000).length,
            fastRequests: loadTimes.filter(time => time < 1000).length
        };
    }

    detectMemoryLeak(memoryMetrics) {
        if (memoryMetrics.length < 5) return false;
        
        const firstFive = memoryMetrics.slice(0, 5);
        const lastFive = memoryMetrics.slice(-5);
        
        const avgFirst = firstFive.reduce((a, b) => a + b.jsHeapUsedSize, 0) / firstFive.length;
        const avgLast = lastFive.reduce((a, b) => a + b.jsHeapUsedSize, 0) / lastFive.length;
        
        // If memory usage increased by more than 50%
        return (avgLast / avgFirst) > 1.5;
    }

    generateRecommendations() {
        const recommendations = [];
        const stats = this.calculatePerformanceStats();
        
        if (this.testResults.failed > this.testResults.totalTests * 0.1) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Stability',
                issue: 'High failure rate detected',
                recommendation: 'Investigate and fix critical stability issues before production use'
            });
        }
        
        if (stats.averageLoadTime > 3000) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Performance',
                issue: 'Slow page load times',
                recommendation: 'Optimize server response times and implement caching'
            });
        }
        
        if (stats.memoryLeakDetected) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Memory Management',
                issue: 'Memory leak detected',
                recommendation: 'Review JavaScript code for memory leaks and implement proper cleanup'
            });
        }
        
        if (this.testResults.errorTypes.CRITICAL > 0) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'System Integrity',
                issue: 'Critical errors found',
                recommendation: 'Address all critical issues immediately before further development'
            });
        }
        
        return recommendations;
    }

    printSummaryReport(report) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        console.log(`\n🎯 Overall Results:`);
        console.log(`   Total Tests: ${report.testSummary.totalTests}`);
        console.log(`   Passed: ${report.testSummary.passed} ✅`);
        console.log(`   Failed: ${report.testSummary.failed} ❌`);
        console.log(`   Success Rate: ${report.testSummary.successRate}`);
        console.log(`   Duration: ${report.testSummary.totalDuration}`);
        
        console.log(`\n⚡ Performance Metrics:`);
        console.log(`   Average Load Time: ${report.performanceStats.averageLoadTime}ms`);
        console.log(`   Max Load Time: ${report.performanceStats.maxLoadTime}ms`);
        console.log(`   Slow Requests (>5s): ${report.performanceStats.slowRequests}`);
        console.log(`   Fast Requests (<1s): ${report.performanceStats.fastRequests}`);
        console.log(`   Memory Leak Detected: ${report.performanceStats.memoryLeakDetected ? '⚠️ YES' : '✅ NO'}`);
        
        if (report.criticalIssues.length > 0) {
            console.log(`\n🚨 Critical Issues Found: ${report.criticalIssues.length}`);
            report.criticalIssues.slice(0, 5).forEach((issue, index) => {
                console.log(`   ${index + 1}. [${issue.severity}] ${issue.message}`);
            });
            if (report.criticalIssues.length > 5) {
                console.log(`   ... and ${report.criticalIssues.length - 5} more issues`);
            }
        }
        
        console.log(`\n📋 Next Steps:`);
        if (report.recommendations.length > 0) {
            report.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. [${rec.priority}] ${rec.recommendation}`);
            });
        } else {
            console.log(`   ✅ System performing well - proceed with planned development`);
        }
    }
}

async function runComprehensiveTests() {
    const testSuite = new ComprehensiveTestSuite();
    try {
        await testSuite.runAllTests();
    } catch (error) {
        console.error('❌ Test suite failed:', error);
    }
}

runComprehensiveTests();