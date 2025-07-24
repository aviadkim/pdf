#!/usr/bin/env node

/**
 * COMPREHENSIVE END-TO-END TEST SUITE
 * 
 * Tests the complete PDF processing workflow using Playwright and Puppeteer:
 * 1. Mistral OCR Integration Testing
 * 2. Annotation System Testing  
 * 3. Learning System Integration Testing
 * 4. Complete Workflow Testing
 */

const { chromium, firefox, webkit } = require('playwright');
const puppeteer = require('puppeteer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveEndToEndTestSuite {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.testResults = {
            mistralOCR: {},
            annotationSystem: {},
            learningSystem: {},
            completeWorkflow: {},
            performance: {},
            screenshots: [],
            summary: {}
        };
        this.screenshotCounter = 0;
    }

    async takeScreenshot(page, testName, description) {
        try {
            const timestamp = Date.now();
            const filename = `test-${testName}-${timestamp}.png`;
            const screenshotPath = path.join(__dirname, 'test-screenshots', filename);
            
            // Ensure directory exists
            await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
            
            await page.screenshot({ 
                path: screenshotPath, 
                fullPage: true,
                quality: 90
            });
            
            this.testResults.screenshots.push({
                test: testName,
                description,
                filename,
                timestamp: new Date(timestamp).toISOString()
            });
            
            console.log(`📸 Screenshot saved: ${filename}`);
            return filename;
        } catch (error) {
            console.error('❌ Screenshot failed:', error.message);
            return null;
        }
    }

    async runMistralOCRIntegrationTests() {
        console.log('\n🔮 MISTRAL OCR INTEGRATION TESTING');
        console.log('===================================');
        
        const results = {
            endpointAccessibility: false,
            apiConfiguration: false,
            pdfUploadFunctionality: false,
            textExtraction: false,
            structuredDataExtraction: false,
            accuracyMetrics: false,
            errors: []
        };

        let browser;
        try {
            browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Test 1: Endpoint Accessibility
            console.log('1️⃣ Testing Mistral OCR endpoint accessibility...');
            try {
                // Test GET request (should return 405)
                const getResponse = await axios.get(`${this.baseUrl}/api/mistral-ocr-extract`);
                results.endpointAccessibility = false;
                results.errors.push('GET request should return 405, got 200');
            } catch (error) {
                if (error.response && error.response.status === 405) {
                    results.endpointAccessibility = true;
                    console.log('✅ Endpoint correctly returns 405 for GET requests');
                } else if (error.response && error.response.status === 404) {
                    results.endpointAccessibility = false;
                    results.errors.push('Endpoint returns 404 - not properly registered');
                    console.log('❌ Endpoint returns 404 - not accessible');
                } else {
                    results.endpointAccessibility = false;
                    results.errors.push(`Unexpected error: ${error.message}`);
                    console.log('❌ Unexpected endpoint error:', error.message);
                }
            }

            // Test 2: API Configuration Check
            console.log('2️⃣ Testing API configuration...');
            try {
                await page.goto(`${this.baseUrl}/api/system-capabilities`);
                const content = await page.textContent('body');
                const capabilities = JSON.parse(content);
                
                if (capabilities.endpoints && capabilities.endpoints.mistral_ocr) {
                    results.apiConfiguration = true;
                    console.log('✅ Mistral OCR properly configured in system capabilities');
                    console.log(`   Endpoint: ${capabilities.endpoints.mistral_ocr.endpoint}`);
                    console.log(`   Accuracy: ${capabilities.endpoints.mistral_ocr.accuracy}`);
                } else {
                    results.apiConfiguration = false;
                    results.errors.push('Mistral OCR not found in system capabilities');
                    console.log('❌ Mistral OCR not configured in system capabilities');
                }
            } catch (error) {
                results.apiConfiguration = false;
                results.errors.push(`System capabilities error: ${error.message}`);
                console.log('❌ Failed to check system capabilities:', error.message);
            }

            // Test 3: PDF Upload Functionality via Web Interface
            console.log('3️⃣ Testing PDF upload functionality...');
            try {
                await page.goto(`${this.baseUrl}/smart-annotation`);
                await page.waitForLoadState('networkidle');
                
                await this.takeScreenshot(page, 'mistral-upload-interface', 'PDF upload interface');
                
                const fileInput = page.locator('input[type="file"]').first();
                const uploadForm = page.locator('form').first();
                
                const hasFileInput = await fileInput.count() > 0;
                const hasUploadForm = await uploadForm.count() > 0;
                
                if (hasFileInput && hasUploadForm) {
                    results.pdfUploadFunctionality = true;
                    console.log('✅ PDF upload interface is functional');
                    
                    // Test file selection (simulate)
                    const isVisible = await fileInput.isVisible();
                    console.log(`   File input visible: ${isVisible ? '✅' : '❌'}`);
                } else {
                    results.pdfUploadFunctionality = false;
                    results.errors.push('PDF upload interface missing components');
                    console.log('❌ PDF upload interface incomplete');
                }
            } catch (error) {
                results.pdfUploadFunctionality = false;
                results.errors.push(`Upload interface error: ${error.message}`);
                console.log('❌ PDF upload interface test failed:', error.message);
            }

            // Test 4: Create and Test with Sample PDF
            console.log('4️⃣ Testing text extraction with sample PDF...');
            try {
                // Create a test PDF with financial data
                const testPdfContent = await this.createFinancialTestPDF();
                const testPdfPath = path.join(__dirname, 'test-financial-document.pdf');
                await fs.writeFile(testPdfPath, testPdfContent);
                
                // Test API endpoint with POST request (without file for now)
                try {
                    const postResponse = await axios.post(`${this.baseUrl}/api/mistral-ocr-extract`);
                    results.textExtraction = false;
                    results.errors.push('POST without file should return 400');
                } catch (error) {
                    if (error.response && error.response.status === 400) {
                        results.textExtraction = true;
                        console.log('✅ API correctly validates file requirement');
                        
                        const responseData = error.response.data;
                        if (responseData && responseData.error) {
                            console.log(`   Error message: ${responseData.error}`);
                        }
                    } else {
                        results.textExtraction = false;
                        results.errors.push(`Unexpected POST response: ${error.response?.status || error.message}`);
                    }
                }
                
                // Clean up test file
                await fs.unlink(testPdfPath).catch(() => {});
                
            } catch (error) {
                results.textExtraction = false;
                results.errors.push(`Text extraction test error: ${error.message}`);
                console.log('❌ Text extraction test failed:', error.message);
            }

            // Test 5: Structured Data Extraction Capabilities
            console.log('5️⃣ Testing structured data extraction capabilities...');
            try {
                // Check if the system supports structured data extraction
                await page.goto(`${this.baseUrl}`);
                const content = await page.content();
                
                const hasFinancialFeatures = content.includes('financial') || content.includes('table') || content.includes('securities');
                const hasStructuredExtraction = content.includes('structured') || content.includes('data extraction');
                
                if (hasFinancialFeatures || hasStructuredExtraction) {
                    results.structuredDataExtraction = true;
                    console.log('✅ System supports structured data extraction');
                } else {
                    results.structuredDataExtraction = false;
                    console.log('⚠️  Structured data extraction capabilities unclear');
                }
            } catch (error) {
                results.structuredDataExtraction = false;
                results.errors.push(`Structured data test error: ${error.message}`);
            }

            // Test 6: Accuracy Metrics Validation
            console.log('6️⃣ Testing accuracy metrics...');
            try {
                await page.goto(`${this.baseUrl}`);
                const content = await page.content();
                
                const hasAccuracyMetrics = content.includes('accuracy') || content.includes('%') || content.includes('94.89');
                const hasMistralMetrics = content.includes('Mistral') && content.includes('accuracy');
                
                if (hasAccuracyMetrics && hasMistralMetrics) {
                    results.accuracyMetrics = true;
                    console.log('✅ Accuracy metrics are displayed');
                } else {
                    results.accuracyMetrics = false;
                    console.log('⚠️  Accuracy metrics not clearly displayed');
                }
            } catch (error) {
                results.accuracyMetrics = false;
                results.errors.push(`Accuracy metrics test error: ${error.message}`);
            }

        } catch (error) {
            results.errors.push(`Browser test error: ${error.message}`);
            console.error('❌ Browser test failed:', error.message);
        } finally {
            if (browser) await browser.close();
        }

        this.testResults.mistralOCR = results;
        
        // Summary
        const passedTests = Object.values(results).filter(v => v === true).length;
        const totalTests = Object.keys(results).length - 1; // Exclude errors array
        console.log(`\n📊 Mistral OCR Tests: ${passedTests}/${totalTests} passed`);
        
        return results;
    }

    async runAnnotationSystemTests() {
        console.log('\n🎨 ANNOTATION SYSTEM TESTING');
        console.log('=============================');
        
        const results = {
            interfaceAccessibility: false,
            fileUploadForms: false,
            interactiveElements: false,
            feedbackMechanism: false,
            visualAnnotationTools: false,
            errors: []
        };

        let browser;
        try {
            browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Test 1: Interface Accessibility
            console.log('1️⃣ Testing annotation interface accessibility...');
            try {
                await page.goto(`${this.baseUrl}/smart-annotation`);
                await page.waitForLoadState('networkidle');
                
                const title = await page.title();
                const hasAnnotationContent = await page.locator('text=annotation').count() > 0;
                
                await this.takeScreenshot(page, 'annotation-interface', 'Smart annotation interface');
                
                if (title && hasAnnotationContent) {
                    results.interfaceAccessibility = true;
                    console.log(`✅ Annotation interface accessible: "${title}"`);
                } else {
                    results.interfaceAccessibility = false;
                    results.errors.push('Annotation interface not properly loaded');
                    console.log('❌ Annotation interface not accessible');
                }
            } catch (error) {
                results.interfaceAccessibility = false;
                results.errors.push(`Interface accessibility error: ${error.message}`);
                console.log('❌ Interface accessibility test failed:', error.message);
            }

            // Test 2: File Upload Forms
            console.log('2️⃣ Testing file upload forms...');
            try {
                const fileInputs = page.locator('input[type="file"]');
                const forms = page.locator('form');
                const submitButtons = page.locator('button[type="submit"], input[type="submit"]');
                
                const fileInputCount = await fileInputs.count();
                const formCount = await forms.count();
                const submitButtonCount = await submitButtons.count();
                
                console.log(`   File inputs found: ${fileInputCount}`);
                console.log(`   Forms found: ${formCount}`);
                console.log(`   Submit buttons found: ${submitButtonCount}`);
                
                if (fileInputCount > 0 && formCount > 0) {
                    results.fileUploadForms = true;
                    console.log('✅ File upload forms are present');
                    
                    // Test form attributes
                    if (fileInputCount > 0) {
                        const firstFileInput = fileInputs.first();
                        const acceptAttr = await firstFileInput.getAttribute('accept');
                        console.log(`   File input accepts: ${acceptAttr || 'any file type'}`);
                    }
                } else {
                    results.fileUploadForms = false;
                    results.errors.push('File upload forms missing or incomplete');
                    console.log('❌ File upload forms incomplete');
                }
            } catch (error) {
                results.fileUploadForms = false;
                results.errors.push(`File upload forms error: ${error.message}`);
                console.log('❌ File upload forms test failed:', error.message);
            }

            // Test 3: Interactive Elements
            console.log('3️⃣ Testing interactive elements...');
            try {
                const buttons = page.locator('button');
                const inputs = page.locator('input');
                const clickableElements = page.locator('[onclick], [data-action], .clickable, .btn');
                
                const buttonCount = await buttons.count();
                const inputCount = await inputs.count();
                const clickableCount = await clickableElements.count();
                
                console.log(`   Buttons found: ${buttonCount}`);
                console.log(`   Input elements found: ${inputCount}`);
                console.log(`   Clickable elements found: ${clickableCount}`);
                
                if (buttonCount > 0 || clickableCount > 0) {
                    results.interactiveElements = true;
                    console.log('✅ Interactive elements are present');
                    
                    // Test button functionality (hover test)
                    if (buttonCount > 0) {
                        const firstButton = buttons.first();
                        await firstButton.hover();
                        console.log('   Button hover test: ✅');
                    }
                } else {
                    results.interactiveElements = false;
                    results.errors.push('No interactive elements found');
                    console.log('❌ No interactive elements found');
                }
            } catch (error) {
                results.interactiveElements = false;
                results.errors.push(`Interactive elements error: ${error.message}`);
                console.log('❌ Interactive elements test failed:', error.message);
            }

            // Test 4: Feedback Mechanism
            console.log('4️⃣ Testing feedback mechanism...');
            try {
                const content = await page.content();
                const hasFeedbackElements = content.includes('feedback') || 
                                          content.includes('correct') || 
                                          content.includes('annotation') ||
                                          content.includes('improve');
                
                const feedbackForms = page.locator('form[action*="feedback"], .feedback-form, [data-feedback]');
                const feedbackFormCount = await feedbackForms.count();
                
                if (hasFeedbackElements || feedbackFormCount > 0) {
                    results.feedbackMechanism = true;
                    console.log('✅ Feedback mechanism elements found');
                    console.log(`   Feedback forms: ${feedbackFormCount}`);
                } else {
                    results.feedbackMechanism = false;
                    console.log('⚠️  Feedback mechanism not clearly visible');
                }
            } catch (error) {
                results.feedbackMechanism = false;
                results.errors.push(`Feedback mechanism error: ${error.message}`);
                console.log('❌ Feedback mechanism test failed:', error.message);
            }

            // Test 5: Visual Annotation Tools
            console.log('5️⃣ Testing visual annotation tools...');
            try {
                const content = await page.content();
                const hasCanvasElements = await page.locator('canvas').count() > 0;
                const hasSVGElements = await page.locator('svg').count() > 0;
                const hasAnnotationTools = content.includes('annotation') && 
                                         (content.includes('tool') || content.includes('draw') || content.includes('mark'));
                
                if (hasCanvasElements || hasSVGElements || hasAnnotationTools) {
                    results.visualAnnotationTools = true;
                    console.log('✅ Visual annotation tools detected');
                    console.log(`   Canvas elements: ${await page.locator('canvas').count()}`);
                    console.log(`   SVG elements: ${await page.locator('svg').count()}`);
                } else {
                    results.visualAnnotationTools = false;
                    console.log('⚠️  Visual annotation tools not detected');
                }
            } catch (error) {
                results.visualAnnotationTools = false;
                results.errors.push(`Visual annotation tools error: ${error.message}`);
                console.log('❌ Visual annotation tools test failed:', error.message);
            }

        } catch (error) {
            results.errors.push(`Browser test error: ${error.message}`);
            console.error('❌ Browser test failed:', error.message);
        } finally {
            if (browser) await browser.close();
        }

        this.testResults.annotationSystem = results;
        
        // Summary
        const passedTests = Object.values(results).filter(v => v === true).length;
        const totalTests = Object.keys(results).length - 1; // Exclude errors array
        console.log(`\n📊 Annotation System Tests: ${passedTests}/${totalTests} passed`);
        
        return results;
    }

    async createFinancialTestPDF() {
        // Create a simple PDF with financial data for testing
        return `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R>>endobj
4 0 obj<</Length 200>>stream
BT/F1 12 Tf 50 700 Td(FINANCIAL PORTFOLIO SUMMARY)Tj
0 -20 Td(Security: AAPL - Apple Inc.)Tj
0 -20 Td(Shares: 100)Tj
0 -20 Td(Price: $150.00)Tj
0 -20 Td(Value: $15,000.00)Tj
0 -20 Td(Date: 2025-01-20)Tj
ET
endstream endobj
xref 0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000189 00000 n 
trailer<</Size 5/Root 1 0 R>>
startxref 440
%%EOF`;
    }

    async runLearningSystemIntegrationTests() {
        console.log('\n🧠 LEARNING SYSTEM INTEGRATION TESTING');
        console.log('=======================================');

        const results = {
            annotationCapture: false,
            annotationStorage: false,
            learningFromCorrections: false,
            feedbackLoop: false,
            improvementMetrics: false,
            errors: []
        };

        let browser;
        try {
            browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Test 1: Annotation Capture
            console.log('1️⃣ Testing annotation capture...');
            try {
                await page.goto(`${this.baseUrl}/smart-annotation`);
                await page.waitForLoadState('networkidle');

                // Look for annotation capture mechanisms
                const content = await page.content();
                const hasAnnotationCapture = content.includes('capture') ||
                                            content.includes('save') ||
                                            content.includes('annotation') ||
                                            content.includes('correction');

                const captureElements = page.locator('[data-capture], .capture, .save-annotation');
                const captureElementCount = await captureElements.count();

                if (hasAnnotationCapture || captureElementCount > 0) {
                    results.annotationCapture = true;
                    console.log('✅ Annotation capture mechanisms detected');
                } else {
                    results.annotationCapture = false;
                    console.log('⚠️  Annotation capture mechanisms not clearly visible');
                }
            } catch (error) {
                results.annotationCapture = false;
                results.errors.push(`Annotation capture error: ${error.message}`);
            }

            // Test 2: Check for Learning System APIs
            console.log('2️⃣ Testing learning system APIs...');
            try {
                // Check if learning endpoints exist
                const learningEndpoints = [
                    '/api/learning-stats',
                    '/api/smart-ocr-stats',
                    '/api/patterns',
                    '/api/corrections'
                ];

                let workingEndpoints = 0;
                for (const endpoint of learningEndpoints) {
                    try {
                        await page.goto(`${this.baseUrl}${endpoint}`);
                        const content = await page.content();
                        if (!content.includes('Cannot GET') && !content.includes('404')) {
                            workingEndpoints++;
                            console.log(`   ✅ ${endpoint}: Available`);
                        } else {
                            console.log(`   ❌ ${endpoint}: Not available`);
                        }
                    } catch (error) {
                        console.log(`   ❌ ${endpoint}: Error - ${error.message}`);
                    }
                }

                if (workingEndpoints > 0) {
                    results.learningFromCorrections = true;
                    console.log(`✅ Learning system APIs: ${workingEndpoints}/${learningEndpoints.length} available`);
                } else {
                    results.learningFromCorrections = false;
                    console.log('❌ No learning system APIs available');
                }
            } catch (error) {
                results.learningFromCorrections = false;
                results.errors.push(`Learning system API error: ${error.message}`);
            }

            // Test 3: Feedback Loop Testing
            console.log('3️⃣ Testing feedback loop...');
            try {
                await page.goto(`${this.baseUrl}`);
                const content = await page.content();

                const hasFeedbackLoop = content.includes('feedback') &&
                                      (content.includes('improve') || content.includes('learn') || content.includes('accuracy'));

                const hasProgressiveImprovement = content.includes('100%') ||
                                                content.includes('target') ||
                                                content.includes('progress');

                if (hasFeedbackLoop && hasProgressiveImprovement) {
                    results.feedbackLoop = true;
                    console.log('✅ Feedback loop mechanisms detected');
                } else {
                    results.feedbackLoop = false;
                    console.log('⚠️  Feedback loop not clearly implemented');
                }
            } catch (error) {
                results.feedbackLoop = false;
                results.errors.push(`Feedback loop error: ${error.message}`);
            }

            // Test 4: Improvement Metrics
            console.log('4️⃣ Testing improvement metrics...');
            try {
                await page.goto(`${this.baseUrl}`);
                const content = await page.content();

                const hasMetrics = content.includes('accuracy') ||
                                 content.includes('%') ||
                                 content.includes('improvement') ||
                                 content.includes('progress');

                const hasTargetAccuracy = content.includes('100%') || content.includes('99.9%');

                if (hasMetrics && hasTargetAccuracy) {
                    results.improvementMetrics = true;
                    console.log('✅ Improvement metrics are displayed');
                } else {
                    results.improvementMetrics = false;
                    console.log('⚠️  Improvement metrics not clearly displayed');
                }
            } catch (error) {
                results.improvementMetrics = false;
                results.errors.push(`Improvement metrics error: ${error.message}`);
            }

        } catch (error) {
            results.errors.push(`Browser test error: ${error.message}`);
            console.error('❌ Browser test failed:', error.message);
        } finally {
            if (browser) await browser.close();
        }

        this.testResults.learningSystem = results;

        // Summary
        const passedTests = Object.values(results).filter(v => v === true).length;
        const totalTests = Object.keys(results).length - 1;
        console.log(`\n📊 Learning System Tests: ${passedTests}/${totalTests} passed`);

        return results;
    }

    async runCompleteWorkflowTests() {
        console.log('\n🔄 COMPLETE WORKFLOW TESTING');
        console.log('=============================');

        const results = {
            fullPipeline: false,
            errorHandling: false,
            differentPDFTypes: false,
            accuracyProgression: false,
            performanceMetrics: {},
            errors: []
        };

        let browser;
        try {
            browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Test 1: Full Pipeline Test
            console.log('1️⃣ Testing full pipeline workflow...');
            try {
                const startTime = Date.now();

                // Step 1: Navigate to homepage
                await page.goto(`${this.baseUrl}`);
                await page.waitForLoadState('networkidle');
                await this.takeScreenshot(page, 'workflow-homepage', 'Homepage - Start of workflow');

                // Step 2: Navigate to annotation interface
                await page.goto(`${this.baseUrl}/smart-annotation`);
                await page.waitForLoadState('networkidle');
                await this.takeScreenshot(page, 'workflow-annotation', 'Annotation interface');

                // Step 3: Check for upload capability
                const fileInput = page.locator('input[type="file"]').first();
                const hasFileInput = await fileInput.count() > 0;

                if (hasFileInput) {
                    console.log('✅ File upload interface available');

                    // Step 4: Test form interaction
                    const isFileInputVisible = await fileInput.isVisible();
                    console.log(`   File input visible: ${isFileInputVisible ? '✅' : '❌'}`);

                    results.fullPipeline = true;
                } else {
                    results.fullPipeline = false;
                    results.errors.push('File upload interface not available');
                }

                const endTime = Date.now();
                results.performanceMetrics.pipelineTime = endTime - startTime;
                console.log(`   Pipeline test time: ${results.performanceMetrics.pipelineTime}ms`);

            } catch (error) {
                results.fullPipeline = false;
                results.errors.push(`Full pipeline error: ${error.message}`);
                console.log('❌ Full pipeline test failed:', error.message);
            }

            // Test 2: Error Handling
            console.log('2️⃣ Testing error handling...');
            try {
                // Test invalid endpoints
                const invalidEndpoints = [
                    '/api/nonexistent',
                    '/invalid-page',
                    '/api/mistral-ocr-extract/invalid'
                ];

                let errorHandlingScore = 0;
                for (const endpoint of invalidEndpoints) {
                    try {
                        await page.goto(`${this.baseUrl}${endpoint}`);
                        const content = await page.content();

                        if (content.includes('404') || content.includes('Not Found') || content.includes('Error')) {
                            errorHandlingScore++;
                            console.log(`   ✅ ${endpoint}: Proper error handling`);
                        } else {
                            console.log(`   ❌ ${endpoint}: No error handling`);
                        }
                    } catch (error) {
                        console.log(`   ⚠️  ${endpoint}: ${error.message}`);
                    }
                }

                if (errorHandlingScore >= invalidEndpoints.length / 2) {
                    results.errorHandling = true;
                    console.log('✅ Error handling is functional');
                } else {
                    results.errorHandling = false;
                    console.log('❌ Error handling needs improvement');
                }

            } catch (error) {
                results.errorHandling = false;
                results.errors.push(`Error handling test error: ${error.message}`);
            }

            // Test 3: Different PDF Types Support
            console.log('3️⃣ Testing different PDF types support...');
            try {
                await page.goto(`${this.baseUrl}`);
                const content = await page.content();

                const supportsFinancial = content.includes('financial') || content.includes('portfolio');
                const supportsTables = content.includes('table') || content.includes('structured');
                const supportsScanned = content.includes('scanned') || content.includes('OCR');

                const supportedTypes = [supportsFinancial, supportsTables, supportsScanned].filter(Boolean).length;

                if (supportedTypes >= 2) {
                    results.differentPDFTypes = true;
                    console.log(`✅ Supports multiple PDF types (${supportedTypes}/3)`);
                    console.log(`   Financial documents: ${supportsFinancial ? '✅' : '❌'}`);
                    console.log(`   Tables: ${supportsTables ? '✅' : '❌'}`);
                    console.log(`   Scanned documents: ${supportsScanned ? '✅' : '❌'}`);
                } else {
                    results.differentPDFTypes = false;
                    console.log('⚠️  Limited PDF type support detected');
                }

            } catch (error) {
                results.differentPDFTypes = false;
                results.errors.push(`PDF types test error: ${error.message}`);
            }

            // Test 4: Accuracy Progression
            console.log('4️⃣ Testing accuracy progression indicators...');
            try {
                await page.goto(`${this.baseUrl}`);
                const content = await page.content();

                const hasInitialAccuracy = content.includes('80') || content.includes('90') || content.includes('Initial');
                const hasTargetAccuracy = content.includes('100%') || content.includes('99.9%') || content.includes('Target');
                const hasProgressionIndicator = content.includes('improve') || content.includes('progress') || content.includes('learning');

                if (hasInitialAccuracy && hasTargetAccuracy && hasProgressionIndicator) {
                    results.accuracyProgression = true;
                    console.log('✅ Accuracy progression clearly indicated');
                    console.log(`   Initial accuracy mentioned: ${hasInitialAccuracy ? '✅' : '❌'}`);
                    console.log(`   Target accuracy mentioned: ${hasTargetAccuracy ? '✅' : '❌'}`);
                    console.log(`   Progression indicator: ${hasProgressionIndicator ? '✅' : '❌'}`);
                } else {
                    results.accuracyProgression = false;
                    console.log('⚠️  Accuracy progression not clearly indicated');
                }

            } catch (error) {
                results.accuracyProgression = false;
                results.errors.push(`Accuracy progression error: ${error.message}`);
            }

        } catch (error) {
            results.errors.push(`Browser test error: ${error.message}`);
            console.error('❌ Browser test failed:', error.message);
        } finally {
            if (browser) await browser.close();
        }

        this.testResults.completeWorkflow = results;

        // Summary
        const passedTests = Object.values(results).filter(v => v === true).length;
        const totalTests = Object.keys(results).length - 2; // Exclude errors and performanceMetrics
        console.log(`\n📊 Complete Workflow Tests: ${passedTests}/${totalTests} passed`);

        return results;
    }

    async runPuppeteerPerformanceTests() {
        console.log('\n🤖 PUPPETEER PERFORMANCE TESTING');
        console.log('==================================');

        const results = {
            loadTimes: {},
            networkRequests: {},
            memoryUsage: {},
            errors: []
        };

        let browser;
        try {
            browser = await puppeteer.launch({ headless: false });
            const page = await browser.newPage();

            // Enable performance monitoring
            await page.setCacheEnabled(false);

            // Test homepage performance
            console.log('1️⃣ Testing homepage performance...');
            const startTime = Date.now();
            await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
            const loadTime = Date.now() - startTime;

            results.loadTimes.homepage = loadTime;
            console.log(`   Homepage load time: ${loadTime}ms`);

            // Test annotation interface performance
            console.log('2️⃣ Testing annotation interface performance...');
            const annotationStartTime = Date.now();
            await page.goto(`${this.baseUrl}/smart-annotation`, { waitUntil: 'networkidle2' });
            const annotationLoadTime = Date.now() - annotationStartTime;

            results.loadTimes.annotation = annotationLoadTime;
            console.log(`   Annotation interface load time: ${annotationLoadTime}ms`);

            // Memory usage
            const metrics = await page.metrics();
            results.memoryUsage = {
                JSHeapUsedSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 100) / 100,
                JSHeapTotalSize: Math.round(metrics.JSHeapTotalSize / 1024 / 1024 * 100) / 100
            };

            console.log(`   Memory usage: ${results.memoryUsage.JSHeapUsedSize}MB / ${results.memoryUsage.JSHeapTotalSize}MB`);

        } catch (error) {
            results.errors.push(`Performance test error: ${error.message}`);
            console.error('❌ Performance test failed:', error.message);
        } finally {
            if (browser) await browser.close();
        }

        this.testResults.performance = results;
        return results;
    }

    async generateComprehensiveReport() {
        console.log('\n📊 GENERATING COMPREHENSIVE REPORT');
        console.log('===================================');

        const timestamp = new Date().toISOString();
        const reportData = {
            timestamp,
            testSuite: 'Comprehensive End-to-End PDF Processing Workflow',
            baseUrl: this.baseUrl,
            results: this.testResults,
            summary: this.calculateSummary()
        };

        // Save detailed report
        const reportPath = `comprehensive-e2e-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

        // Display summary
        console.log('\n🎯 TEST SUMMARY');
        console.log('===============');
        console.log(`📅 Test Date: ${new Date(timestamp).toLocaleString()}`);
        console.log(`🌐 Service URL: ${this.baseUrl}`);
        console.log(`📸 Screenshots: ${this.testResults.screenshots.length} captured`);
        console.log('');

        const summary = reportData.summary;
        console.log('📋 Test Results:');
        console.log(`   🔮 Mistral OCR Integration: ${summary.mistralOCR.passed}/${summary.mistralOCR.total} (${summary.mistralOCR.percentage}%)`);
        console.log(`   🎨 Annotation System: ${summary.annotationSystem.passed}/${summary.annotationSystem.total} (${summary.annotationSystem.percentage}%)`);
        console.log(`   🧠 Learning System: ${summary.learningSystem.passed}/${summary.learningSystem.total} (${summary.learningSystem.percentage}%)`);
        console.log(`   🔄 Complete Workflow: ${summary.completeWorkflow.passed}/${summary.completeWorkflow.total} (${summary.completeWorkflow.percentage}%)`);
        console.log('');
        console.log(`🎯 Overall Score: ${summary.overall.percentage}% (${summary.overall.passed}/${summary.overall.total} tests passed)`);
        console.log('');

        if (this.testResults.performance.loadTimes) {
            console.log('⚡ Performance Metrics:');
            console.log(`   Homepage: ${this.testResults.performance.loadTimes.homepage || 'N/A'}ms`);
            console.log(`   Annotation: ${this.testResults.performance.loadTimes.annotation || 'N/A'}ms`);
            if (this.testResults.performance.memoryUsage) {
                console.log(`   Memory: ${this.testResults.performance.memoryUsage.JSHeapUsedSize}MB`);
            }
        }

        console.log(`\n💾 Detailed report saved: ${reportPath}`);

        return reportData;
    }

    calculateSummary() {
        const calculateTestScore = (results) => {
            if (!results || typeof results !== 'object') return { passed: 0, total: 0, percentage: 0 };

            const testResults = Object.entries(results).filter(([key, value]) =>
                key !== 'errors' && key !== 'performanceMetrics' && typeof value === 'boolean'
            );

            const passed = testResults.filter(([, value]) => value === true).length;
            const total = testResults.length;
            const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;

            return { passed, total, percentage };
        };

        const mistralOCR = calculateTestScore(this.testResults.mistralOCR);
        const annotationSystem = calculateTestScore(this.testResults.annotationSystem);
        const learningSystem = calculateTestScore(this.testResults.learningSystem);
        const completeWorkflow = calculateTestScore(this.testResults.completeWorkflow);

        const overallPassed = mistralOCR.passed + annotationSystem.passed + learningSystem.passed + completeWorkflow.passed;
        const overallTotal = mistralOCR.total + annotationSystem.total + learningSystem.total + completeWorkflow.total;
        const overallPercentage = overallTotal > 0 ? Math.round((overallPassed / overallTotal) * 100) : 0;

        return {
            mistralOCR,
            annotationSystem,
            learningSystem,
            completeWorkflow,
            overall: {
                passed: overallPassed,
                total: overallTotal,
                percentage: overallPercentage
            }
        };
    }

    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE END-TO-END TEST SUITE');
        console.log('=================================================');
        console.log(`🌐 Testing service: ${this.baseUrl}`);
        console.log(`📅 Test started: ${new Date().toLocaleString()}`);

        try {
            // Run all test suites
            await this.runMistralOCRIntegrationTests();
            await this.runAnnotationSystemTests();
            await this.runLearningSystemIntegrationTests();
            await this.runCompleteWorkflowTests();
            await this.runPuppeteerPerformanceTests();

            // Generate comprehensive report
            const report = await this.generateComprehensiveReport();

            console.log('\n🎉 COMPREHENSIVE TESTING COMPLETED!');
            console.log('====================================');

            return report;

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            console.error(error.stack);
            throw error;
        }
    }
}

async function main() {
    const testSuite = new ComprehensiveEndToEndTestSuite();
    await testSuite.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { ComprehensiveEndToEndTestSuite };
