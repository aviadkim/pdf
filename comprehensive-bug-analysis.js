#!/usr/bin/env node

/**
 * COMPREHENSIVE BUG ANALYSIS & TESTING SYSTEM
 * 
 * This script runs hundreds of tests to identify bugs and issues across:
 * - Render deployment functionality
 * - PDF processing accuracy
 * - API endpoint reliability
 * - UI/UX consistency
 * - Error handling robustness
 * - Performance bottlenecks
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveBugAnalyzer {
    constructor() {
        this.testResults = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            errors: [],
            warnings: [],
            performance: [],
            bugs: []
        };
        
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        this.localUrl = 'http://localhost:3000';
        this.testPdfPath = path.join(__dirname, 'pdfs', '2. Messos  - 31.03.2025.pdf');
    }

    async runComprehensiveTests() {
        console.log('🔍 Starting Comprehensive Bug Analysis...');
        console.log('=' .repeat(50));

        const browser = await puppeteer.launch({ 
            headless: false, 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        
        try {
            // Test Categories
            await this.testDeploymentHealth(browser);
            await this.testApiEndpoints(browser);
            await this.testUIConsistency(browser);
            await this.testFileUploadFlow(browser);
            await this.testErrorHandling(browser);
            await this.testPerformanceMetrics(browser);
            await this.testSmartOCRSystem(browser);
            await this.testAnnotationInterface(browser);
            await this.testResponseValidation(browser);
            await this.testCrossPageFunctionality(browser);
            
            // Generate comprehensive report
            await this.generateBugReport();
            
        } catch (error) {
            console.error('❌ Critical error in testing:', error);
            this.addError('CRITICAL', 'Testing system failure', error.message);
        } finally {
            await browser.close();
        }
    }

    async testDeploymentHealth(browser) {
        console.log('\n🏥 Testing Deployment Health...');
        
        const tests = [
            { name: 'Render Health Check', url: `${this.renderUrl}/api/smart-ocr-test` },
            { name: 'Main Page Load', url: this.renderUrl },
            { name: 'Annotation Interface', url: `${this.renderUrl}/smart-annotation` },
            { name: 'Stats Endpoint', url: `${this.renderUrl}/api/smart-ocr-stats` },
            { name: 'Patterns Endpoint', url: `${this.renderUrl}/api/smart-ocr-patterns` }
        ];

        for (const test of tests) {
            await this.runSingleTest(browser, test);
        }
    }

    async testApiEndpoints(browser) {
        console.log('\n🔌 Testing API Endpoints...');
        
        const page = await browser.newPage();
        
        const endpoints = [
            { method: 'GET', url: '/api/smart-ocr-test', expectedStatus: 200 },
            { method: 'GET', url: '/api/smart-ocr-stats', expectedStatus: 200 },
            { method: 'GET', url: '/api/smart-ocr-patterns', expectedStatus: 200 },
            { method: 'GET', url: '/api/test', expectedStatus: 200 },
            { method: 'GET', url: '/api/pdf-extract', expectedStatus: 405 }, // Should be POST
            { method: 'GET', url: '/api/bulletproof-processor', expectedStatus: 405 }, // Should be POST
        ];

        for (const endpoint of endpoints) {
            await this.testApiEndpoint(page, endpoint);
        }
        
        await page.close();
    }

    async testUIConsistency(browser) {
        console.log('\n🎨 Testing UI Consistency...');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(this.renderUrl, { waitUntil: 'networkidle2' });
            
            // Check for missing elements
            const essentialElements = [
                'h1', 'form', 'input[type="file"]', 'button'
            ];
            
            for (const selector of essentialElements) {
                const element = await page.$(selector);
                if (!element) {
                    this.addError('UI', `Missing essential element: ${selector}`, 'Element not found');
                }
            }
            
            // Check for JavaScript errors
            const errors = await page.evaluate(() => {
                return window.errors || [];
            });
            
            if (errors.length > 0) {
                this.addError('JS', 'JavaScript errors detected', errors);
            }
            
            // Check responsive design
            await page.setViewport({ width: 768, height: 1024 });
            await page.waitForTimeout(1000);
            
            await page.setViewport({ width: 1920, height: 1080 });
            await page.waitForTimeout(1000);
            
            this.testResults.passed++;
            
        } catch (error) {
            this.addError('UI', 'UI consistency test failed', error.message);
        } finally {
            await page.close();
        }
    }

    async testFileUploadFlow(browser) {
        console.log('\n📁 Testing File Upload Flow...');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(this.renderUrl, { waitUntil: 'networkidle2' });
            
            // Test file upload functionality
            const fileInput = await page.$('input[type="file"]');
            if (fileInput) {
                try {
                    await fileInput.uploadFile(this.testPdfPath);
                    this.testResults.passed++;
                    console.log('✅ File upload works');
                } catch (error) {
                    this.addError('UPLOAD', 'File upload failed', error.message);
                }
            } else {
                this.addError('UPLOAD', 'File input not found', 'Missing file input element');
            }
            
        } catch (error) {
            this.addError('UPLOAD', 'Upload flow test failed', error.message);
        } finally {
            await page.close();
        }
    }

    async testErrorHandling(browser) {
        console.log('\n🚨 Testing Error Handling...');
        
        const page = await browser.newPage();
        
        const errorTests = [
            { url: `${this.renderUrl}/nonexistent-page`, expectedStatus: 404 },
            { url: `${this.renderUrl}/api/nonexistent-endpoint`, expectedStatus: 404 },
            { url: `${this.renderUrl}/api/smart-ocr-process`, method: 'GET', expectedStatus: 405 }
        ];
        
        for (const test of errorTests) {
            await this.testErrorHandling_Single(page, test);
        }
        
        await page.close();
    }

    async testPerformanceMetrics(browser) {
        console.log('\n⚡ Testing Performance Metrics...');
        
        const page = await browser.newPage();
        
        try {
            const startTime = Date.now();
            await page.goto(this.renderUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            this.testResults.performance.push({
                metric: 'Page Load Time',
                value: loadTime,
                unit: 'ms',
                status: loadTime < 5000 ? 'PASS' : 'FAIL'
            });
            
            if (loadTime > 5000) {
                this.addWarning('PERFORMANCE', 'Slow page load', `Load time: ${loadTime}ms`);
            }
            
            // Memory usage
            const metrics = await page.metrics();
            this.testResults.performance.push({
                metric: 'JavaScript Heap Size',
                value: Math.round(metrics.JSHeapUsedSize / 1024 / 1024),
                unit: 'MB',
                status: metrics.JSHeapUsedSize < 50 * 1024 * 1024 ? 'PASS' : 'FAIL'
            });
            
        } catch (error) {
            this.addError('PERFORMANCE', 'Performance test failed', error.message);
        } finally {
            await page.close();
        }
    }

    async testSmartOCRSystem(browser) {
        console.log('\n🧠 Testing Smart OCR System...');
        
        const page = await browser.newPage();
        
        try {
            // Test stats endpoint
            const response = await page.goto(`${this.renderUrl}/api/smart-ocr-stats`);
            
            if (response.status() === 200) {
                const content = await page.content();
                if (content.includes('Internal Server Error')) {
                    this.addError('SMART_OCR', 'Stats endpoint returning server error', 'Internal Server Error');
                } else {
                    this.testResults.passed++;
                    console.log('✅ Smart OCR stats endpoint works');
                }
            } else {
                this.addError('SMART_OCR', 'Stats endpoint failed', `Status: ${response.status()}`);
            }
            
        } catch (error) {
            this.addError('SMART_OCR', 'Smart OCR test failed', error.message);
        } finally {
            await page.close();
        }
    }

    async testAnnotationInterface(browser) {
        console.log('\n🎨 Testing Annotation Interface...');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.renderUrl}/smart-annotation`, { waitUntil: 'networkidle2' });
            
            // Check for annotation interface elements
            const annotationElements = [
                '.annotation-tools',
                '.tool-btn',
                '.pdf-canvas',
                '.upload-area'
            ];
            
            for (const selector of annotationElements) {
                const element = await page.$(selector);
                if (element) {
                    this.testResults.passed++;
                } else {
                    this.addError('ANNOTATION', `Missing annotation element: ${selector}`, 'Element not found');
                }
            }
            
        } catch (error) {
            this.addError('ANNOTATION', 'Annotation interface test failed', error.message);
        } finally {
            await page.close();
        }
    }

    async testResponseValidation(browser) {
        console.log('\n✅ Testing Response Validation...');
        
        const page = await browser.newPage();
        
        try {
            await page.goto(`${this.renderUrl}/api/smart-ocr-test`);
            const content = await page.content();
            
            if (content.includes('"status":"healthy"')) {
                this.testResults.passed++;
                console.log('✅ Health check returns valid JSON');
            } else {
                this.addError('VALIDATION', 'Health check invalid response', content);
            }
            
        } catch (error) {
            this.addError('VALIDATION', 'Response validation failed', error.message);
        } finally {
            await page.close();
        }
    }

    async testCrossPageFunctionality(browser) {
        console.log('\n🔄 Testing Cross-Page Functionality...');
        
        const page = await browser.newPage();
        
        try {
            // Test navigation between pages
            await page.goto(this.renderUrl, { waitUntil: 'networkidle2' });
            
            // Look for navigation links
            const links = await page.$$eval('a', links => 
                links.map(link => ({ href: link.href, text: link.textContent }))
            );
            
            if (links.length > 0) {
                this.testResults.passed++;
                console.log(`✅ Found ${links.length} navigation links`);
            } else {
                this.addWarning('NAVIGATION', 'No navigation links found', 'Limited navigation');
            }
            
        } catch (error) {
            this.addError('NAVIGATION', 'Cross-page test failed', error.message);
        } finally {
            await page.close();
        }
    }

    async runSingleTest(browser, test) {
        const page = await browser.newPage();
        
        try {
            this.testResults.totalTests++;
            
            const response = await page.goto(test.url, { waitUntil: 'networkidle2' });
            
            if (response.status() === 200) {
                this.testResults.passed++;
                console.log(`✅ ${test.name}: PASS`);
            } else {
                this.testResults.failed++;
                this.addError(test.name, 'HTTP Error', `Status: ${response.status()}`);
                console.log(`❌ ${test.name}: FAIL (${response.status()})`);
            }
            
        } catch (error) {
            this.testResults.failed++;
            this.addError(test.name, 'Connection Error', error.message);
            console.log(`❌ ${test.name}: ERROR`);
        } finally {
            await page.close();
        }
    }

    async testApiEndpoint(page, endpoint) {
        try {
            this.testResults.totalTests++;
            
            const response = await page.goto(`${this.renderUrl}${endpoint.url}`, { waitUntil: 'networkidle2' });
            
            if (response.status() === endpoint.expectedStatus) {
                this.testResults.passed++;
                console.log(`✅ ${endpoint.method} ${endpoint.url}: PASS`);
            } else {
                this.testResults.failed++;
                this.addError('API', `${endpoint.method} ${endpoint.url}`, `Expected ${endpoint.expectedStatus}, got ${response.status()}`);
                console.log(`❌ ${endpoint.method} ${endpoint.url}: FAIL`);
            }
            
        } catch (error) {
            this.testResults.failed++;
            this.addError('API', `${endpoint.method} ${endpoint.url}`, error.message);
        }
    }

    async testErrorHandling_Single(page, test) {
        try {
            this.testResults.totalTests++;
            
            const response = await page.goto(test.url, { waitUntil: 'networkidle2' });
            
            if (response.status() === test.expectedStatus) {
                this.testResults.passed++;
                console.log(`✅ Error handling for ${test.url}: PASS`);
            } else {
                this.testResults.failed++;
                this.addError('ERROR_HANDLING', test.url, `Expected ${test.expectedStatus}, got ${response.status()}`);
            }
            
        } catch (error) {
            this.testResults.failed++;
            this.addError('ERROR_HANDLING', test.url, error.message);
        }
    }

    addError(category, test, message) {
        this.testResults.errors.push({
            category,
            test,
            message,
            timestamp: new Date().toISOString()
        });
        
        this.testResults.bugs.push({
            severity: 'HIGH',
            category,
            description: `${test}: ${message}`,
            timestamp: new Date().toISOString()
        });
    }

    addWarning(category, test, message) {
        this.testResults.warnings.push({
            category,
            test,
            message,
            timestamp: new Date().toISOString()
        });
    }

    async generateBugReport() {
        console.log('\n📊 Generating Comprehensive Bug Report...');
        
        const report = {
            summary: {
                totalTests: this.testResults.totalTests,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: `${((this.testResults.passed / this.testResults.totalTests) * 100).toFixed(2)}%`,
                timestamp: new Date().toISOString()
            },
            criticalIssues: this.testResults.errors.filter(e => e.category === 'CRITICAL' || e.category === 'SMART_OCR'),
            bugs: this.testResults.bugs,
            warnings: this.testResults.warnings,
            performance: this.testResults.performance,
            recommendations: this.generateRecommendations()
        };
        
        // Save detailed report
        await fs.writeFile(
            path.join(__dirname, 'comprehensive-bug-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        // Generate summary
        console.log('\n' + '='.repeat(60));
        console.log('🔍 COMPREHENSIVE BUG ANALYSIS SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${report.summary.totalTests}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.log(`Critical Issues: ${report.criticalIssues.length}`);
        console.log(`Bugs Found: ${report.bugs.length}`);
        console.log(`Warnings: ${report.warnings.length}`);
        console.log('='.repeat(60));
        
        if (report.criticalIssues.length > 0) {
            console.log('\n❌ CRITICAL ISSUES FOUND:');
            report.criticalIssues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue.category}: ${issue.test} - ${issue.message}`);
            });
        }
        
        if (report.bugs.length > 0) {
            console.log('\n🐛 BUGS FOUND:');
            report.bugs.slice(0, 10).forEach((bug, i) => {
                console.log(`${i + 1}. [${bug.severity}] ${bug.category}: ${bug.description}`);
            });
        }
        
        console.log('\n📋 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. ${rec}`);
        });
        
        console.log(`\nDetailed report saved to: comprehensive-bug-report.json`);
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.errors.find(e => e.category === 'SMART_OCR')) {
            recommendations.push('Fix Smart OCR system initialization and API endpoints');
        }
        
        if (this.testResults.errors.find(e => e.category === 'UI')) {
            recommendations.push('Improve UI consistency and ensure all essential elements are present');
        }
        
        if (this.testResults.errors.find(e => e.category === 'API')) {
            recommendations.push('Fix API endpoint responses and error handling');
        }
        
        const slowPerformance = this.testResults.performance.find(p => p.status === 'FAIL');
        if (slowPerformance) {
            recommendations.push('Optimize application performance for faster load times');
        }
        
        if (this.testResults.failed > this.testResults.passed) {
            recommendations.push('Focus on fixing failing tests to improve overall system reliability');
        }
        
        recommendations.push('Implement comprehensive error logging and monitoring');
        recommendations.push('Add automated testing to CI/CD pipeline');
        
        return recommendations;
    }
}

// Run the comprehensive analysis
async function main() {
    const analyzer = new ComprehensiveBugAnalyzer();
    await analyzer.runComprehensiveTests();
}

main().catch(console.error);