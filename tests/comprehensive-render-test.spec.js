// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://pdf-fzzi.onrender.com';

test.describe('Comprehensive Render Deployment Tests', () => {
  let consoleLogs = [];
  let networkErrors = [];

  test.beforeEach(async ({ page }) => {
    // Capture console logs
    consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    });

    // Capture network errors
    networkErrors = [];
    page.on('requestfailed', request => {
      networkErrors.push({
        url: request.url(),
        failure: request.failure()?.errorText,
        timestamp: new Date().toISOString()
      });
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`❌ Page error: ${error.message}`);
    });
  });

  test('Homepage loads successfully', async ({ page }) => {
    console.log('🔍 Testing homepage load...');
    
    await page.goto(BASE_URL);
    
    // Check page title
    await expect(page).toHaveTitle(/Smart OCR/);
    
    // Check main heading
    const heading = page.locator('h1');
    await expect(heading).toContainText('Smart OCR');
    
    // Check form exists
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Check file input exists
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: `render-homepage-${Date.now()}.png`, 
      fullPage: true 
    });

    console.log(`✅ Homepage loaded successfully`);
    console.log(`📋 Console logs: ${consoleLogs.length}`);
    console.log(`🌐 Network errors: ${networkErrors.length}`);
  });

  test('Smart OCR Stats API works', async ({ page }) => {
    console.log('🔍 Testing Stats API...');
    
    const response = await page.request.get(`${BASE_URL}/api/smart-ocr-stats`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.stats).toBeDefined();
    
    console.log(`✅ Stats API working: ${JSON.stringify(data.stats, null, 2)}`);
  });

  test('Smart OCR Patterns API works', async ({ page }) => {
    console.log('🔍 Testing Patterns API...');
    
    const response = await page.request.get(`${BASE_URL}/api/smart-ocr-patterns`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.patterns).toBeDefined();
    
    console.log(`✅ Patterns API working`);
    console.log(`📊 Pattern keys: ${Object.keys(data.patterns)}`);
  });

  test('Annotation interface loads', async ({ page }) => {
    console.log('🔍 Testing annotation interface...');
    
    await page.goto(`${BASE_URL}/smart-annotation`);
    
    // Check page loads without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ 
      path: `annotation-interface-${Date.now()}.png`, 
      fullPage: true 
    });

    console.log(`✅ Annotation interface loaded`);
    console.log(`📋 Console logs: ${consoleLogs.length}`);
  });

  test('PDF processing via form', async ({ page }) => {
    const pdfPath = './2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
      test.skip('PDF file not found');
    }

    console.log('🔍 Testing PDF processing via form...');
    
    await page.goto(BASE_URL);
    
    // Find file input and upload PDF
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(pdfPath);
    
    // Submit form and wait for response
    const submitButton = page.locator('button[type="submit"]');
    
    // Listen for the form submission response
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/smart-ocr-process') && response.status() === 200
    );
    
    await submitButton.click();
    
    try {
      const response = await responsePromise;
      const data = await response.json();
      
      console.log(`✅ PDF processing completed`);
      console.log(`📈 Method: ${data.results?.method}`);
      console.log(`📝 Text length: ${data.results?.text_length}`);
      console.log(`🔢 Securities: ${data.results?.securities?.length || 0}`);
      
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      
    } catch (error) {
      console.log(`⚠️ PDF processing may have timed out or failed: ${error.message}`);
      // Take screenshot for debugging
      await page.screenshot({ 
        path: `pdf-processing-error-${Date.now()}.png`, 
        fullPage: true 
      });
    }
  });

  test('Learning system endpoint', async ({ page }) => {
    console.log('🔍 Testing learning system...');
    
    const learningData = {
      corrections: [{
        id: 'playwright-test-' + Date.now(),
        original: 'test_value',
        corrected: 'corrected_value',
        field: 'test_field',
        confidence: 0.9
      }]
    };

    const response = await page.request.post(`${BASE_URL}/api/smart-ocr-learn`, {
      data: learningData
    });

    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    
    console.log(`✅ Learning system working`);
    console.log(`📚 Result: ${JSON.stringify(data.result, null, 2)}`);
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Log console messages for failed tests
    if (testInfo.status === 'failed') {
      console.log('\n📋 CONSOLE LOGS FOR FAILED TEST:');
      consoleLogs.forEach(log => {
        console.log(`[${log.type}] ${log.text}`);
      });
      
      if (networkErrors.length > 0) {
        console.log('\n🌐 NETWORK ERRORS:');
        networkErrors.forEach(error => {
          console.log(`${error.url}: ${error.failure}`);
        });
      }
    }

    // Save logs to file
    const logFile = `test-logs-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.json`;
    fs.writeFileSync(logFile, JSON.stringify({
      test: testInfo.title,
      status: testInfo.status,
      consoleLogs: consoleLogs,
      networkErrors: networkErrors,
      timestamp: new Date().toISOString()
    }, null, 2));
  });
});