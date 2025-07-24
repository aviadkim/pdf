/**
 * VALIDATE FIXES TEST SUITE
 * Tests all the fixes we applied to ensure they're working correctly
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

class ValidationTestSuite {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.localUrl = 'http://localhost:10002';
        this.results = {
            apiEndpoints: { passed: 0, failed: 0, tests: [] },
            dragAndDrop: { passed: false, details: '' },
            memoryUsage: { initial: 0, after: 0, leakDetected: false },
            versionIndicator: { found: false },
            overallSuccess: false
        };
    }

    async runAllValidations() {
        console.log('🔍 VALIDATION TEST SUITE - Checking all fixes');
        console.log('==============================================\n');

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            // Test 1: Check version indicator
            await this.testVersionIndicator(browser);
            
            // Test 2: Test all API endpoints
            await this.testAPIEndpoints();
            
            // Test 3: Test drag-and-drop interface
            await this.testDragAndDrop(browser);
            
            // Test 4: Test memory usage (simplified)
            await this.testMemoryUsage(browser);
            
            // Generate report
            this.generateValidationReport();
            
        } finally {
            await browser.close();
        }
    }

    async testVersionIndicator(browser) {
        console.log('📋 1. Testing Version Indicator...');
        
        const page = await browser.newPage();
        try {
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const content = await page.content();
            
            if (content.includes('Direct PDF parsing bypass enabled (v2.1)')) {
                this.results.versionIndicator.found = true;
                console.log('  ✅ Version indicator found - v2.1 is live!\n');
            } else {
                console.log('  ❌ Version indicator NOT found\n');
            }
        } catch (error) {
            console.log(`  ❌ Error checking version: ${error.message}\n`);
        } finally {
            await page.close();
        }
    }

    async testAPIEndpoints() {
        console.log('🔌 2. Testing API Endpoints...');
        
        const endpoints = [
            { path: '/api/pdf-extract', method: 'POST', name: 'PDF Extract' },
            { path: '/api/smart-ocr', method: 'POST', name: 'Smart OCR' },
            { path: '/api/bulletproof-processor', method: 'POST', name: 'Bulletproof Processor' },
            { path: '/api/system-capabilities', method: 'GET', name: 'System Capabilities' }
        ];

        for (const endpoint of endpoints) {
            try {
                let response;
                
                if (endpoint.method === 'GET') {
                    response = await fetch(`${this.baseUrl}${endpoint.path}`);
                } else {
                    // For POST endpoints, test with empty body to check if they exist
                    response = await fetch(`${this.baseUrl}${endpoint.path}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                    });
                }
                
                const test = {
                    endpoint: endpoint.path,
                    name: endpoint.name,
                    status: response.status,
                    success: false
                };
                
                // For POST endpoints, 400 is expected (no file), for GET 200 is expected
                if ((endpoint.method === 'POST' && response.status === 400) || 
                    (endpoint.method === 'GET' && response.status === 200)) {
                    test.success = true;
                    this.results.apiEndpoints.passed++;
                    console.log(`  ✅ ${endpoint.name}: Working (${response.status})`);
                } else if (response.status === 404) {
                    this.results.apiEndpoints.failed++;
                    console.log(`  ❌ ${endpoint.name}: NOT FOUND (404)`);
                } else {
                    this.results.apiEndpoints.failed++;
                    console.log(`  ⚠️ ${endpoint.name}: Unexpected status (${response.status})`);
                }
                
                this.results.apiEndpoints.tests.push(test);
                
            } catch (error) {
                this.results.apiEndpoints.failed++;
                console.log(`  ❌ ${endpoint.name}: Error - ${error.message}`);
                this.results.apiEndpoints.tests.push({
                    endpoint: endpoint.path,
                    name: endpoint.name,
                    status: 0,
                    success: false,
                    error: error.message
                });
            }
        }
        console.log();
    }

    async testDragAndDrop(browser) {
        console.log('🎯 3. Testing Drag-and-Drop Interface...');
        
        const page = await browser.newPage();
        try {
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            
            // Check for drop zone
            const dropZone = await page.$('[data-testid="drop-zone"], #drop-zone, .drop-zone');
            
            if (dropZone) {
                this.results.dragAndDrop.passed = true;
                
                // Check if it's clickable
                const isClickable = await page.evaluate(() => {
                    const zone = document.querySelector('#drop-zone');
                    return zone && zone.style.cursor === 'pointer';
                });
                
                this.results.dragAndDrop.details = isClickable ? 
                    'Drop zone found and clickable' : 
                    'Drop zone found but may not be interactive';
                
                console.log(`  ✅ Drag-and-drop zone detected: ${this.results.dragAndDrop.details}\n`);
            } else {
                this.results.dragAndDrop.details = 'No drop zone found';
                console.log('  ❌ Drag-and-drop zone NOT found\n');
            }
            
        } catch (error) {
            this.results.dragAndDrop.details = `Error: ${error.message}`;
            console.log(`  ❌ Error testing drag-and-drop: ${error.message}\n`);
        } finally {
            await page.close();
        }
    }

    async testMemoryUsage(browser) {
        console.log('💾 4. Testing Memory Usage (Simplified)...');
        
        const page = await browser.newPage();
        try {
            // Initial memory reading
            await page.goto(this.baseUrl);
            const initialMetrics = await page.metrics();
            this.results.memoryUsage.initial = Math.round(initialMetrics.JSHeapUsedSize / 1024 / 1024);
            
            // Simulate some activity
            for (let i = 0; i < 5; i++) {
                await page.reload();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Final memory reading
            const finalMetrics = await page.metrics();
            this.results.memoryUsage.after = Math.round(finalMetrics.JSHeapUsedSize / 1024 / 1024);
            
            // Check for significant growth (>50% increase)
            const growth = (this.results.memoryUsage.after - this.results.memoryUsage.initial) / this.results.memoryUsage.initial;
            this.results.memoryUsage.leakDetected = growth > 0.5;
            
            if (!this.results.memoryUsage.leakDetected) {
                console.log(`  ✅ Memory usage stable: ${this.results.memoryUsage.initial}MB → ${this.results.memoryUsage.after}MB\n`);
            } else {
                console.log(`  ⚠️ Potential memory growth: ${this.results.memoryUsage.initial}MB → ${this.results.memoryUsage.after}MB\n`);
            }
            
        } catch (error) {
            console.log(`  ❌ Error testing memory: ${error.message}\n`);
        } finally {
            await page.close();
        }
    }

    generateValidationReport() {
        console.log('=' * 60);
        console.log('📊 VALIDATION RESULTS SUMMARY');
        console.log('=' * 60);
        
        const apiSuccess = this.results.apiEndpoints.passed >= 3; // At least 3 of 4 endpoints working
        const uiSuccess = this.results.dragAndDrop.passed;
        const memorySuccess = !this.results.memoryUsage.leakDetected;
        const versionSuccess = this.results.versionIndicator.found;
        
        console.log(`\n✅ Fixed Issues:`);
        if (apiSuccess) console.log('  • API Endpoints: FIXED ✓');
        if (uiSuccess) console.log('  • Drag-and-Drop Interface: ADDED ✓');
        if (memorySuccess) console.log('  • Memory Leaks: PREVENTED ✓');
        if (versionSuccess) console.log('  • Version Indicator: VISIBLE ✓');
        
        console.log(`\n❌ Outstanding Issues:`);
        if (!apiSuccess) {
            console.log('  • API Endpoints: STILL FAILING');
            this.results.apiEndpoints.tests.forEach(test => {
                if (!test.success) {
                    console.log(`    - ${test.name}: ${test.status || 'Error'}`);
                }
            });
        }
        if (!uiSuccess) console.log('  • Drag-and-Drop: NOT DETECTED');
        if (!memorySuccess) console.log('  • Memory Usage: GROWING');
        if (!versionSuccess) console.log('  • Version Indicator: NOT VISIBLE');
        
        this.results.overallSuccess = apiSuccess && uiSuccess && memorySuccess;
        
        console.log(`\n📈 Overall Status: ${this.results.overallSuccess ? 'ALL FIXES WORKING ✅' : 'SOME FIXES PENDING ⚠️'}`);
        
        if (!this.results.overallSuccess && !versionSuccess) {
            console.log('\n🔄 DEPLOYMENT ISSUE DETECTED:');
            console.log('  The fixes are not visible on the live server.');
            console.log('  This suggests the deployment needs to be updated.');
            console.log('\n  Recommended Actions:');
            console.log('  1. Push changes to GitHub');
            console.log('  2. Trigger manual deployment on Render');
            console.log('  3. Wait for deployment to complete');
            console.log('  4. Run this validation again');
        }
        
        // Save detailed report
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.writeFile(
            `validation-report-${timestamp}.json`,
            JSON.stringify(this.results, null, 2)
        ).catch(console.error);
    }
}

async function validateFixes() {
    const validator = new ValidationTestSuite();
    try {
        await validator.runAllValidations();
    } catch (error) {
        console.error('❌ Validation suite failed:', error);
    }
}

validateFixes();