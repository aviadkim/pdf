#!/usr/bin/env node

/**
 * FOCUSED ANNOTATION SYSTEM TEST
 * 
 * Detailed testing of the annotation system that IS working
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

class FocusedAnnotationSystemTest {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.results = {
            interface: {},
            functionality: {},
            userExperience: {},
            screenshots: []
        };
    }

    async takeScreenshot(page, name, description) {
        try {
            const timestamp = Date.now();
            const filename = `annotation-test-${name}-${timestamp}.png`;
            const screenshotPath = path.join(__dirname, 'test-screenshots', filename);
            
            await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
            await page.screenshot({ 
                path: screenshotPath, 
                fullPage: true
            });
            
            this.results.screenshots.push({
                name,
                description,
                filename,
                timestamp: new Date(timestamp).toISOString()
            });
            
            console.log(`📸 Screenshot: ${filename}`);
            return filename;
        } catch (error) {
            console.error('❌ Screenshot failed:', error.message);
            return null;
        }
    }

    async testAnnotationInterface() {
        console.log('\n🎨 FOCUSED ANNOTATION SYSTEM TEST');
        console.log('==================================');
        
        let browser;
        try {
            browser = await chromium.launch({ headless: false });
            const context = await browser.newContext();
            const page = await context.newPage();

            // Test 1: Interface Loading
            console.log('1️⃣ Testing annotation interface loading...');
            await page.goto(`${this.baseUrl}/smart-annotation`);
            await page.waitForLoadState('networkidle');
            
            const title = await page.title();
            const url = page.url();
            
            console.log(`   Title: "${title}"`);
            console.log(`   URL: ${url}`);
            
            await this.takeScreenshot(page, 'interface-loaded', 'Annotation interface fully loaded');
            
            this.results.interface.title = title;
            this.results.interface.loaded = true;
            
            // Test 2: Page Content Analysis
            console.log('2️⃣ Analyzing page content...');
            const content = await page.content();
            
            const hasAnnotationContent = content.includes('annotation');
            const hasOCRContent = content.includes('OCR');
            const hasSmartContent = content.includes('Smart');
            const hasFinancialContent = content.includes('Financial');
            
            console.log(`   Annotation content: ${hasAnnotationContent ? '✅' : '❌'}`);
            console.log(`   OCR content: ${hasOCRContent ? '✅' : '❌'}`);
            console.log(`   Smart features: ${hasSmartContent ? '✅' : '❌'}`);
            console.log(`   Financial focus: ${hasFinancialContent ? '✅' : '❌'}`);
            
            this.results.interface.contentAnalysis = {
                hasAnnotationContent,
                hasOCRContent,
                hasSmartContent,
                hasFinancialContent
            };
            
            // Test 3: Interactive Elements
            console.log('3️⃣ Testing interactive elements...');
            
            const fileInput = page.locator('input[type="file"]');
            const buttons = page.locator('button');
            const forms = page.locator('form');
            const links = page.locator('a');
            
            const fileInputCount = await fileInput.count();
            const buttonCount = await buttons.count();
            const formCount = await forms.count();
            const linkCount = await links.count();
            
            console.log(`   File inputs: ${fileInputCount}`);
            console.log(`   Buttons: ${buttonCount}`);
            console.log(`   Forms: ${formCount}`);
            console.log(`   Links: ${linkCount}`);
            
            this.results.functionality.elements = {
                fileInputs: fileInputCount,
                buttons: buttonCount,
                forms: formCount,
                links: linkCount
            };
            
            // Test 4: File Input Detailed Analysis
            if (fileInputCount > 0) {
                console.log('4️⃣ Testing file input functionality...');
                
                const firstFileInput = fileInput.first();
                const isVisible = await firstFileInput.isVisible();
                const isEnabled = await firstFileInput.isEnabled();
                const acceptAttr = await firstFileInput.getAttribute('accept');
                const nameAttr = await firstFileInput.getAttribute('name');
                
                console.log(`   Visible: ${isVisible ? '✅' : '❌'}`);
                console.log(`   Enabled: ${isEnabled ? '✅' : '❌'}`);
                console.log(`   Accept attribute: ${acceptAttr || 'any'}`);
                console.log(`   Name attribute: ${nameAttr || 'unnamed'}`);
                
                this.results.functionality.fileInput = {
                    visible: isVisible,
                    enabled: isEnabled,
                    accept: acceptAttr,
                    name: nameAttr
                };
                
                // Test file input interaction
                try {
                    await firstFileInput.hover();
                    console.log('   Hover interaction: ✅');
                    
                    await this.takeScreenshot(page, 'file-input-hover', 'File input on hover');
                } catch (error) {
                    console.log('   Hover interaction: ❌');
                }
            }
            
            // Test 5: Button Functionality
            if (buttonCount > 0) {
                console.log('5️⃣ Testing button functionality...');
                
                const buttons = page.locator('button');
                const buttonTexts = [];
                
                for (let i = 0; i < Math.min(buttonCount, 5); i++) {
                    const button = buttons.nth(i);
                    const text = await button.textContent();
                    const isVisible = await button.isVisible();
                    const isEnabled = await button.isEnabled();
                    
                    buttonTexts.push({
                        text: text?.trim() || `Button ${i + 1}`,
                        visible: isVisible,
                        enabled: isEnabled
                    });
                    
                    console.log(`   Button ${i + 1}: "${text?.trim()}" - ${isVisible ? 'Visible' : 'Hidden'}, ${isEnabled ? 'Enabled' : 'Disabled'}`);
                }
                
                this.results.functionality.buttons = buttonTexts;
            }
            
            // Test 6: Visual Design Analysis
            console.log('6️⃣ Analyzing visual design...');
            
            const bodyStyles = await page.evaluate(() => {
                const body = document.body;
                const styles = window.getComputedStyle(body);
                return {
                    backgroundColor: styles.backgroundColor,
                    fontFamily: styles.fontFamily,
                    fontSize: styles.fontSize
                };
            });
            
            console.log(`   Background: ${bodyStyles.backgroundColor}`);
            console.log(`   Font: ${bodyStyles.fontFamily}`);
            console.log(`   Font size: ${bodyStyles.fontSize}`);
            
            this.results.userExperience.design = bodyStyles;
            
            // Test 7: Responsive Design
            console.log('7️⃣ Testing responsive design...');
            
            const viewports = [
                { width: 1920, height: 1080, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ];
            
            for (const viewport of viewports) {
                await page.setViewportSize({ width: viewport.width, height: viewport.height });
                await page.waitForTimeout(500);
                
                const isFileInputVisible = fileInputCount > 0 ? await fileInput.first().isVisible() : false;
                
                console.log(`   ${viewport.name} (${viewport.width}x${viewport.height}): File input ${isFileInputVisible ? 'visible' : 'hidden'}`);
                
                await this.takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}`, `${viewport.name} viewport test`);
            }
            
            // Test 8: Performance Analysis
            console.log('8️⃣ Analyzing performance...');
            
            const performanceMetrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
                };
            });
            
            console.log(`   DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
            console.log(`   Load Complete: ${performanceMetrics.loadComplete}ms`);
            console.log(`   Total Load Time: ${performanceMetrics.totalLoadTime}ms`);
            
            this.results.userExperience.performance = performanceMetrics;
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            this.results.error = error.message;
        } finally {
            if (browser) await browser.close();
        }
        
        return this.results;
    }

    async generateReport() {
        console.log('\n📊 ANNOTATION SYSTEM TEST REPORT');
        console.log('==================================');
        
        const timestamp = new Date().toISOString();
        const reportData = {
            timestamp,
            testType: 'Focused Annotation System Test',
            baseUrl: this.baseUrl,
            results: this.results
        };
        
        // Save report
        const reportPath = `annotation-system-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        
        // Summary
        console.log(`📅 Test Date: ${new Date(timestamp).toLocaleString()}`);
        console.log(`🌐 Service URL: ${this.baseUrl}`);
        console.log(`📸 Screenshots: ${this.results.screenshots.length} captured`);
        console.log('');
        
        if (this.results.interface.loaded) {
            console.log('✅ INTERFACE STATUS: WORKING');
            console.log(`   Title: "${this.results.interface.title}"`);
            
            if (this.results.functionality.elements) {
                const elements = this.results.functionality.elements;
                console.log(`   File inputs: ${elements.fileInputs}`);
                console.log(`   Interactive buttons: ${elements.buttons}`);
            }
        } else {
            console.log('❌ INTERFACE STATUS: NOT WORKING');
        }
        
        console.log(`\n💾 Report saved: ${reportPath}`);
        
        return reportData;
    }

    async runTest() {
        await this.testAnnotationInterface();
        return await this.generateReport();
    }
}

async function main() {
    const test = new FocusedAnnotationSystemTest();
    await test.runTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { FocusedAnnotationSystemTest };
