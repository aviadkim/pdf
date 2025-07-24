const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Configuration
const BASE_URL = 'https://pdf-fzzi.onrender.com';
const TIMEOUT = 30000;
const SCREENSHOT_DIR = path.join(__dirname, 'smart-ocr-test-screenshots');

// Test data
const testPDFPath = path.join(__dirname, 'test_input.pdf');

// Utility functions
async function ensureScreenshotDir() {
    try {
        await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create screenshot directory:', error);
    }
}

async function takeScreenshot(page, name) {
    try {
        const screenshotPath = path.join(SCREENSHOT_DIR, `${name}-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);
        return screenshotPath;
    } catch (error) {
        console.error(`Failed to take screenshot ${name}:`, error);
        return null;
    }
}

// Test suite
async function runSmartOCRTests() {
    console.log('🚀 Starting Smart OCR Puppeteer Tests');
    console.log(`Testing URL: ${BASE_URL}`);
    
    await ensureScreenshotDir();
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
    };
    
    try {
        // Test 1: Homepage UI and Navigation
        console.log('\n📋 Test 1: Homepage UI and Navigation');
        const homepageTest = await testHomepage(browser);
        results.tests.push(homepageTest);
        results.total++;
        if (homepageTest.passed) results.passed++;
        else results.failed++;
        
        // Test 2: Annotation Interface
        console.log('\n📋 Test 2: Annotation Interface');
        const annotationTest = await testAnnotationInterface(browser);
        results.tests.push(annotationTest);
        results.total++;
        if (annotationTest.passed) results.passed++;
        else results.failed++;
        
        // Test 3: API Endpoints
        console.log('\n📋 Test 3: API Endpoints');
        const apiTest = await testAPIEndpoints(browser);
        results.tests.push(apiTest);
        results.total++;
        if (apiTest.passed) results.passed++;
        else results.failed++;
        
        // Test 4: Form Submissions
        console.log('\n📋 Test 4: Form Submissions and Interactions');
        const formTest = await testFormSubmissions(browser);
        results.tests.push(formTest);
        results.total++;
        if (formTest.passed) results.passed++;
        else results.failed++;
        
        // Test 5: Learning System Stats
        console.log('\n📋 Test 5: Learning System Stats');
        const statsTest = await testLearningSystemStats(browser);
        results.tests.push(statsTest);
        results.total++;
        if (statsTest.passed) results.passed++;
        else results.failed++;
        
    } catch (error) {
        console.error('Test suite error:', error);
    } finally {
        await browser.close();
    }
    
    // Print results
    console.log('\n📊 Test Results Summary');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(2)}%`);
    
    // Save results
    const resultsPath = path.join(__dirname, 'smart-ocr-test-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to: ${resultsPath}`);
    
    return results;
}

// Test functions
async function testHomepage(browser) {
    const page = await browser.newPage();
    const test = {
        name: 'Homepage UI and Navigation',
        passed: true,
        details: [],
        screenshots: []
    };
    
    try {
        // Navigate to homepage
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        // Check title
        const title = await page.title();
        if (title.includes('Smart OCR Learning System')) {
            test.details.push('✅ Correct title found');
        } else {
            test.passed = false;
            test.details.push(`❌ Unexpected title: ${title}`);
        }
        
        // Check main heading
        const heading = await page.$eval('h1', el => el.textContent).catch(() => null);
        if (heading && heading.includes('Smart OCR Learning System')) {
            test.details.push('✅ Main heading found');
        } else {
            test.passed = false;
            test.details.push('❌ Main heading not found');
        }
        
        // Check navigation links
        const navLinks = await page.$$eval('nav a, .nav a, a[href="/smart-annotation"]', links => 
            links.map(link => ({ text: link.textContent, href: link.href }))
        );
        
        if (navLinks.length > 0) {
            test.details.push(`✅ Found ${navLinks.length} navigation links`);
            navLinks.forEach(link => {
                test.details.push(`  - ${link.text}: ${link.href}`);
            });
        } else {
            test.details.push('⚠️ No navigation links found');
        }
        
        // Check for upload form
        const uploadForm = await page.$('input[type="file"]');
        if (uploadForm) {
            test.details.push('✅ File upload input found');
        } else {
            test.passed = false;
            test.details.push('❌ File upload input not found');
        }
        
        // Take screenshot
        const screenshot = await takeScreenshot(page, 'homepage');
        if (screenshot) test.screenshots.push(screenshot);
        
    } catch (error) {
        test.passed = false;
        test.details.push(`❌ Error: ${error.message}`);
    } finally {
        await page.close();
    }
    
    return test;
}

async function testAnnotationInterface(browser) {
    const page = await browser.newPage();
    const test = {
        name: 'Annotation Interface',
        passed: true,
        details: [],
        screenshots: []
    };
    
    try {
        // Navigate to annotation interface
        await page.goto(`${BASE_URL}/smart-annotation`, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        // Check if page loaded
        const pageTitle = await page.$eval('h1, h2', el => el.textContent).catch(() => null);
        if (pageTitle) {
            test.details.push(`✅ Annotation page loaded: ${pageTitle}`);
        } else {
            test.passed = false;
            test.details.push('❌ Annotation page title not found');
        }
        
        // Check for annotation form elements
        const elements = {
            'Pattern input': await page.$('input[name="pattern"], input[placeholder*="pattern"]'),
            'Value input': await page.$('input[name="value"], input[placeholder*="value"]'),
            'Submit button': await page.$('button[type="submit"]')
        };
        
        // Check for buttons with text (using evaluate instead of invalid selector)
        const submitButton = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => 
                btn.textContent.includes('Add') || 
                btn.textContent.includes('Submit') ||
                btn.textContent.includes('Learn')
            ) !== undefined;
        });
        
        if (submitButton) {
            elements['Submit button (text)'] = true;
        }
        
        for (const [name, element] of Object.entries(elements)) {
            if (element) {
                test.details.push(`✅ ${name} found`);
            } else {
                test.details.push(`⚠️ ${name} not found`);
            }
        }
        
        // Check for existing annotations
        const annotations = await page.$$eval('.annotation, .pattern, tr', els => els.length).catch(() => 0);
        test.details.push(`📊 Found ${annotations} annotation elements`);
        
        // Take screenshot
        const screenshot = await takeScreenshot(page, 'annotation-interface');
        if (screenshot) test.screenshots.push(screenshot);
        
    } catch (error) {
        test.passed = false;
        test.details.push(`❌ Error: ${error.message}`);
    } finally {
        await page.close();
    }
    
    return test;
}

async function testAPIEndpoints(browser) {
    const page = await browser.newPage();
    const test = {
        name: 'API Endpoints',
        passed: true,
        details: [],
        screenshots: []
    };
    
    const endpoints = [
        { url: '/api/smart-ocr-stats', name: 'Stats API' },
        { url: '/api/smart-ocr-patterns', name: 'Patterns API' },
        { url: '/api/smart-ocr-learn', name: 'Learn API', method: 'POST' }
    ];
    
    try {
        for (const endpoint of endpoints) {
            try {
                if (endpoint.method === 'POST') {
                    // Test POST endpoint with sample data
                    const response = await page.evaluate(async (url) => {
                        try {
                            const res = await fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    pattern: 'test-pattern',
                                    value: 'test-value',
                                    confidence: 0.9
                                })
                            });
                            return {
                                status: res.status,
                                ok: res.ok,
                                data: await res.json().catch(() => null)
                            };
                        } catch (err) {
                            return { error: err.message };
                        }
                    }, BASE_URL + endpoint.url);
                    
                    if (response.ok || response.status === 200) {
                        test.details.push(`✅ ${endpoint.name}: Status ${response.status}`);
                    } else {
                        test.details.push(`⚠️ ${endpoint.name}: Status ${response.status}`);
                    }
                } else {
                    // Test GET endpoint
                    const response = await page.goto(BASE_URL + endpoint.url, { waitUntil: 'networkidle2' });
                    const status = response.status();
                    
                    if (status === 200) {
                        const data = await page.evaluate(() => {
                            try {
                                return JSON.parse(document.body.textContent);
                            } catch {
                                return null;
                            }
                        });
                        
                        test.details.push(`✅ ${endpoint.name}: Status ${status}`);
                        if (data) {
                            if (data.accuracy !== undefined) {
                                test.details.push(`  - Accuracy: ${data.accuracy}%`);
                            }
                            if (data.patterns !== undefined) {
                                test.details.push(`  - Patterns: ${data.patterns}`);
                            }
                            if (data.annotations !== undefined) {
                                test.details.push(`  - Annotations: ${data.annotations}`);
                            }
                        }
                    } else {
                        test.passed = false;
                        test.details.push(`❌ ${endpoint.name}: Status ${status}`);
                    }
                }
            } catch (error) {
                test.details.push(`❌ ${endpoint.name}: ${error.message}`);
            }
        }
    } catch (error) {
        test.passed = false;
        test.details.push(`❌ Error: ${error.message}`);
    } finally {
        await page.close();
    }
    
    return test;
}

async function testFormSubmissions(browser) {
    const page = await browser.newPage();
    const test = {
        name: 'Form Submissions and Interactions',
        passed: true,
        details: [],
        screenshots: []
    };
    
    try {
        // Test homepage form submission
        await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: TIMEOUT });
        
        // Check for process button
        const processButton = await page.$('button[type="submit"]');
        const processButtonByText = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.find(btn => 
                btn.textContent.includes('Process') || 
                btn.textContent.includes('Extract') ||
                btn.textContent.includes('Upload')
            );
        });
        
        if (processButton || processButtonByText) {
            test.details.push('✅ Process button found');
            
            // Test button is clickable
            const buttonToTest = processButton || processButtonByText;
            if (buttonToTest) {
                const isDisabled = await page.evaluate(btn => btn.disabled, buttonToTest);
                if (!isDisabled) {
                    test.details.push('✅ Process button is enabled');
                } else {
                    test.details.push('⚠️ Process button is disabled (needs file upload)');
                }
            }
        } else {
            test.details.push('❌ Process button not found');
        }
        
        // Test dropdown/select elements
        const selects = await page.$$('select');
        test.details.push(`📊 Found ${selects.length} dropdown menus`);
        
        for (let i = 0; i < selects.length; i++) {
            const options = await selects[i].$$eval('option', opts => 
                opts.map(opt => ({ value: opt.value, text: opt.textContent }))
            );
            test.details.push(`  - Dropdown ${i + 1}: ${options.length} options`);
            if (options.length > 0) {
                test.details.push(`    Options: ${options.map(o => o.text).join(', ')}`);
            }
        }
        
        // Test interactive elements
        const buttons = await page.$$eval('button', btns => btns.length);
        const inputs = await page.$$eval('input', inps => inps.length);
        test.details.push(`📊 Interactive elements: ${buttons} buttons, ${inputs} inputs`);
        
        // Take screenshot
        const screenshot = await takeScreenshot(page, 'form-interactions');
        if (screenshot) test.screenshots.push(screenshot);
        
    } catch (error) {
        test.passed = false;
        test.details.push(`❌ Error: ${error.message}`);
    } finally {
        await page.close();
    }
    
    return test;
}

async function testLearningSystemStats(browser) {
    const page = await browser.newPage();
    const test = {
        name: 'Learning System Stats',
        passed: true,
        details: [],
        screenshots: []
    };
    
    try {
        // Get stats from API
        await page.goto(`${BASE_URL}/api/smart-ocr-stats`, { waitUntil: 'networkidle2' });
        const stats = await page.evaluate(() => {
            try {
                return JSON.parse(document.body.textContent);
            } catch {
                return null;
            }
        });
        
        if (stats) {
            test.details.push('✅ Stats API returned data');
            
            // Validate expected stats
            if (stats.accuracy !== undefined) {
                test.details.push(`📊 Accuracy: ${stats.accuracy}%`);
                if (stats.accuracy >= 80) {
                    test.details.push('✅ Accuracy is at expected 80% or higher');
                } else {
                    test.details.push(`⚠️ Accuracy below expected 80%`);
                }
            }
            
            if (stats.patterns !== undefined) {
                test.details.push(`📊 Patterns: ${stats.patterns}`);
                if (stats.patterns >= 16) {
                    test.details.push('✅ Has expected 16+ patterns');
                } else {
                    test.details.push(`⚠️ Less than expected 16 patterns`);
                }
            }
            
            if (stats.annotations !== undefined) {
                test.details.push(`📊 Annotations: ${stats.annotations}`);
                if (stats.annotations >= 22) {
                    test.details.push('✅ Has expected 22+ annotations');
                } else {
                    test.details.push(`⚠️ Less than expected 22 annotations`);
                }
            }
            
            if (stats.lastTrained) {
                test.details.push(`📅 Last trained: ${stats.lastTrained}`);
            }
            
            if (stats.mistralEnabled !== undefined) {
                test.details.push(`🤖 Mistral enabled: ${stats.mistralEnabled}`);
            }
        } else {
            test.passed = false;
            test.details.push('❌ Failed to get stats data');
        }
        
        // Test patterns endpoint
        await page.goto(`${BASE_URL}/api/smart-ocr-patterns`, { waitUntil: 'networkidle2' });
        const patterns = await page.evaluate(() => {
            try {
                return JSON.parse(document.body.textContent);
            } catch {
                return null;
            }
        });
        
        if (patterns && Array.isArray(patterns)) {
            test.details.push(`✅ Patterns API returned ${patterns.length} patterns`);
            if (patterns.length > 0) {
                test.details.push('📋 Sample patterns:');
                patterns.slice(0, 3).forEach(p => {
                    test.details.push(`  - ${p.pattern || p.key}: ${p.confidence || 'N/A'}`);
                });
            }
        } else {
            test.details.push('⚠️ No patterns data returned');
        }
        
    } catch (error) {
        test.passed = false;
        test.details.push(`❌ Error: ${error.message}`);
    } finally {
        await page.close();
    }
    
    return test;
}

// Run tests if called directly
if (require.main === module) {
    runSmartOCRTests().then(results => {
        process.exit(results.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runSmartOCRTests };