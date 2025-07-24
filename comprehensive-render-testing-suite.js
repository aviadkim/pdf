#!/usr/bin/env node

/**
 * COMPREHENSIVE RENDER TESTING SUITE
 * 
 * Tests the deployed service with:
 * - Playwright browser automation
 * - Puppeteer PDF processing tests
 * - Render API logs analysis
 * - Complete endpoint validation
 */

const { chromium } = require('playwright');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveRenderTestSuite {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.renderApiKey = 'rnd_UQyw0Qdm42RRIcLq3qL8COdn5X1y';
        this.serviceId = 'srv-cqvhqhbtq21c73e3bnag'; // Your service ID
        this.results = {
            playwright: {},
            puppeteer: {},
            renderLogs: {},
            endpoints: {},
            summary: {}
        };
    }

    async runFullTestSuite() {
        console.log('🚀 COMPREHENSIVE RENDER TESTING SUITE');
        console.log('======================================');
        console.log(`🌐 Testing: ${this.baseUrl}`);
        console.log(`📊 Service ID: ${this.serviceId}`);
        console.log('');

        try {
            // 1. Fetch Render logs first
            await this.fetchRenderLogs();
            
            // 2. Run endpoint tests
            await this.testAllEndpoints();
            
            // 3. Run Playwright tests
            await this.runPlaywrightTests();
            
            // 4. Run Puppeteer tests
            await this.runPuppeteerTests();
            
            // 5. Generate comprehensive report
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            console.error(error.stack);
        }
    }

    async fetchRenderLogs() {
        console.log('📋 FETCHING RENDER LOGS');
        console.log('========================');
        
        try {
            const response = await axios.get(
                `https://api.render.com/v1/services/${this.serviceId}/logs`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.renderApiKey}`,
                        'Accept': 'application/json'
                    },
                    params: {
                        limit: 100
                    }
                }
            );
            
            this.results.renderLogs = response.data;
            console.log(`✅ Fetched ${response.data.length || 0} log entries`);
            
            // Analyze logs for errors
            const logs = response.data || [];
            const errors = logs.filter(log => 
                log.message && (
                    log.message.includes('ERROR') || 
                    log.message.includes('error') ||
                    log.message.includes('failed') ||
                    log.message.includes('404') ||
                    log.message.includes('500')
                )
            );
            
            console.log(`⚠️  Found ${errors.length} potential error entries`);
            
            if (errors.length > 0) {
                console.log('\n🔍 Recent Errors:');
                errors.slice(0, 5).forEach((error, i) => {
                    console.log(`   ${i + 1}. ${error.timestamp}: ${error.message.substring(0, 100)}...`);
                });
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch Render logs:', error.message);
            this.results.renderLogs = { error: error.message };
        }
    }

    async testAllEndpoints() {
        console.log('\n🔗 TESTING ALL ENDPOINTS');
        console.log('=========================');
        
        const endpoints = [
            { path: '/', method: 'GET', name: 'Homepage', expected: 200 },
            { path: '/api/system-capabilities', method: 'GET', name: 'System Capabilities', expected: 200 },
            { path: '/api/mistral-ocr-extract', method: 'GET', name: 'Mistral OCR (GET)', expected: 405 },
            { path: '/api/mistral-ocr-extract', method: 'POST', name: 'Mistral OCR (POST)', expected: 400 },
            { path: '/api/ultra-accurate-extract', method: 'GET', name: 'Ultra Accurate', expected: 405 },
            { path: '/api/phase2-enhanced-extract', method: 'GET', name: 'Phase2 Enhanced', expected: 405 },
            { path: '/smart-annotation', method: 'GET', name: 'Smart Annotation', expected: 200 }
        ];
        
        this.results.endpoints = {};
        
        for (const endpoint of endpoints) {
            try {
                console.log(`Testing ${endpoint.name}...`);
                
                let response;
                if (endpoint.method === 'GET') {
                    response = await axios.get(`${this.baseUrl}${endpoint.path}`, { timeout: 10000 });
                } else {
                    response = await axios.post(`${this.baseUrl}${endpoint.path}`, {}, { timeout: 10000 });
                }
                
                const success = response.status === endpoint.expected;
                console.log(`${success ? '✅' : '⚠️'} ${endpoint.name}: ${response.status} ${success ? '(Expected)' : '(Unexpected)'}`);
                
                this.results.endpoints[endpoint.name] = {
                    status: response.status,
                    expected: endpoint.expected,
                    success: success,
                    responseTime: response.headers['x-response-time'] || 'N/A'
                };
                
            } catch (error) {
                const status = error.response?.status || 'No Response';
                const success = status === endpoint.expected;
                console.log(`${success ? '✅' : '❌'} ${endpoint.name}: ${status} ${success ? '(Expected)' : '(Failed)'}`);
                
                this.results.endpoints[endpoint.name] = {
                    status: status,
                    expected: endpoint.expected,
                    success: success,
                    error: error.message
                };
            }
        }
    }

    async runPlaywrightTests() {
        console.log('\n🎭 RUNNING PLAYWRIGHT TESTS');
        console.log('============================');
        
        let browser;
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();
            
            // Test 1: Homepage load
            console.log('1️⃣ Testing homepage load...');
            await page.goto(this.baseUrl);
            await page.waitForLoadState('networkidle');
            
            const title = await page.title();
            const hasSmartOCR = await page.locator('text=Smart OCR').count() > 0;
            
            console.log(`✅ Homepage loaded: "${title}"`);
            console.log(`${hasSmartOCR ? '✅' : '❌'} Smart OCR content found`);
            
            // Test 2: Annotation interface
            console.log('2️⃣ Testing annotation interface...');
            await page.goto(`${this.baseUrl}/smart-annotation`);
            await page.waitForLoadState('networkidle');
            
            const annotationTitle = await page.title();
            const hasAnnotationForm = await page.locator('input[type="file"]').count() > 0;
            
            console.log(`✅ Annotation interface loaded: "${annotationTitle}"`);
            console.log(`${hasAnnotationForm ? '✅' : '❌'} File upload form found`);
            
            // Test 3: Form interaction
            console.log('3️⃣ Testing form interactions...');
            if (hasAnnotationForm) {
                const fileInput = page.locator('input[type="file"]').first();
                const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
                
                const fileInputVisible = await fileInput.isVisible();
                const submitButtonVisible = await submitButton.isVisible();
                
                console.log(`${fileInputVisible ? '✅' : '❌'} File input visible`);
                console.log(`${submitButtonVisible ? '✅' : '❌'} Submit button visible`);
            }
            
            this.results.playwright = {
                homepage: { title, hasSmartOCR },
                annotation: { title: annotationTitle, hasAnnotationForm },
                success: true
            };
            
        } catch (error) {
            console.error('❌ Playwright tests failed:', error.message);
            this.results.playwright = { error: error.message };
        } finally {
            if (browser) await browser.close();
        }
    }

    async runPuppeteerTests() {
        console.log('\n🤖 RUNNING PUPPETEER TESTS');
        console.log('===========================');
        
        let browser;
        try {
            browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            // Test 1: Performance metrics
            console.log('1️⃣ Testing performance metrics...');
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            console.log(`✅ Page load time: ${loadTime}ms`);
            
            // Test 2: Console errors
            console.log('2️⃣ Checking for console errors...');
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            await page.reload({ waitUntil: 'networkidle2' });
            
            console.log(`${consoleErrors.length === 0 ? '✅' : '⚠️'} Console errors: ${consoleErrors.length}`);
            
            // Test 3: API endpoint accessibility
            console.log('3️⃣ Testing API endpoint accessibility...');
            const apiResponse = await page.evaluate(async () => {
                try {
                    const response = await fetch('/api/system-capabilities');
                    return { status: response.status, ok: response.ok };
                } catch (error) {
                    return { error: error.message };
                }
            });
            
            console.log(`${apiResponse.ok ? '✅' : '❌'} API accessible from browser: ${apiResponse.status || 'Failed'}`);
            
            this.results.puppeteer = {
                loadTime,
                consoleErrors: consoleErrors.length,
                apiAccessible: apiResponse.ok,
                success: true
            };
            
        } catch (error) {
            console.error('❌ Puppeteer tests failed:', error.message);
            this.results.puppeteer = { error: error.message };
        } finally {
            if (browser) await browser.close();
        }
    }

    async generateReport() {
        console.log('\n📊 GENERATING COMPREHENSIVE REPORT');
        console.log('===================================');
        
        const timestamp = new Date().toISOString();
        const reportData = {
            timestamp,
            service: this.baseUrl,
            results: this.results
        };
        
        // Calculate success metrics
        const endpointTests = Object.values(this.results.endpoints || {});
        const successfulEndpoints = endpointTests.filter(test => test.success).length;
        const totalEndpoints = endpointTests.length;
        
        const overallScore = totalEndpoints > 0 ? (successfulEndpoints / totalEndpoints * 100).toFixed(1) : 0;
        
        console.log(`📈 Overall Success Rate: ${overallScore}% (${successfulEndpoints}/${totalEndpoints})`);
        console.log(`🎭 Playwright Tests: ${this.results.playwright.success ? 'PASSED' : 'FAILED'}`);
        console.log(`🤖 Puppeteer Tests: ${this.results.puppeteer.success ? 'PASSED' : 'FAILED'}`);
        
        // Save detailed report
        const reportPath = `render-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`💾 Detailed report saved: ${reportPath}`);
        
        this.results.summary = {
            overallScore: parseFloat(overallScore),
            successfulEndpoints,
            totalEndpoints,
            playwrightPassed: this.results.playwright.success,
            puppeteerPassed: this.results.puppeteer.success
        };
        
        return reportData;
    }
}

async function main() {
    const testSuite = new ComprehensiveRenderTestSuite();
    await testSuite.runFullTestSuite();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ComprehensiveRenderTestSuite };
