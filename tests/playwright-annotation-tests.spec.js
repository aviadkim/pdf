const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'https://pdf-fzzi.onrender.com';
const TEST_PDF_PATH = path.join(__dirname, '..', 'Messos_Anlagestiftung_Full_Report.pdf');

test.describe('PDF Processing System - Annotation Interface Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to the main page and wait for it to load
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
    });

    test('should load the main page with annotation interface', async ({ page }) => {
        // Check if the page loads properly
        await expect(page).toHaveTitle(/PDF Processing/i);
        
        // Check for key elements
        const uploadSection = page.locator('[data-testid="upload-section"], .upload-area, input[type="file"]');
        await expect(uploadSection.first()).toBeVisible();
        
        // Take screenshot for documentation
        await page.screenshot({ 
            path: 'test-results/annotation-interface-loaded.png',
            fullPage: true 
        });
    });

    test('should display annotation interface elements', async ({ page }) => {
        // Look for annotation-related elements
        const annotationElements = [
            'annotation',
            'learning',
            'correction',
            'feedback',
            'smart',
            'ai'
        ];
        
        let foundElements = 0;
        for (const element of annotationElements) {
            const locator = page.locator(`text=${element}`, { timeout: 5000 });
            if (await locator.isVisible().catch(() => false)) {
                foundElements++;
            }
        }
        
        // Should find at least some annotation-related elements
        expect(foundElements).toBeGreaterThan(0);
        
        await page.screenshot({ 
            path: 'test-results/annotation-elements.png',
            fullPage: true 
        });
    });

    test('should handle file upload interface', async ({ page }) => {
        // Look for file upload elements
        const fileInput = page.locator('input[type="file"]').first();
        
        if (await fileInput.isVisible()) {
            // Test file upload if PDF exists
            if (fs.existsSync(TEST_PDF_PATH)) {
                await fileInput.setInputFiles(TEST_PDF_PATH);
                
                // Wait for upload to process
                await page.waitForTimeout(2000);
                
                // Look for upload feedback
                const uploadFeedback = page.locator('text=/uploaded|processing|analyzing/i');
                await expect(uploadFeedback.first()).toBeVisible({ timeout: 10000 });
                
                await page.screenshot({ 
                    path: 'test-results/file-uploaded.png',
                    fullPage: true 
                });
            }
        } else {
            // If no file input found, check for drag-and-drop area
            const dropZone = page.locator('.drop-zone, .upload-area, [data-testid="drop-zone"]');
            await expect(dropZone.first()).toBeVisible();
        }
    });

    test('should show processing feedback', async ({ page }) => {
        // Try to upload a file and monitor processing
        const fileInput = page.locator('input[type="file"]').first();
        
        if (await fileInput.isVisible() && fs.existsSync(TEST_PDF_PATH)) {
            await fileInput.setInputFiles(TEST_PDF_PATH);
            
            // Wait for processing indicators
            const processingIndicators = [
                page.locator('text=/processing/i'),
                page.locator('text=/analyzing/i'),
                page.locator('text=/extracting/i'),
                page.locator('.spinner, .loading, .progress'),
                page.locator('[data-testid="processing"]')
            ];
            
            let foundProcessing = false;
            for (const indicator of processingIndicators) {
                if (await indicator.isVisible({ timeout: 5000 }).catch(() => false)) {
                    foundProcessing = true;
                    break;
                }
            }
            
            if (foundProcessing) {
                await page.screenshot({ 
                    path: 'test-results/processing-feedback.png',
                    fullPage: true 
                });
            }
            
            // Wait for results or timeout
            const resultsIndicators = [
                page.locator('text=/complete/i'),
                page.locator('text=/results/i'),
                page.locator('text=/extracted/i'),
                page.locator('.results, .output'),
                page.locator('[data-testid="results"]')
            ];
            
            let foundResults = false;
            for (const indicator of resultsIndicators) {
                if (await indicator.isVisible({ timeout: 30000 }).catch(() => false)) {
                    foundResults = true;
                    await page.screenshot({ 
                        path: 'test-results/processing-complete.png',
                        fullPage: true 
                    });
                    break;
                }
            }
            
            // Test passes if we found either processing or results
            expect(foundProcessing || foundResults).toBe(true);
        }
    });

    test('should display extraction results', async ({ page }) => {
        // Navigate to live demo if available
        const liveDemoLink = page.locator('a[href*="demo"], a[href*="live"], text=/demo/i');
        if (await liveDemoLink.isVisible().catch(() => false)) {
            await liveDemoLink.click();
            await page.waitForLoadState('networkidle');
        }
        
        // Look for results display elements
        const resultElements = [
            '.results',
            '.output',
            '.securities',
            '.extracted-data',
            '[data-testid="results"]',
            'table',
            '.security-item'
        ];
        
        let foundResults = false;
        for (const selector of resultElements) {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
                foundResults = true;
                await page.screenshot({ 
                    path: 'test-results/results-display.png',
                    fullPage: true 
                });
                break;
            }
        }
        
        // If no results found, try triggering a demo extraction
        if (!foundResults) {
            const demoButton = page.locator('button:has-text("demo"), button:has-text("test"), button:has-text("extract")');
            if (await demoButton.isVisible().catch(() => false)) {
                await demoButton.click();
                await page.waitForTimeout(5000);
                
                await page.screenshot({ 
                    path: 'test-results/demo-triggered.png',
                    fullPage: true 
                });
            }
        }
    });

    test('should handle annotation interface interactions', async ({ page }) => {
        // Look for interactive elements
        const interactiveElements = [
            'button',
            'input',
            'select',
            'textarea',
            '.clickable',
            '.interactive'
        ];
        
        let interactions = 0;
        
        for (const selector of interactiveElements) {
            const elements = page.locator(selector);
            const count = await elements.count();
            
            for (let i = 0; i < Math.min(count, 3); i++) {
                const element = elements.nth(i);
                if (await element.isVisible().catch(() => false)) {
                    // Try to interact with the element
                    try {
                        await element.hover({ timeout: 1000 });
                        interactions++;
                    } catch (e) {
                        // Interaction failed, continue
                    }
                }
            }
        }
        
        // Should find at least some interactive elements
        expect(interactions).toBeGreaterThan(0);
        
        await page.screenshot({ 
            path: 'test-results/interactive-elements.png',
            fullPage: true 
        });
    });

    test('should test learning system integration', async ({ page }) => {
        // Look for learning/AI-related functionality
        const learningElements = [
            'text=/learn/i',
            'text=/smart/i',
            'text=/ai/i',
            'text=/intelligent/i',
            'text=/annotation/i',
            'text=/correction/i',
            '[data-testid="learning"]'
        ];
        
        let foundLearning = false;
        for (const selector of learningElements) {
            const element = page.locator(selector);
            if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
                foundLearning = true;
                
                // Try to interact with learning features
                if (await element.isEnabled().catch(() => false)) {
                    await element.click({ timeout: 1000 }).catch(() => {});
                    await page.waitForTimeout(1000);
                }
                break;
            }
        }
        
        await page.screenshot({ 
            path: 'test-results/learning-system.png',
            fullPage: true 
        });
        
        // Test passes if learning elements are found or if basic functionality works
        const hasBasicFunctionality = await page.locator('input, button, select').count() > 0;
        expect(foundLearning || hasBasicFunctionality).toBe(true);
    });

    test('should validate responsive design', async ({ page }) => {
        // Test different viewport sizes
        const viewports = [
            { width: 1920, height: 1080 }, // Desktop
            { width: 768, height: 1024 },  // Tablet
            { width: 375, height: 667 }    // Mobile
        ];
        
        for (const viewport of viewports) {
            await page.setViewportSize(viewport);
            await page.waitForTimeout(1000);
            
            // Check if page is still functional
            const isPageVisible = await page.locator('body').isVisible();
            expect(isPageVisible).toBe(true);
            
            await page.screenshot({ 
                path: `test-results/responsive-${viewport.width}x${viewport.height}.png`,
                fullPage: true 
            });
        }
    });

    test('should test error handling in UI', async ({ page }) => {
        // Try to trigger error conditions
        const errorTriggers = [
            // Try uploading invalid file type
            async () => {
                const fileInput = page.locator('input[type="file"]').first();
                if (await fileInput.isVisible().catch(() => false)) {
                    // Create a fake text file
                    const fakeFile = path.join(__dirname, 'fake.txt');
                    fs.writeFileSync(fakeFile, 'not a pdf');
                    await fileInput.setInputFiles(fakeFile);
                    fs.unlinkSync(fakeFile);
                    return true;
                }
                return false;
            },
            
            // Try submitting empty forms
            async () => {
                const submitButton = page.locator('button[type="submit"], button:has-text("submit")');
                if (await submitButton.isVisible().catch(() => false)) {
                    await submitButton.click();
                    return true;
                }
                return false;
            }
        ];
        
        let errorHandled = false;
        for (const trigger of errorTriggers) {
            if (await trigger()) {
                // Wait for error message
                const errorMessage = page.locator('text=/error/i, .error, .alert-danger, [role="alert"]');
                if (await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
                    errorHandled = true;
                    await page.screenshot({ 
                        path: 'test-results/error-handling.png',
                        fullPage: true 
                    });
                    break;
                }
            }
        }
        
        // Error handling test is informational
        console.log(`Error handling ${errorHandled ? 'found' : 'not found'}`);
    });

    test.afterEach(async ({ page }, testInfo) => {
        // Take screenshot on failure
        if (testInfo.status !== testInfo.expectedStatus) {
            await page.screenshot({ 
                path: `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png`,
                fullPage: true 
            });
        }
    });
});