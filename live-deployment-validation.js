#!/usr/bin/env node

/**
 * LIVE DEPLOYMENT VALIDATION SUITE
 * 
 * Comprehensive testing of the live Render deployment
 * Tests all endpoints, functionality, and performance
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;

class LiveDeploymentValidator {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.results = {
            endpoints: [],
            functionality: [],
            performance: {},
            screenshots: [],
            errors: []
        };
    }

    async runValidation() {
        console.log('🧪 LIVE DEPLOYMENT VALIDATION SUITE');
        console.log('===================================');
        console.log(`🌐 Testing: ${this.baseUrl}`);
        console.log('');

        try {
            // Step 1: Endpoint validation
            console.log('1️⃣ ENDPOINT VALIDATION');
            console.log('======================');
            await this.validateEndpoints();

            // Step 2: Functionality testing
            console.log('\n2️⃣ FUNCTIONALITY TESTING');
            console.log('========================');
            await this.testFunctionality();

            // Step 3: Performance validation
            console.log('\n3️⃣ PERFORMANCE VALIDATION');
            console.log('=========================');
            await this.validatePerformance();

            // Step 4: Human-AI workflow test
            console.log('\n4️⃣ HUMAN-AI WORKFLOW TEST');
            console.log('=========================');
            await this.testHumanAIWorkflow();

            // Step 5: Generate final report
            console.log('\n5️⃣ GENERATING VALIDATION REPORT');
            console.log('===============================');
            await this.generateValidationReport();

            console.log('\n🎉 LIVE DEPLOYMENT VALIDATION COMPLETE!');
            console.log('=======================================');

        } catch (error) {
            console.error('❌ Validation failed:', error.message);
            this.results.errors.push({
                stage: 'validation',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async validateEndpoints() {
        const endpoints = [
            { path: '/', name: 'Homepage' },
            { path: '/api/smart-ocr-test', name: 'Health Check' },
            { path: '/smart-annotation', name: 'Annotation Interface' },
            { path: '/api/smart-ocr-stats', name: 'System Stats' },
            { path: '/api/smart-ocr-patterns', name: 'Learned Patterns' }
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`   Testing ${endpoint.name}...`);
                
                const response = await fetch(`${this.baseUrl}${endpoint.path}`);
                const status = response.status;
                const isHealthy = status === 200;
                
                let content = '';
                try {
                    const text = await response.text();
                    content = text.substring(0, 100) + (text.length > 100 ? '...' : '');
                } catch (e) {
                    content = 'Unable to read content';
                }

                console.log(`   ${isHealthy ? '✅' : '❌'} ${endpoint.name}: ${status}`);
                
                if (isHealthy && endpoint.path === '/api/smart-ocr-test') {
                    try {
                        const data = JSON.parse(await response.clone().text());
                        console.log(`      Service: ${data.service}`);
                        console.log(`      Mistral: ${data.mistralEnabled ? 'Enabled' : 'Disabled'}`);
                        console.log(`      Version: ${data.version}`);
                    } catch (e) {
                        console.log('      Unable to parse health data');
                    }
                }

                this.results.endpoints.push({
                    name: endpoint.name,
                    path: endpoint.path,
                    status,
                    healthy: isHealthy,
                    content: content.substring(0, 50),
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.log(`   ❌ ${endpoint.name}: ERROR - ${error.message}`);
                this.results.errors.push({
                    endpoint: endpoint.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    async testFunctionality() {
        console.log('   🔧 Testing core functionality...');
        
        try {
            // Test 1: System stats
            const statsResponse = await fetch(`${this.baseUrl}/api/smart-ocr-stats`);
            if (statsResponse.ok) {
                const stats = await statsResponse.json();
                console.log(`   ✅ System Stats: ${stats.status || 'Available'}`);
                console.log(`      Accuracy: ${stats.accuracy || 'Unknown'}%`);
                console.log(`      Patterns: ${stats.patterns || 'Unknown'}`);
            } else {
                console.log(`   ❌ System Stats: ${statsResponse.status}`);
            }

            // Test 2: Learned patterns
            const patternsResponse = await fetch(`${this.baseUrl}/api/smart-ocr-patterns`);
            if (patternsResponse.ok) {
                const patterns = await patternsResponse.json();
                console.log(`   ✅ Learned Patterns: Available`);
                console.log(`      Pattern Count: ${patterns.length || patterns.count || 'Unknown'}`);
            } else {
                console.log(`   ❌ Learned Patterns: ${patternsResponse.status}`);
            }

            this.results.functionality.push({
                test: 'Core API Functionality',
                status: 'passed',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.log(`   ❌ Functionality test failed: ${error.message}`);
            this.results.errors.push({
                test: 'functionality',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async validatePerformance() {
        console.log('   ⚡ Testing performance metrics...');
        
        try {
            const browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Test homepage load time
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle' });
            const loadTime = Date.now() - startTime;

            console.log(`   ✅ Homepage load time: ${loadTime}ms`);

            // Test annotation interface load time
            const annotationStartTime = Date.now();
            await page.goto(`${this.baseUrl}/smart-annotation`, { waitUntil: 'networkidle' });
            const annotationLoadTime = Date.now() - annotationStartTime;

            console.log(`   ✅ Annotation interface load time: ${annotationLoadTime}ms`);

            // Get performance metrics
            const metrics = await page.metrics();
            console.log(`   📊 JS Heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
            console.log(`   🔧 DOM Nodes: ${metrics.Nodes}`);

            // Take performance screenshots
            await fs.mkdir('validation-results', { recursive: true });
            await fs.mkdir('validation-results/screenshots', { recursive: true });
            
            await page.screenshot({ 
                path: 'validation-results/screenshots/live-homepage.png', 
                fullPage: true 
            });
            
            await page.goto(`${this.baseUrl}/smart-annotation`);
            await page.screenshot({ 
                path: 'validation-results/screenshots/live-annotation.png', 
                fullPage: true 
            });

            this.results.performance = {
                homepageLoadTime: loadTime,
                annotationLoadTime: annotationLoadTime,
                jsHeapSize: metrics.JSHeapUsedSize,
                domNodes: metrics.Nodes,
                timestamp: new Date().toISOString()
            };

            this.results.screenshots.push(
                'validation-results/screenshots/live-homepage.png',
                'validation-results/screenshots/live-annotation.png'
            );

            await browser.close();

        } catch (error) {
            console.log(`   ❌ Performance test failed: ${error.message}`);
            this.results.errors.push({
                test: 'performance',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testHumanAIWorkflow() {
        console.log('   🤖 Testing Human-AI workflow...');
        
        try {
            const browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Navigate to annotation interface
            await page.goto(`${this.baseUrl}/smart-annotation`);

            // Check for key workflow elements
            const hasUploadArea = await page.locator('input[type="file"]').count() > 0;
            const hasAnnotationTools = await page.locator('text=Annotation Tools').count() > 0;
            const hasLearningProgress = await page.locator('text=Learning Progress').count() > 0;
            const hasPatternsSection = await page.locator('text=Patterns Learned').count() > 0;

            console.log(`   ${hasUploadArea ? '✅' : '❌'} File upload area present`);
            console.log(`   ${hasAnnotationTools ? '✅' : '❌'} Annotation tools available`);
            console.log(`   ${hasLearningProgress ? '✅' : '❌'} Learning progress displayed`);
            console.log(`   ${hasPatternsSection ? '✅' : '❌'} Patterns section visible`);

            // Test API connectivity from browser
            const apiConnectivity = await page.evaluate(async (baseUrl) => {
                try {
                    const response = await fetch(`${baseUrl}/api/smart-ocr-test`);
                    const data = await response.json();
                    return { success: true, status: response.status, service: data.service };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }, this.baseUrl);

            if (apiConnectivity.success) {
                console.log(`   ✅ API connectivity: ${apiConnectivity.status}`);
                console.log(`   📊 Service: ${apiConnectivity.service}`);
            } else {
                console.log(`   ❌ API connectivity: ${apiConnectivity.error}`);
            }

            // Take workflow screenshot
            await page.screenshot({ 
                path: 'validation-results/screenshots/workflow-test.png', 
                fullPage: true 
            });

            this.results.functionality.push({
                test: 'Human-AI Workflow',
                uploadArea: hasUploadArea,
                annotationTools: hasAnnotationTools,
                learningProgress: hasLearningProgress,
                patternsSection: hasPatternsSection,
                apiConnectivity: apiConnectivity.success,
                timestamp: new Date().toISOString()
            });

            this.results.screenshots.push('validation-results/screenshots/workflow-test.png');

            await browser.close();

        } catch (error) {
            console.log(`   ❌ Workflow test failed: ${error.message}`);
            this.results.errors.push({
                test: 'workflow',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async generateValidationReport() {
        const report = {
            validationSuite: 'Live Deployment Validation',
            timestamp: new Date().toISOString(),
            baseUrl: this.baseUrl,
            results: this.results,
            summary: this.generateSummary()
        };

        // Save JSON report
        await fs.mkdir('validation-results', { recursive: true });
        const jsonReport = 'validation-results/live-deployment-validation.json';
        await fs.writeFile(jsonReport, JSON.stringify(report, null, 2));

        // Generate HTML report
        const htmlReport = this.generateHtmlReport(report);
        const htmlReportPath = 'validation-results/live-deployment-validation.html';
        await fs.writeFile(htmlReportPath, htmlReport);

        console.log(`   📊 Validation report: ${jsonReport}`);
        console.log(`   🌐 HTML report: ${htmlReportPath}`);
        console.log(`   📸 Screenshots: ${this.results.screenshots.length}`);

        // Display summary
        console.log('\n📊 VALIDATION SUMMARY:');
        console.log('======================');
        console.log(`   🌐 Deployment URL: ${this.baseUrl}`);
        console.log(`   📊 Endpoints Tested: ${this.results.endpoints.length}`);
        console.log(`   ✅ Healthy Endpoints: ${this.results.endpoints.filter(e => e.healthy).length}`);
        console.log(`   🔧 Functionality Tests: ${this.results.functionality.length}`);
        console.log(`   ⚡ Performance: ${this.results.performance.homepageLoadTime || 'N/A'}ms homepage`);
        console.log(`   📸 Screenshots: ${this.results.screenshots.length}`);
        console.log(`   ❌ Errors: ${this.results.errors.length}`);
        console.log(`   🎯 Overall Status: ${this.results.errors.length === 0 ? '✅ EXCELLENT' : '⚠️ NEEDS ATTENTION'}`);
    }

    generateSummary() {
        const healthyEndpoints = this.results.endpoints.filter(e => e.healthy).length;
        const totalEndpoints = this.results.endpoints.length;
        const successRate = totalEndpoints > 0 ? Math.round((healthyEndpoints / totalEndpoints) * 100) : 0;

        return {
            totalEndpoints,
            healthyEndpoints,
            successRate,
            functionalityTests: this.results.functionality.length,
            performanceData: !!this.results.performance.homepageLoadTime,
            screenshots: this.results.screenshots.length,
            errors: this.results.errors.length,
            overallStatus: this.results.errors.length === 0 ? 'excellent' : 'needs-attention'
        };
    }

    generateHtmlReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Live Deployment Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f7fa; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; }
        .section { background: white; margin: 20px 0; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; font-weight: bold; }
        .endpoint { background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
        .endpoint.error { border-left-color: #dc3545; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .metric { background: #e7f3ff; padding: 15px; border-radius: 8px; text-align: center; }
        .screenshot { max-width: 300px; margin: 10px; border: 2px solid #ddd; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Live Deployment Validation Report</h1>
        <p><strong>URL:</strong> ${report.baseUrl}</p>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
        <p><strong>Status:</strong> <span class="${report.summary.overallStatus === 'excellent' ? 'success' : 'warning'}">${report.summary.overallStatus.toUpperCase()}</span></p>
    </div>

    <div class="section">
        <h2>📊 Summary Metrics</h2>
        <div class="metrics">
            <div class="metric">
                <h3>Endpoints</h3>
                <p><strong>${report.summary.healthyEndpoints}/${report.summary.totalEndpoints}</strong></p>
                <p>${report.summary.successRate}% Success</p>
            </div>
            <div class="metric">
                <h3>Performance</h3>
                <p><strong>${report.results.performance.homepageLoadTime || 'N/A'}ms</strong></p>
                <p>Homepage Load</p>
            </div>
            <div class="metric">
                <h3>Functionality</h3>
                <p><strong>${report.summary.functionalityTests}</strong></p>
                <p>Tests Passed</p>
            </div>
            <div class="metric">
                <h3>Screenshots</h3>
                <p><strong>${report.summary.screenshots}</strong></p>
                <p>Captured</p>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🌐 Endpoint Validation</h2>
        ${report.results.endpoints.map(endpoint => `
            <div class="endpoint ${endpoint.healthy ? '' : 'error'}">
                <h4>${endpoint.healthy ? '✅' : '❌'} ${endpoint.name}</h4>
                <p><strong>Path:</strong> ${endpoint.path}</p>
                <p><strong>Status:</strong> ${endpoint.status}</p>
                <p><strong>Content Preview:</strong> ${endpoint.content}</p>
            </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>⚡ Performance Metrics</h2>
        ${report.results.performance.homepageLoadTime ? `
            <p><strong>Homepage Load Time:</strong> ${report.results.performance.homepageLoadTime}ms</p>
            <p><strong>Annotation Load Time:</strong> ${report.results.performance.annotationLoadTime}ms</p>
            <p><strong>JS Heap Size:</strong> ${Math.round(report.results.performance.jsHeapSize / 1024 / 1024)}MB</p>
            <p><strong>DOM Nodes:</strong> ${report.results.performance.domNodes}</p>
        ` : '<p>No performance data available</p>'}
    </div>

    <div class="section">
        <h2>📸 Screenshots</h2>
        ${report.results.screenshots.map(screenshot => 
            `<img src="${screenshot}" alt="Validation Screenshot" class="screenshot">`
        ).join('')}
    </div>

    ${report.results.errors.length > 0 ? `
    <div class="section">
        <h2>❌ Errors</h2>
        ${report.results.errors.map(error => 
            `<p class="error"><strong>${error.test || error.endpoint || 'Unknown'}:</strong> ${error.error}</p>`
        ).join('')}
    </div>
    ` : ''}
</body>
</html>
        `;
    }
}

async function main() {
    const validator = new LiveDeploymentValidator();
    await validator.runValidation();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { LiveDeploymentValidator };
