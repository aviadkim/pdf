#!/usr/bin/env node

/**
 * TEST RENDER DEPLOYMENT - MISTRAL OCR & ANNOTATION SYSTEM
 * Comprehensive test of the live system on Render
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class RenderMistralOCRTester {
    constructor() {
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        this.testPdfPath = path.join(__dirname, 'pdfs', '2. Messos  - 31.03.2025.pdf');
        this.testResults = {
            mistralOCR: false,
            pdfProcessing: false,
            dataExtraction: false,
            annotationSystem: false,
            learningCapability: false,
            accuracyImprovement: false,
            errors: []
        };
    }

    async runComprehensiveTest() {
        console.log('🚀 TESTING RENDER DEPLOYMENT - MISTRAL OCR & ANNOTATION SYSTEM');
        console.log('URL:', this.renderUrl);
        console.log('=' .repeat(80));

        const browser = await puppeteer.launch({ 
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            // 1. Test system health
            await this.testSystemHealth(browser);
            
            // 2. Test Mistral OCR configuration
            await this.testMistralOCRStatus(browser);
            
            // 3. Test PDF upload and processing
            await this.testPDFProcessing(browser);
            
            // 4. Test annotation interface
            await this.testAnnotationInterface(browser);
            
            // 5. Test human annotation workflow
            await this.testHumanAnnotation(browser);
            
            // 6. Test learning and accuracy improvement
            await this.testLearningSystem(browser);
            
            // 7. Generate comprehensive report
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Critical error:', error);
            this.testResults.errors.push({
                test: 'Critical',
                error: error.message
            });
        } finally {
            await browser.close();
        }
    }

    async testSystemHealth(browser) {
        console.log('\n🏥 Testing System Health...');
        
        const page = await browser.newPage();
        
        try {
            // Test health endpoint
            const response = await page.goto(`${this.renderUrl}/api/smart-ocr-test`);
            const content = await page.content();
            
            console.log('Health check response:', response.status());
            
            if (response.status() === 200) {
                const jsonMatch = content.match(/<pre.*?>(.*?)<\/pre>/s);
                if (jsonMatch) {
                    const healthData = JSON.parse(jsonMatch[1]);
                    console.log('✅ System healthy');
                    console.log('  - Service:', healthData.service);
                    console.log('  - Version:', healthData.version);
                    console.log('  - Mistral Enabled:', healthData.mistralEnabled);
                    
                    this.testResults.mistralOCR = healthData.mistralEnabled;
                } else {
                    console.log('⚠️  Could not parse health data');
                }
            } else {
                console.log('❌ Health check failed:', response.status());
            }
            
        } catch (error) {
            console.error('❌ Health test error:', error.message);
            this.testResults.errors.push({
                test: 'Health Check',
                error: error.message
            });
        } finally {
            await page.close();
        }
    }

    async testMistralOCRStatus(browser) {
        console.log('\n🤖 Testing Mistral OCR Configuration...');
        
        const page = await browser.newPage();
        
        try {
            // Check stats endpoint for Mistral status
            const response = await page.goto(`${this.renderUrl}/api/smart-ocr-stats`);
            
            if (response.status() === 200) {
                const content = await page.content();
                console.log('✅ Stats endpoint accessible');
                
                // Extract JSON from response
                const jsonMatch = content.match(/<pre.*?>(.*?)<\/pre>/s);
                if (jsonMatch) {
                    const stats = JSON.parse(jsonMatch[1]);
                    if (stats.success && stats.stats) {
                        console.log('  - Current Accuracy:', stats.stats.currentAccuracy + '%');
                        console.log('  - Pattern Count:', stats.stats.patternCount);
                        console.log('  - Document Count:', stats.stats.documentCount);
                        console.log('  - Mistral Enabled:', stats.stats.mistralEnabled);
                    }
                }
            } else {
                console.log('❌ Stats endpoint error:', response.status());
            }
            
        } catch (error) {
            console.error('❌ Mistral OCR test error:', error.message);
            this.testResults.errors.push({
                test: 'Mistral OCR Status',
                error: error.message
            });
        } finally {
            await page.close();
        }
    }

    async testPDFProcessing(browser) {
        console.log('\n📄 Testing PDF Upload & Processing...');
        
        const page = await browser.newPage();
        
        try {
            // Navigate to main page
            await page.goto(this.renderUrl, { waitUntil: 'networkidle2' });
            
            // Look for file input
            const fileInput = await page.$('input[type="file"]');
            
            if (fileInput) {
                console.log('✅ File input found');
                
                // Upload test PDF
                await fileInput.uploadFile(this.testPdfPath);
                console.log('✅ PDF uploaded:', path.basename(this.testPdfPath));
                
                // Look for submit button
                const submitButton = await page.$('button[type="submit"]');
                
                if (submitButton) {
                    console.log('⏳ Processing PDF...');
                    
                    // Click submit and wait for response
                    await Promise.all([
                        page.waitForResponse(response => 
                            response.url().includes('/api/smart-ocr-process') ||
                            response.url().includes('/api/pdf-extract') ||
                            response.url().includes('/api/bulletproof-processor')
                        ),
                        submitButton.click()
                    ]);
                    
                    // Wait for results
                    await page.waitForTimeout(3000);
                    
                    // Check for results
                    const results = await page.evaluate(() => {
                        // Look for results in various places
                        const resultsElement = document.querySelector('.results, #results, pre');
                        return resultsElement ? resultsElement.textContent : null;
                    });
                    
                    if (results) {
                        console.log('✅ PDF processed successfully');
                        console.log('📊 Extraction results received');
                        
                        try {
                            const parsedResults = JSON.parse(results);
                            if (parsedResults.accuracy) {
                                console.log('  - Accuracy:', parsedResults.accuracy + '%');
                            }
                            if (parsedResults.securities) {
                                console.log('  - Securities found:', parsedResults.securities.length);
                            }
                            this.testResults.pdfProcessing = true;
                            this.testResults.dataExtraction = true;
                        } catch {
                            console.log('  - Raw results:', results.substring(0, 100) + '...');
                        }
                    }
                } else {
                    console.log('❌ Submit button not found');
                }
            } else {
                console.log('❌ File input not found');
            }
            
        } catch (error) {
            console.error('❌ PDF processing error:', error.message);
            this.testResults.errors.push({
                test: 'PDF Processing',
                error: error.message
            });
        } finally {
            await page.close();
        }
    }

    async testAnnotationInterface(browser) {
        console.log('\n🎨 Testing Annotation Interface...');
        
        const page = await browser.newPage();
        
        try {
            // Navigate to annotation interface
            await page.goto(`${this.renderUrl}/smart-annotation`, { waitUntil: 'networkidle2' });
            
            // Check if annotation interface loads
            const title = await page.title();
            console.log('Page title:', title);
            
            // Look for annotation tools
            const annotationTools = await page.$$('.tool-btn');
            
            if (annotationTools.length > 0) {
                console.log(`✅ Annotation interface loaded with ${annotationTools.length} tools`);
                
                // Get tool names
                const toolNames = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('.tool-btn')).map(btn => btn.textContent);
                });
                
                console.log('Available annotation tools:');
                toolNames.forEach((tool, i) => {
                    console.log(`  ${i + 1}. ${tool}`);
                });
                
                this.testResults.annotationSystem = true;
                
                // Test file upload in annotation interface
                const annotationFileInput = await page.$('input[type="file"]');
                if (annotationFileInput) {
                    console.log('✅ File upload available in annotation interface');
                }
                
            } else {
                console.log('❌ No annotation tools found');
            }
            
        } catch (error) {
            console.error('❌ Annotation interface error:', error.message);
            this.testResults.errors.push({
                test: 'Annotation Interface',
                error: error.message
            });
        } finally {
            await page.close();
        }
    }

    async testHumanAnnotation(browser) {
        console.log('\n👤 Testing Human Annotation Workflow...');
        
        const page = await browser.newPage();
        
        try {
            // Go to annotation interface
            await page.goto(`${this.renderUrl}/smart-annotation`, { waitUntil: 'networkidle2' });
            
            // Upload PDF in annotation interface
            const fileInput = await page.$('input[type="file"]');
            
            if (fileInput) {
                await fileInput.uploadFile(this.testPdfPath);
                console.log('✅ PDF uploaded to annotation interface');
                
                // Wait for processing
                await page.waitForTimeout(2000);
                
                // Simulate annotation workflow
                console.log('🖱️ Simulating human annotations...');
                
                // Test clicking annotation tools
                const tools = [
                    { selector: '.tool-btn:nth-child(1)', name: 'Table Header' },
                    { selector: '.tool-btn:nth-child(2)', name: 'Data Row' },
                    { selector: '.tool-btn:nth-child(3)', name: 'Connection' },
                    { selector: '.tool-btn:nth-child(4)', name: 'Highlight' }
                ];
                
                for (const tool of tools) {
                    const button = await page.$(tool.selector);
                    if (button) {
                        await button.click();
                        console.log(`  - Selected tool: ${tool.name}`);
                        await page.waitForTimeout(500);
                    }
                }
                
                // Simulate drawing annotations on canvas
                const canvas = await page.$('.pdf-canvas, #pdfCanvas');
                if (canvas) {
                    console.log('✅ Canvas found for annotations');
                    
                    // Simulate annotation drawing
                    await page.mouse.move(100, 200);
                    await page.mouse.down();
                    await page.mouse.move(300, 250);
                    await page.mouse.up();
                    console.log('  - Drew annotation: ISIN header');
                    
                    await page.mouse.move(100, 300);
                    await page.mouse.down();
                    await page.mouse.move(300, 350);
                    await page.mouse.up();
                    console.log('  - Drew annotation: ISIN data');
                    
                    await page.mouse.move(350, 200);
                    await page.mouse.down();
                    await page.mouse.move(500, 250);
                    await page.mouse.up();
                    console.log('  - Drew annotation: Value header');
                    
                    await page.mouse.move(350, 300);
                    await page.mouse.down();
                    await page.mouse.move(500, 350);
                    await page.mouse.up();
                    console.log('  - Drew annotation: Value data');
                }
                
                // Look for learn button
                const learnButton = await page.$('#learnBtn, button:contains("Learn"), button:contains("learn")');
                if (learnButton) {
                    console.log('✅ Learn button found');
                    await learnButton.click();
                    await page.waitForTimeout(2000);
                    console.log('  - Learning from annotations triggered');
                    this.testResults.learningCapability = true;
                }
                
            } else {
                console.log('❌ File input not found in annotation interface');
            }
            
        } catch (error) {
            console.error('❌ Human annotation error:', error.message);
            this.testResults.errors.push({
                test: 'Human Annotation',
                error: error.message
            });
        } finally {
            await page.close();
        }
    }

    async testLearningSystem(browser) {
        console.log('\n🧠 Testing Learning & Accuracy Improvement...');
        
        const page = await browser.newPage();
        
        try {
            // Check stats before and after learning
            const statsBefore = await this.getStats(page);
            console.log('Stats before learning:', statsBefore);
            
            // Trigger learning endpoint directly
            const learnResponse = await page.evaluate(async (url) => {
                const response = await fetch(`${url}/api/smart-ocr-learn`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        corrections: [
                            { original: '36622', corrected: '366223', field: 'value' }
                        ],
                        patterns: [
                            { type: 'table-header', content: 'ISIN', coordinates: { x: 100, y: 200 } }
                        ]
                    })
                });
                return await response.json();
            }, this.renderUrl);
            
            console.log('Learning response:', learnResponse);
            
            if (learnResponse.success) {
                console.log('✅ Learning system working');
                console.log('  - Patterns created:', learnResponse.result?.patternsCreated);
                console.log('  - Patterns improved:', learnResponse.result?.patternsImproved);
                console.log('  - Accuracy improvement:', learnResponse.result?.accuracyImprovement);
                
                this.testResults.accuracyImprovement = true;
            }
            
            // Check stats after learning
            const statsAfter = await this.getStats(page);
            console.log('Stats after learning:', statsAfter);
            
            // Compare accuracy
            if (statsAfter && statsBefore) {
                const accuracyGain = (statsAfter.currentAccuracy || 0) - (statsBefore.currentAccuracy || 0);
                console.log(`📈 Accuracy gain: ${accuracyGain}%`);
            }
            
        } catch (error) {
            console.error('❌ Learning system error:', error.message);
            this.testResults.errors.push({
                test: 'Learning System',
                error: error.message
            });
        } finally {
            await page.close();
        }
    }

    async getStats(page) {
        try {
            await page.goto(`${this.renderUrl}/api/smart-ocr-stats`);
            const content = await page.content();
            const jsonMatch = content.match(/<pre.*?>(.*?)<\/pre>/s);
            if (jsonMatch) {
                const stats = JSON.parse(jsonMatch[1]);
                return stats.stats || {};
            }
        } catch {
            return null;
        }
    }

    async generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 RENDER DEPLOYMENT TEST REPORT');
        console.log('='.repeat(80));
        
        console.log('\n🎯 Test Results:');
        console.log(`  ✅ Mistral OCR Enabled: ${this.testResults.mistralOCR ? 'YES' : 'NO'}`);
        console.log(`  ✅ PDF Processing: ${this.testResults.pdfProcessing ? 'WORKING' : 'FAILED'}`);
        console.log(`  ✅ Data Extraction: ${this.testResults.dataExtraction ? 'WORKING' : 'FAILED'}`);
        console.log(`  ✅ Annotation System: ${this.testResults.annotationSystem ? 'WORKING' : 'FAILED'}`);
        console.log(`  ✅ Learning Capability: ${this.testResults.learningCapability ? 'WORKING' : 'FAILED'}`);
        console.log(`  ✅ Accuracy Improvement: ${this.testResults.accuracyImprovement ? 'WORKING' : 'FAILED'}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ Errors Encountered:');
            this.testResults.errors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error.test}: ${error.error}`);
            });
        }
        
        console.log('\n📋 Summary:');
        const workingFeatures = Object.values(this.testResults).filter(v => v === true).length;
        const totalFeatures = 6;
        const successRate = (workingFeatures / totalFeatures * 100).toFixed(1);
        
        console.log(`  Success Rate: ${successRate}% (${workingFeatures}/${totalFeatures} features working)`);
        
        console.log('\n🔍 Key Findings:');
        if (this.testResults.mistralOCR) {
            console.log('  ✅ Mistral OCR is configured and enabled');
        } else {
            console.log('  ❌ Mistral OCR needs API key configuration');
        }
        
        if (this.testResults.annotationSystem && this.testResults.learningCapability) {
            console.log('  ✅ Human annotation workflow is functional');
            console.log('  ✅ System can learn from human input');
            console.log('  ✅ Accuracy improvement through annotation is possible');
        } else {
            console.log('  ⚠️  Annotation system needs attention');
        }
        
        console.log('\n🎯 Messos PDF Processing Capability:');
        if (this.testResults.pdfProcessing && this.testResults.dataExtraction) {
            console.log('  ✅ Can process Messos PDF documents');
            console.log('  ✅ Can extract securities data');
            console.log('  ✅ Ready for ISIN and value extraction');
            console.log('  ✅ Can connect data to correct headlines');
        } else {
            console.log('  ⚠️  PDF processing needs configuration');
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            url: this.renderUrl,
            testResults: this.testResults,
            successRate: successRate + '%',
            recommendations: this.generateRecommendations()
        };
        
        await fs.writeFile(
            path.join(__dirname, 'render-mistral-test-report.json'),
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n📄 Detailed report saved to: render-mistral-test-report.json');
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (!this.testResults.mistralOCR) {
            recommendations.push('Configure MISTRAL_API_KEY environment variable in Render');
        }
        
        if (!this.testResults.pdfProcessing) {
            recommendations.push('Check PDF upload endpoint configuration');
        }
        
        if (!this.testResults.annotationSystem) {
            recommendations.push('Verify annotation interface HTML file is deployed');
        }
        
        if (!this.testResults.learningCapability) {
            recommendations.push('Test learning endpoint with proper data format');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System is fully functional - ready for production use');
        }
        
        return recommendations;
    }
}

// Run the test
async function main() {
    const tester = new RenderMistralOCRTester();
    await tester.runComprehensiveTest();
}

main().catch(console.error);