#!/usr/bin/env node

/**
 * FIND RENDER SERVICE AND RUN COMPREHENSIVE TESTS
 * 
 * 1. Find the correct service ID
 * 2. Get service information and logs
 * 3. Run comprehensive Playwright and Puppeteer tests
 * 4. Analyze deployment issues
 */

const axios = require('axios');
const { chromium } = require('playwright');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

class RenderServiceFinder {
    constructor() {
        this.renderApiKey = 'rnd_UQyw0Qdm42RRIcLq3qL8COdn5X1y';
        this.baseUrl = 'https://api.render.com/v1';
        this.serviceUrl = 'https://pdf-fzzi.onrender.com';
    }

    async findServices() {
        console.log('🔍 FINDING RENDER SERVICES');
        console.log('===========================');
        
        try {
            const servicesResponse = await axios.get(
                `${this.baseUrl}/services`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.renderApiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const services = servicesResponse.data;
            console.log(`✅ Found ${services.length} services:`);
            
            let targetService = null;
            
            services.forEach((service, index) => {
                console.log(`   ${index + 1}. ${service.name} (${service.id})`);
                console.log(`      Type: ${service.type}`);
                console.log(`      URL: ${service.serviceDetails?.url || 'N/A'}`);
                console.log(`      Status: ${service.suspended ? 'SUSPENDED' : 'ACTIVE'}`);
                console.log('');
                
                // Check if this is our PDF service
                if (service.serviceDetails?.url === this.serviceUrl || 
                    service.name.toLowerCase().includes('pdf') ||
                    service.serviceDetails?.url?.includes('pdf-fzzi')) {
                    targetService = service;
                    console.log(`🎯 TARGET SERVICE FOUND: ${service.name}`);
                }
            });

            return { services, targetService };

        } catch (error) {
            console.error('❌ Failed to fetch services:', error.response?.data || error.message);
            return { services: [], targetService: null };
        }
    }

    async getServiceDetails(serviceId) {
        console.log(`\n📋 GETTING SERVICE DETAILS: ${serviceId}`);
        console.log('==========================================');
        
        try {
            // Get service info
            const serviceResponse = await axios.get(
                `${this.baseUrl}/services/${serviceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.renderApiKey}`,
                        'Accept': 'application/json'
                    }
                }
            );

            const service = serviceResponse.data;
            console.log('✅ Service Information:');
            console.log(`   Name: ${service.name}`);
            console.log(`   Type: ${service.type}`);
            console.log(`   Environment: ${service.environment}`);
            console.log(`   Status: ${service.suspended ? 'SUSPENDED' : 'ACTIVE'}`);
            console.log(`   Auto Deploy: ${service.autoDeploy ? 'ENABLED' : 'DISABLED'}`);
            console.log(`   Branch: ${service.branch}`);
            console.log(`   Build Command: ${service.buildCommand || 'npm run build'}`);
            console.log(`   Start Command: ${service.startCommand || 'npm start'}`);

            // Get recent deployments
            console.log('\n📦 Recent Deployments:');
            const deploymentsResponse = await axios.get(
                `${this.baseUrl}/services/${serviceId}/deploys`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.renderApiKey}`,
                        'Accept': 'application/json'
                    },
                    params: { limit: 3 }
                }
            );

            const deployments = deploymentsResponse.data;
            deployments.forEach((deploy, index) => {
                console.log(`   ${index + 1}. ${deploy.status} - ${new Date(deploy.createdAt).toLocaleString()}`);
                console.log(`      Commit: ${deploy.commit?.message?.substring(0, 60) || 'N/A'}...`);
            });

            return { service, deployments };

        } catch (error) {
            console.error('❌ Failed to get service details:', error.response?.data || error.message);
            return null;
        }
    }

    async runPlaywrightTests() {
        console.log('\n🎭 PLAYWRIGHT COMPREHENSIVE TESTS');
        console.log('==================================');
        
        let browser;
        const results = {};
        
        try {
            browser = await chromium.launch({ headless: true });
            const context = await browser.newContext();
            const page = await context.newPage();
            
            // Capture console messages
            const consoleMessages = [];
            page.on('console', msg => consoleMessages.push(`${msg.type()}: ${msg.text()}`));
            
            // Test 1: Homepage
            console.log('1️⃣ Testing homepage...');
            await page.goto(this.serviceUrl);
            await page.waitForLoadState('networkidle');
            
            const title = await page.title();
            const content = await page.content();
            const hasSmartOCR = content.includes('Smart OCR');
            const hasSystemCapabilities = content.includes('system-capabilities');
            const hasMistralOCR = content.includes('mistral-ocr');
            
            console.log(`   Title: "${title}"`);
            console.log(`   Smart OCR content: ${hasSmartOCR ? '✅' : '❌'}`);
            console.log(`   System capabilities: ${hasSystemCapabilities ? '✅' : '❌'}`);
            console.log(`   Mistral OCR: ${hasMistralOCR ? '✅' : '❌'}`);
            
            results.homepage = { title, hasSmartOCR, hasSystemCapabilities, hasMistralOCR };
            
            // Test 2: API endpoint check from browser
            console.log('2️⃣ Testing API endpoints from browser...');
            const apiTests = await page.evaluate(async () => {
                const endpoints = [
                    '/api/system-capabilities',
                    '/api/mistral-ocr-extract',
                    '/api/ultra-accurate-extract'
                ];
                
                const results = {};
                for (const endpoint of endpoints) {
                    try {
                        const response = await fetch(endpoint);
                        results[endpoint] = { status: response.status, ok: response.ok };
                    } catch (error) {
                        results[endpoint] = { error: error.message };
                    }
                }
                return results;
            });
            
            console.log('   API Endpoint Results:');
            Object.entries(apiTests).forEach(([endpoint, result]) => {
                const status = result.status || 'Error';
                const icon = result.status && result.status !== 404 ? '✅' : '❌';
                console.log(`   ${icon} ${endpoint}: ${status}`);
            });
            
            results.apiTests = apiTests;
            
            // Test 3: Annotation interface
            console.log('3️⃣ Testing annotation interface...');
            await page.goto(`${this.serviceUrl}/smart-annotation`);
            await page.waitForLoadState('networkidle');
            
            const annotationTitle = await page.title();
            const hasFileInput = await page.locator('input[type="file"]').count() > 0;
            const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').count() > 0;
            
            console.log(`   Title: "${annotationTitle}"`);
            console.log(`   File input: ${hasFileInput ? '✅' : '❌'}`);
            console.log(`   Submit button: ${hasSubmitButton ? '✅' : '❌'}`);
            
            results.annotation = { title: annotationTitle, hasFileInput, hasSubmitButton };
            
            // Test 4: Console errors
            console.log('4️⃣ Checking console messages...');
            const errors = consoleMessages.filter(msg => msg.startsWith('error:'));
            console.log(`   Console errors: ${errors.length}`);
            if (errors.length > 0) {
                errors.slice(0, 3).forEach((error, i) => {
                    console.log(`   ${i + 1}. ${error.substring(0, 80)}...`);
                });
            }
            
            results.consoleErrors = errors.length;
            results.success = true;
            
        } catch (error) {
            console.error('❌ Playwright tests failed:', error.message);
            results.error = error.message;
        } finally {
            if (browser) await browser.close();
        }
        
        return results;
    }

    async runPuppeteerTests() {
        console.log('\n🤖 PUPPETEER PERFORMANCE TESTS');
        console.log('================================');
        
        let browser;
        const results = {};
        
        try {
            browser = await puppeteer.launch({ headless: true });
            const page = await browser.newPage();
            
            // Test 1: Performance metrics
            console.log('1️⃣ Measuring performance...');
            const startTime = Date.now();
            await page.goto(this.serviceUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;
            
            console.log(`   Load time: ${loadTime}ms`);
            
            // Test 2: Network requests
            console.log('2️⃣ Analyzing network requests...');
            const responses = [];
            page.on('response', response => {
                responses.push({
                    url: response.url(),
                    status: response.status(),
                    contentType: response.headers()['content-type']
                });
            });
            
            await page.reload({ waitUntil: 'networkidle2' });
            
            const failedRequests = responses.filter(r => r.status >= 400);
            console.log(`   Total requests: ${responses.length}`);
            console.log(`   Failed requests: ${failedRequests.length}`);
            
            if (failedRequests.length > 0) {
                console.log('   Failed requests:');
                failedRequests.slice(0, 5).forEach((req, i) => {
                    console.log(`   ${i + 1}. ${req.status} - ${req.url.substring(0, 60)}...`);
                });
            }
            
            // Test 3: PDF upload simulation
            console.log('3️⃣ Testing PDF upload interface...');
            await page.goto(`${this.serviceUrl}/smart-annotation`);
            
            const fileInputExists = await page.$('input[type="file"]') !== null;
            const formExists = await page.$('form') !== null;
            
            console.log(`   File input exists: ${fileInputExists ? '✅' : '❌'}`);
            console.log(`   Form exists: ${formExists ? '✅' : '❌'}`);
            
            results = {
                loadTime,
                totalRequests: responses.length,
                failedRequests: failedRequests.length,
                fileInputExists,
                formExists,
                success: true
            };
            
        } catch (error) {
            console.error('❌ Puppeteer tests failed:', error.message);
            results.error = error.message;
        } finally {
            if (browser) await browser.close();
        }
        
        return results;
    }

    async generateComprehensiveReport(serviceData, playwrightResults, puppeteerResults) {
        console.log('\n📊 COMPREHENSIVE TEST REPORT');
        console.log('=============================');
        
        const timestamp = new Date().toISOString();
        const report = {
            timestamp,
            service: serviceData,
            playwright: playwrightResults,
            puppeteer: puppeteerResults,
            analysis: {}
        };
        
        // Analysis
        const hasWorkingEndpoints = playwrightResults.apiTests && 
            Object.values(playwrightResults.apiTests).some(test => test.status && test.status !== 404);
        
        const isFullyFunctional = hasWorkingEndpoints && 
            playwrightResults.homepage?.hasSystemCapabilities &&
            playwrightResults.homepage?.hasMistralOCR;
        
        report.analysis = {
            serviceResponding: true,
            hasWorkingEndpoints,
            isFullyFunctional,
            loadPerformance: puppeteerResults.loadTime < 3000 ? 'Good' : 'Slow',
            overallStatus: isFullyFunctional ? 'Fully Operational' : 'Partially Working'
        };
        
        console.log(`🌐 Service Status: ${report.analysis.overallStatus}`);
        console.log(`⚡ Performance: ${report.analysis.loadPerformance} (${puppeteerResults.loadTime}ms)`);
        console.log(`🔗 API Endpoints: ${hasWorkingEndpoints ? 'Working' : 'Not Working'}`);
        console.log(`🎯 Full Functionality: ${isFullyFunctional ? 'Yes' : 'No'}`);
        
        if (!isFullyFunctional) {
            console.log('\n⚠️  ISSUES IDENTIFIED:');
            if (!playwrightResults.homepage?.hasSystemCapabilities) {
                console.log('   - System capabilities endpoint not available');
            }
            if (!playwrightResults.homepage?.hasMistralOCR) {
                console.log('   - Mistral OCR integration not active');
            }
            if (!hasWorkingEndpoints) {
                console.log('   - API endpoints returning 404 errors');
            }
            
            console.log('\n💡 RECOMMENDED ACTIONS:');
            console.log('   1. Check if latest deployment completed successfully');
            console.log('   2. Verify the correct server file is being started');
            console.log('   3. Check for import/dependency errors in logs');
            console.log('   4. Consider manual redeploy with build logs review');
        }
        
        // Save report
        const reportPath = `comprehensive-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n💾 Report saved: ${reportPath}`);
        
        return report;
    }

    async runFullTestSuite() {
        // Step 1: Find the correct service
        const { services, targetService } = await this.findServices();
        
        let serviceData = null;
        if (targetService) {
            serviceData = await this.getServiceDetails(targetService.id);
        }
        
        // Step 2: Run browser tests
        const playwrightResults = await this.runPlaywrightTests();
        const puppeteerResults = await this.runPuppeteerTests();
        
        // Step 3: Generate report
        const report = await this.generateComprehensiveReport(serviceData, playwrightResults, puppeteerResults);
        
        return report;
    }
}

async function main() {
    const finder = new RenderServiceFinder();
    await finder.runFullTestSuite();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { RenderServiceFinder };
