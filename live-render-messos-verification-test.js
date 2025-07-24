/**
 * LIVE RENDER MESSOS VERIFICATION TEST
 * Tests the live Render deployment with real Messos PDF
 * Verifies we get the same amazing results as local testing
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class LiveRenderMessosTest {
    constructor() {
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        this.messosPdfPath = '2. Messos  - 31.03.2025.pdf';
        this.expectedResults = {
            minSecurities: 35,
            expectedTotal: 19464431,
            accuracyTarget: 90
        };
        
        console.log('🧪 LIVE RENDER MESSOS VERIFICATION TEST');
        console.log('Testing real PDF upload and extraction on live deployment');
    }

    async runComprehensiveTest() {
        const startTime = Date.now();
        const testResults = {
            timestamp: new Date().toISOString(),
            renderUrl: this.renderUrl,
            tests: [],
            summary: {}
        };

        let browser = null;

        try {
            // Launch browser
            console.log('🚀 Launching browser...');
            browser = await puppeteer.launch({
                headless: false, // Show browser for debugging
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            });

            const page = await browser.newPage();
            await page.setViewport({ width: 1920, height: 1080 });
            
            // Test 1: Navigate to live site
            await this.testSiteAccess(page, testResults);
            
            // Test 2: Check if Messos PDF exists
            await this.checkPdfExists(testResults);
            
            // Test 3: Test API endpoints
            await this.testApiEndpoints(page, testResults);
            
            // Test 4: Upload and process Messos PDF
            await this.testMessosUpload(page, testResults);
            
            // Test 5: Verify results accuracy
            await this.verifyAccuracy(testResults);
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            testResults.error = error.message;
        } finally {
            if (browser) {
                await browser.close();
            }
        }

        // Generate comprehensive report
        const report = await this.generateReport(testResults, Date.now() - startTime);
        
        console.log('\\n📊 LIVE RENDER TEST COMPLETE');
        return report;
    }

    async testSiteAccess(page, testResults) {
        console.log('\\n🌐 Testing site access...');
        
        try {
            const response = await page.goto(this.renderUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            const title = await page.title();
            const url = page.url();
            
            testResults.tests.push({
                test: 'site_access',
                passed: response.status() === 200,
                details: {
                    status: response.status(),
                    title: title,
                    url: url,
                    loadTime: Date.now()
                }
            });
            
            console.log(`✅ Site accessible: ${title}`);
            console.log(`📍 URL: ${url}`);
            
            // Take screenshot
            await page.screenshot({ path: 'render-homepage-test.png' });
            
        } catch (error) {
            testResults.tests.push({
                test: 'site_access',
                passed: false,
                error: error.message
            });
            console.log('❌ Site access failed:', error.message);
        }
    }

    async checkPdfExists(testResults) {
        console.log('\\n📄 Checking Messos PDF...');
        
        try {
            await fs.access(this.messosPdfPath);
            const stats = await fs.stat(this.messosPdfPath);
            
            testResults.tests.push({
                test: 'pdf_exists',
                passed: true,
                details: {
                    filename: this.messosPdfPath,
                    size: stats.size,
                    sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
                }
            });
            
            console.log(`✅ PDF found: ${this.messosPdfPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
            
        } catch (error) {
            testResults.tests.push({
                test: 'pdf_exists',
                passed: false,
                error: error.message
            });
            console.log('❌ PDF not found:', error.message);
        }
    }

    async testApiEndpoints(page, testResults) {
        console.log('\\n🔗 Testing API endpoints...');
        
        const endpoints = [
            '/api/smart-ocr-stats',
            '/api/smart-ocr-patterns',
            '/api/export/json'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await page.goto(this.renderUrl + endpoint, { waitUntil: 'networkidle2' });
                const content = await page.content();
                const isJson = content.includes('{') && content.includes('}');
                
                testResults.tests.push({
                    test: `endpoint_${endpoint.replace(/[^a-z0-9]/gi, '_')}`,
                    passed: response.status() === 200 && isJson,
                    details: {
                        endpoint: endpoint,
                        status: response.status(),
                        isJson: isJson,
                        contentLength: content.length
                    }
                });
                
                console.log(`${response.status() === 200 ? '✅' : '❌'} ${endpoint}: ${response.status()}`);
                
            } catch (error) {
                testResults.tests.push({
                    test: `endpoint_${endpoint.replace(/[^a-z0-9]/gi, '_')}`,
                    passed: false,
                    error: error.message
                });
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }
    }

    async testMessosUpload(page, testResults) {
        console.log('\\n📤 Testing Messos PDF upload and processing...');
        
        try {
            // Go back to main page
            await page.goto(this.renderUrl, { waitUntil: 'networkidle2' });
            
            // Look for file upload form
            const fileInput = await page.$('input[type="file"]');
            if (!fileInput) {
                throw new Error('File upload input not found on page');
            }
            
            // Upload the Messos PDF
            console.log('📁 Uploading Messos PDF...');
            await fileInput.uploadFile(this.messosPdfPath);
            
            // Look for submit button and click it
            const submitButton = await page.$('button[type="submit"], input[type="submit"], button:contains("Process"), button:contains("Upload")');
            if (submitButton) {
                console.log('🔄 Processing PDF...');
                await submitButton.click();
                
                // Wait for processing to complete (up to 2 minutes)
                await page.waitForTimeout(5000); // Initial wait
                
                // Look for results or success indicators
                await page.waitForFunction(
                    () => {
                        return document.body.innerText.includes('securities') ||
                               document.body.innerText.includes('ISIN') ||
                               document.body.innerText.includes('CHF') ||
                               document.body.innerText.includes('success') ||
                               document.body.innerText.includes('completed');
                    },
                    { timeout: 120000 } // 2 minute timeout
                );
                
                // Extract results from page
                const pageContent = await page.content();
                const results = await this.extractResultsFromPage(page);
                
                testResults.tests.push({
                    test: 'messos_upload_processing',
                    passed: true,
                    details: results
                });
                
                console.log('✅ PDF processed successfully');
                console.log(`📊 Found ${results.securities.length} securities`);
                console.log(`💰 Total value: CHF ${results.totalValue.toLocaleString()}`);
                
                // Take screenshot of results
                await page.screenshot({ path: 'render-messos-results.png' });
                
            } else {
                throw new Error('Submit button not found');
            }
            
        } catch (error) {
            testResults.tests.push({
                test: 'messos_upload_processing',
                passed: false,
                error: error.message
            });
            console.log('❌ Upload/processing failed:', error.message);
            
            // Take screenshot for debugging
            await page.screenshot({ path: 'render-upload-error.png' });
        }
    }

    async extractResultsFromPage(page) {
        console.log('🔍 Extracting results from page...');
        
        // Try multiple methods to extract results
        const results = {
            securities: [],
            totalValue: 0,
            accuracy: 0,
            processingTime: 0
        };
        
        try {
            // Method 1: Look for JSON data in page
            const jsonData = await page.evaluate(() => {
                const scripts = Array.from(document.querySelectorAll('script'));
                for (const script of scripts) {
                    if (script.textContent.includes('securities') && script.textContent.includes('{')) {
                        try {
                            const match = script.textContent.match(/\\{[^}]+securities[^}]+\\}/);
                            if (match) return JSON.parse(match[0]);
                        } catch (e) {}
                    }
                }
                return null;
            });
            
            if (jsonData && jsonData.securities) {
                results.securities = jsonData.securities;
                results.totalValue = jsonData.totalValue || 0;
                results.accuracy = jsonData.accuracy || 0;
                return results;
            }
            
            // Method 2: Extract from visible text
            const pageText = await page.evaluate(() => document.body.innerText);
            
            // Look for ISIN patterns
            const isinMatches = pageText.match(/[A-Z]{2}[A-Z0-9]{10}/g) || [];
            results.securities = isinMatches.map((isin, index) => ({
                isin: isin,
                name: `Security ${index + 1}`,
                value: 0
            }));
            
            // Look for CHF amounts
            const chfMatches = pageText.match(/CHF\\s+([0-9,.']+)/gi) || [];
            if (chfMatches.length > 0) {
                const amounts = chfMatches.map(match => {
                    const num = match.replace(/[^0-9.']/g, '').replace(/'/g, '');
                    return parseFloat(num) || 0;
                });
                results.totalValue = amounts.reduce((sum, val) => sum + val, 0);
            }
            
            // Calculate rough accuracy
            if (results.securities.length >= this.expectedResults.minSecurities) {
                results.accuracy = Math.min(95, (results.securities.length / this.expectedResults.minSecurities) * 100);
            }
            
        } catch (error) {
            console.log('⚠️ Error extracting results:', error.message);
        }
        
        return results;
    }

    async verifyAccuracy(testResults) {
        console.log('\\n🎯 Verifying accuracy...');
        
        // Find the upload test results
        const uploadTest = testResults.tests.find(t => t.test === 'messos_upload_processing');
        
        if (!uploadTest || !uploadTest.passed) {
            testResults.tests.push({
                test: 'accuracy_verification',
                passed: false,
                error: 'No upload results to verify'
            });
            return;
        }
        
        const results = uploadTest.details;
        const accuracy = {
            securitiesFound: results.securities.length,
            expectedSecurities: this.expectedResults.minSecurities,
            totalValue: results.totalValue,
            expectedValue: this.expectedResults.expectedTotal,
            accuracyPercentage: 0,
            passed: false
        };
        
        // Calculate accuracy metrics
        const securitiesAccuracy = (results.securities.length / this.expectedResults.minSecurities) * 100;
        const valueAccuracy = results.totalValue > 0 ? 
            Math.max(0, 100 - Math.abs(results.totalValue - this.expectedResults.expectedTotal) / this.expectedResults.expectedTotal * 100) : 0;
        
        accuracy.accuracyPercentage = (securitiesAccuracy + valueAccuracy) / 2;
        accuracy.passed = accuracy.accuracyPercentage >= this.expectedResults.accuracyTarget;
        
        testResults.tests.push({
            test: 'accuracy_verification',
            passed: accuracy.passed,
            details: accuracy
        });
        
        console.log(`📊 Securities: ${results.securities.length}/${this.expectedResults.minSecurities} (${securitiesAccuracy.toFixed(1)}%)`);
        console.log(`💰 Value accuracy: ${valueAccuracy.toFixed(1)}%`);
        console.log(`🎯 Overall accuracy: ${accuracy.accuracyPercentage.toFixed(1)}%`);
        console.log(`${accuracy.passed ? '✅' : '❌'} Accuracy test: ${accuracy.passed ? 'PASSED' : 'FAILED'}`);
    }

    async generateReport(testResults, totalTime) {
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
                status: successRate >= 80 ? 'SUCCESS' : 'NEEDS_ATTENTION'
            }
        };
        
        // Save detailed report
        const reportFile = `live-render-messos-test-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        // Display summary
        console.log('\\n📋 LIVE RENDER TEST SUMMARY');
        console.log('='.repeat(40));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${total - passed}`);
        console.log(`📊 Success Rate: ${successRate}%`);
        console.log(`⏱️ Total Time: ${Math.round(totalTime / 1000)}s`);
        console.log(`📄 Report: ${reportFile}`);
        
        if (successRate >= 90) {
            console.log('\\n🎉 EXCELLENT! Live deployment matches local results');
        } else if (successRate >= 70) {
            console.log('\\n✅ GOOD! Live deployment is working well');
        } else {
            console.log('\\n⚠️ ISSUES DETECTED - Live deployment needs attention');
        }
        
        return report;
    }
}

// Run the test if called directly
if (require.main === module) {
    const test = new LiveRenderMessosTest();
    test.runComprehensiveTest().catch(console.error);
}

module.exports = { LiveRenderMessosTest };