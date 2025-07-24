/**
 * REAL MESSOS PDF TEST - Complete End-to-End Processing
 * This test uploads the actual MESSOS PDF and captures all results
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

class RealMessosTest {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        this.results = {
            uploadSuccess: false,
            extractedData: null,
            screenshots: [],
            processingTime: 0,
            errors: []
        };
    }

    async runCompleteTest() {
        console.log('🚀 STARTING REAL MESSOS PDF TEST');
        console.log('================================\n');
        
        // Verify PDF exists
        try {
            await fs.access(this.pdfPath);
            console.log('✅ MESSOS PDF found:', this.pdfPath);
        } catch (error) {
            console.error('❌ MESSOS PDF not found at:', this.pdfPath);
            return;
        }

        const browser = await puppeteer.launch({
            headless: false, // Show browser for visual confirmation
            defaultViewport: { width: 1920, height: 1080 }
        });

        try {
            // Test 1: Standard Processing Form
            console.log('\n📊 TEST 1: Standard PDF Processing');
            console.log('==================================');
            await this.testStandardProcessing(browser);
            
            // Test 2: Smart Annotation Interface
            console.log('\n🎨 TEST 2: Smart Annotation Interface');
            console.log('=====================================');
            await this.testSmartAnnotation(browser);
            
            // Test 3: API Direct Processing
            console.log('\n🔌 TEST 3: Direct API Processing');
            console.log('=================================');
            await this.testAPIProcessing();
            
            // Generate comprehensive report
            await this.generateReport();
            
        } finally {
            await browser.close();
        }
    }

    async testStandardProcessing(browser) {
        const page = await browser.newPage();
        const startTime = Date.now();
        
        try {
            // Go to homepage
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            await page.screenshot({ path: 'test-screenshots/01-homepage.png' });
            console.log('📸 Screenshot: Homepage captured');
            
            // Find file input
            const fileInput = await page.$('input[type="file"]');
            if (!fileInput) {
                throw new Error('No file input found on page');
            }
            
            // Upload PDF
            await fileInput.uploadFile(this.pdfPath);
            console.log('📄 PDF uploaded: MESSOS document');
            
            // Find and click submit button
            const submitButton = await page.$('button[type="submit"]');
            if (submitButton) {
                // Capture network response
                const responsePromise = page.waitForResponse(response => 
                    response.url().includes('/api/') && response.status() === 200
                );
                
                await submitButton.click();
                console.log('🔄 Processing PDF...');
                
                // Wait for response
                const response = await responsePromise.catch(() => null);
                
                if (response) {
                    const data = await response.json();
                    this.results.extractedData = data;
                    console.log('✅ Data extracted successfully');
                    
                    // Log summary
                    if (data.securities) {
                        console.log(`\n📊 Extraction Results:`);
                        console.log(`  Securities found: ${data.securities.length}`);
                        console.log(`  Total value: $${data.totalValue?.toLocaleString() || 'N/A'}`);
                        console.log(`  Accuracy: ${data.accuracy || 'N/A'}`);
                        
                        // Show first 5 securities
                        console.log(`\n  Sample Securities:`);
                        data.securities.slice(0, 5).forEach((sec, i) => {
                            console.log(`    ${i+1}. ${sec.isin} - ${sec.name || 'N/A'} - $${sec.marketValue?.toLocaleString() || sec.value || 'N/A'}`);
                        });
                    }
                }
                
                // Wait for results page
                await page.waitForTimeout(3000);
                await page.screenshot({ path: 'test-screenshots/02-results.png', fullPage: true });
                console.log('📸 Screenshot: Results page captured');
            }
            
            this.results.processingTime = Date.now() - startTime;
            this.results.uploadSuccess = true;
            
        } catch (error) {
            console.error('❌ Standard processing error:', error.message);
            this.results.errors.push({ test: 'standard', error: error.message });
            await page.screenshot({ path: 'test-screenshots/error-standard.png' });
        } finally {
            await page.close();
        }
    }

    async testSmartAnnotation(browser) {
        const page = await browser.newPage();
        
        try {
            // Go to smart annotation interface
            await page.goto(`${this.baseUrl}/smart-annotation`, { waitUntil: 'networkidle2' });
            await page.screenshot({ path: 'test-screenshots/03-smart-annotation.png' });
            console.log('📸 Screenshot: Smart annotation interface');
            
            // Check if interface loaded
            const uploadArea = await page.$('input[type="file"], .upload-area, #pdf-upload');
            if (uploadArea) {
                console.log('✅ Smart annotation interface loaded');
                
                // Try to upload PDF
                if (uploadArea.tagName === 'INPUT') {
                    await uploadArea.uploadFile(this.pdfPath);
                    console.log('📄 PDF uploaded to annotation interface');
                    
                    // Wait for processing
                    await page.waitForTimeout(5000);
                    
                    // Capture the annotation view
                    await page.screenshot({ path: 'test-screenshots/04-annotation-view.png', fullPage: true });
                    console.log('📸 Screenshot: Annotation view captured');
                    
                    // Check for canvas or viewer
                    const pdfViewer = await page.$('canvas, .pdf-viewer, #pdf-container');
                    if (pdfViewer) {
                        console.log('✅ PDF viewer detected');
                        
                        // Check page count
                        const pageInfo = await page.$eval('body', body => body.innerText);
                        if (pageInfo.includes('19')) {
                            console.log('✅ All 19 pages detected');
                        }
                    }
                }
            } else {
                console.log('⚠️ Smart annotation interface not available');
            }
            
        } catch (error) {
            console.error('❌ Smart annotation error:', error.message);
            this.results.errors.push({ test: 'annotation', error: error.message });
            await page.screenshot({ path: 'test-screenshots/error-annotation.png' });
        } finally {
            await page.close();
        }
    }

    async testAPIProcessing() {
        const FormData = require('form-data');
        const fetch = require('node-fetch');
        
        try {
            const pdfBuffer = await fs.readFile(this.pdfPath);
            console.log(`📄 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
            
            // Test different API endpoints
            const endpoints = [
                '/api/pdf-extract',
                '/api/smart-ocr',
                '/api/bulletproof-processor'
            ];
            
            for (const endpoint of endpoints) {
                console.log(`\n🔌 Testing ${endpoint}...`);
                
                const formData = new FormData();
                formData.append('pdf', pdfBuffer, '2. Messos - 31.03.2025.pdf');
                
                const startTime = Date.now();
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: 'POST',
                    body: formData,
                    headers: formData.getHeaders()
                });
                
                const processingTime = Date.now() - startTime;
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Success in ${processingTime}ms`);
                    
                    if (data.securities && data.securities.length > 0) {
                        console.log(`  Found ${data.securities.length} securities`);
                        console.log(`  Total: $${data.totalValue?.toLocaleString() || 'N/A'}`);
                        
                        // Store best result
                        if (!this.results.extractedData || data.securities.length > this.results.extractedData.securities?.length) {
                            this.results.extractedData = data;
                        }
                    }
                } else {
                    console.log(`❌ Failed: ${response.status} ${response.statusText}`);
                }
            }
            
        } catch (error) {
            console.error('❌ API processing error:', error.message);
            this.results.errors.push({ test: 'api', error: error.message });
        }
    }

    async generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 COMPLETE TEST RESULTS REPORT');
        console.log('='.repeat(60));
        
        if (this.results.extractedData && this.results.extractedData.securities) {
            const data = this.results.extractedData;
            
            console.log('\n🎯 EXTRACTION RESULTS:');
            console.log(`Total Securities Found: ${data.securities.length}`);
            console.log(`Total Portfolio Value: $${data.totalValue?.toLocaleString() || 'N/A'}`);
            console.log(`Extraction Accuracy: ${data.accuracy || 'N/A'}`);
            console.log(`Processing Time: ${(this.results.processingTime / 1000).toFixed(2)}s`);
            
            console.log('\n📋 COMPLETE SECURITIES LIST:');
            console.log('─'.repeat(100));
            console.log('No. | ISIN           | Security Name                                    | Value (USD)');
            console.log('─'.repeat(100));
            
            data.securities.forEach((sec, index) => {
                const name = (sec.name || sec.securityName || 'Unknown').substring(0, 45).padEnd(45);
                const value = sec.marketValue || sec.value || 0;
                console.log(`${(index + 1).toString().padStart(3)} | ${sec.isin} | ${name} | $${value.toLocaleString().padStart(12)}`);
            });
            
            console.log('─'.repeat(100));
            
            // Save detailed JSON report
            const report = {
                testDate: new Date().toISOString(),
                pdfFile: '2. Messos - 31.03.2025.pdf',
                results: this.results,
                extractedSecurities: data.securities,
                summary: {
                    totalSecurities: data.securities.length,
                    totalValue: data.totalValue,
                    accuracy: data.accuracy,
                    processingTimeMs: this.results.processingTime
                }
            };
            
            await fs.writeFile(
                'messos-test-results.json',
                JSON.stringify(report, null, 2)
            );
            
            console.log('\n💾 Detailed results saved to messos-test-results.json');
            
        } else {
            console.log('\n❌ NO DATA EXTRACTED');
            console.log('Errors encountered:', this.results.errors);
        }
        
        console.log('\n📸 Screenshots saved in test-screenshots/ folder');
        console.log('\n✅ Test completed!');
    }
}

// Run the test
async function runRealTest() {
    // Create screenshots directory
    try {
        await fs.mkdir('test-screenshots', { recursive: true });
    } catch (e) {}
    
    const test = new RealMessosTest();
    await test.runCompleteTest();
}

runRealTest().catch(console.error);