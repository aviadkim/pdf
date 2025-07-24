/**
 * Playwright Mistral Test - Browser-based validation with logs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

console.log('🎭 PLAYWRIGHT MISTRAL INTEGRATION TEST');
console.log('====================================');

async function playwrightMistralTest() {
    let browser;
    
    try {
        // Launch browser
        console.log('🚀 Launching Playwright browser...');
        browser = await chromium.launch({ 
            headless: false, // Show browser for debugging
            slowMo: 1000     // Slow down for observation
        });
        
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // Enable console logging
        page.on('console', msg => console.log('🌐 Browser:', msg.text()));
        page.on('response', response => {
            if (response.url().includes('api/')) {
                console.log(`📡 API Response: ${response.status()} - ${response.url()}`);
            }
        });
        
        // Navigate to the Render site
        console.log('🌐 Navigating to Render deployment...');
        await page.goto('https://pdf-fzzi.onrender.com/', { waitUntil: 'networkidle' });
        
        // Check if site is live
        const title = await page.title();
        console.log('📄 Page title:', title);
        
        // Look for upload interface
        const hasUploadForm = await page.$('form') || await page.$('input[type="file"]');
        
        if (hasUploadForm) {
            console.log('✅ Upload interface detected');
            
            // Test file upload if interface exists
            await testFileUpload(page);
            
        } else {
            console.log('ℹ️ No upload interface - testing API directly');
        }
        
        // Test API endpoints directly via browser
        await testAPIEndpoints(page);
        
        // Check browser network logs for errors
        await checkNetworkLogs(page);
        
    } catch (error) {
        console.error('❌ Playwright test error:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function testFileUpload(page) {
    console.log('📄 Testing file upload interface...');
    
    try {
        // Look for file input
        const fileInput = await page.$('input[type="file"]');
        
        if (fileInput) {
            console.log('✅ File input found');
            
            // Upload test PDF
            const pdfPath = path.resolve('2. Messos  - 31.03.2025.pdf');
            await fileInput.setInputFiles(pdfPath);
            console.log('📤 PDF uploaded');
            
            // Look for submit button and click
            const submitButton = await page.$('button[type="submit"]') || 
                                 await page.$('input[type="submit"]') ||
                                 await page.$('button:has-text("Upload")') ||
                                 await page.$('button:has-text("Process")');
            
            if (submitButton) {
                console.log('🔄 Processing PDF...');
                
                // Wait for response
                const responsePromise = page.waitForResponse(
                    response => response.url().includes('/api/') && response.status() === 200,
                    { timeout: 60000 }
                );
                
                await submitButton.click();
                
                try {
                    const response = await responsePromise;
                    const result = await response.json();
                    
                    console.log('✅ Upload successful!');
                    console.log('📊 Accuracy:', result.accuracy + '%');
                    console.log('💰 Total:', '$' + (result.totalValue || 0).toLocaleString());
                    
                } catch (uploadError) {
                    console.log('⚠️ Upload timeout or error');
                }
            }
        } else {
            console.log('ℹ️ No file input found');
        }
        
    } catch (error) {
        console.log('❌ Upload test error:', error.message);
    }
}

async function testAPIEndpoints(page) {
    console.log('🔍 Testing API endpoints directly...');
    
    // Test endpoints via browser fetch
    const endpoints = [
        '/api/pdf-extract',
        '/api/mistral-supervised',
        '/api/bulletproof-processor'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🌐 Testing ${endpoint}...`);
            
            // Create a simple test request
            const result = await page.evaluate(async (url) => {
                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    return {
                        status: response.status,
                        statusText: response.statusText,
                        ok: response.ok
                    };
                } catch (error) {
                    return { error: error.message };
                }
            }, `https://pdf-fzzi.onrender.com${endpoint}`);
            
            console.log(`📡 ${endpoint}: HTTP ${result.status} ${result.statusText}`);
            
            if (result.status === 405) {
                console.log('ℹ️ Method not allowed (expected - needs POST with file)');
            } else if (result.status === 500) {
                console.log('⚠️ Server error - may indicate configuration issue');
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint} test failed:`, error.message);
        }
    }
}

async function checkNetworkLogs(page) {
    console.log('📊 Checking network activity...');
    
    // Navigate to a simple test page to check network
    await page.goto('https://pdf-fzzi.onrender.com/api/extraction-debug', { 
        waitUntil: 'networkidle',
        timeout: 30000 
    });
    
    const content = await page.content();
    console.log('🔍 Debug endpoint response length:', content.length);
    
    if (content.includes('YOLO_FIXES_ACTIVE')) {
        console.log('✅ YOLO fixes are active');
    }
    
    if (content.includes('MISTRAL')) {
        console.log('✅ Mistral configuration detected');
    }
    
    // Check for any JavaScript errors
    page.on('pageerror', error => {
        console.log('❌ Page error:', error.message);
    });
}

// Run Playwright test
playwrightMistralTest().then(() => {
    console.log('✅ Playwright test completed');
}).catch(error => {
    console.error('❌ Playwright test failed:', error);
});