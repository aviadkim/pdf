// Comprehensive Accuracy Test for Render Deployment
// Tests all extraction methods to identify accuracy issues

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Render Deployment Accuracy Analysis', () => {
  let results = {
    timestamp: new Date().toISOString(),
    url: 'https://pdf-fzzi.onrender.com',
    testResults: [],
    accuracyIssues: [],
    processingErrors: []
  };

  // Expected ground truth data
  const expectedData = {
    'XS2530201644': {
      name: 'TORONTO DOMINION BANK NOTES',
      quantity: 200000,
      price: 99.1991,
      value: 19839820
    },
    'XS2588105036': {
      name: 'CANADIAN IMPERIAL BANK NOTES',
      quantity: 200000,
      price: 99.6285,
      value: 19925700
    },
    'XS2665592833': {
      name: 'HARP ISSUER NOTES',
      quantity: 1500000,
      price: 98.3700,
      value: 147555000
    },
    'XS2567543397': {
      name: 'GOLDMAN SACHS CALLABLE NOTE',
      quantity: 2450000,
      price: 100.5200,
      value: 246274000
    }
  };

  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.processingErrors.push({
          type: 'console-error',
          message: msg.text(),
          time: new Date().toISOString()
        });
      }
    });

    // Set up network error logging
    page.on('pageerror', error => {
      results.processingErrors.push({
        type: 'page-error',
        message: error.message,
        stack: error.stack,
        time: new Date().toISOString()
      });
    });

    // Navigate to the site
    console.log('Navigating to https://pdf-fzzi.onrender.com...');
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'render-test-results/initial-page.png',
      fullPage: true 
    });
  });

  test('Test site accessibility and initial load', async ({ page }) => {
    console.log('Testing site accessibility...');
    
    // Check if page loads
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check for main UI elements
    const elements = {
      header: await page.locator('.header').count(),
      demoButton: await page.locator('#demoBtn').count(),
      testButton: await page.locator('#testBtn').count(),
      cards: await page.locator('.card').count()
    };
    
    console.log('UI Elements found:', elements);
    
    results.testResults.push({
      test: 'Site Accessibility',
      passed: elements.demoButton > 0,
      details: elements
    });
  });

  test('Demo extraction accuracy test', async ({ page }) => {
    console.log('Starting demo extraction test...');
    
    // Click demo button
    const demoBtn = page.locator('#demoBtn');
    await expect(demoBtn).toBeVisible({ timeout: 10000 });
    
    console.log('Clicking demo button...');
    await demoBtn.click();
    
    // Wait for processing with extended timeout
    try {
      await page.waitForSelector('.status.success, .status.error', { 
        timeout: 60000 
      });
      
      // Take screenshot after processing
      await page.screenshot({ 
        path: 'render-test-results/demo-results.png',
        fullPage: true 
      });
      
      // Check if results are displayed
      const resultsVisible = await page.locator('#resultsSection').isVisible();
      console.log(`Results section visible: ${resultsVisible}`);
      
      if (resultsVisible) {
        // Extract accuracy percentage
        const accuracyText = await page.locator('#accuracy').textContent();
        const accuracy = parseFloat(accuracyText.replace('%', ''));
        console.log(`Reported accuracy: ${accuracy}%`);
        
        // Extract securities data
        const securities = await page.evaluate(() => {
          const items = [];
          document.querySelectorAll('.security-item').forEach(item => {
            const cells = item.querySelectorAll('div');
            if (cells.length >= 4) {
              items.push({
                isin: cells[0].textContent.trim(),
                quantity: cells[1].textContent.trim(),
                price: cells[2].textContent.trim(),
                value: cells[3].textContent.trim()
              });
            }
          });
          return items;
        });
        
        console.log(`Found ${securities.length} securities`);
        
        // Analyze each security
        let correctCount = 0;
        for (const security of securities) {
          const expected = expectedData[security.isin];
          if (expected) {
            const extracted = {
              quantity: parseFloat(security.quantity.replace(/,/g, '')),
              price: parseFloat(security.price.replace('$', '')),
              value: parseFloat(security.value.replace(/[$,]/g, ''))
            };
            
            const quantityMatch = Math.abs(extracted.quantity - expected.quantity) < 1;
            const priceMatch = Math.abs(extracted.price - expected.price) < 0.01;
            const valueMatch = Math.abs(extracted.value - expected.value) < 100;
            
            if (quantityMatch && priceMatch && valueMatch) {
              correctCount++;
            } else {
              results.accuracyIssues.push({
                isin: security.isin,
                field: !quantityMatch ? 'quantity' : !priceMatch ? 'price' : 'value',
                expected: expected,
                extracted: extracted,
                test: 'demo'
              });
            }
          }
        }
        
        const calculatedAccuracy = (correctCount / Object.keys(expectedData).length) * 100;
        
        results.testResults.push({
          test: 'Demo Extraction',
          passed: calculatedAccuracy >= 99.5,
          reportedAccuracy: accuracy,
          calculatedAccuracy: calculatedAccuracy,
          correctCount: correctCount,
          totalExpected: Object.keys(expectedData).length,
          securities: securities
        });
      }
    } catch (error) {
      console.error('Demo extraction error:', error);
      results.processingErrors.push({
        type: 'demo-extraction',
        error: error.message,
        time: new Date().toISOString()
      });
    }
  });

  test('Test accuracy validation suite', async ({ page }) => {
    console.log('Running accuracy test suite...');
    
    // Click test button
    const testBtn = page.locator('#testBtn');
    await expect(testBtn).toBeVisible({ timeout: 10000 });
    
    console.log('Clicking test button...');
    await testBtn.click();
    
    // Wait for test completion
    try {
      await page.waitForSelector('.status.success, .status.error', { 
        timeout: 60000 
      });
      
      // Take screenshot
      await page.screenshot({ 
        path: 'render-test-results/test-results.png',
        fullPage: true 
      });
      
      // Extract test results from window object
      const testResults = await page.evaluate(() => window.testResults);
      
      if (testResults) {
        console.log('Test results:', testResults);
        
        results.testResults.push({
          test: 'Accuracy Test Suite',
          passed: testResults.passed === testResults.total,
          testResults: testResults,
          accuracy: testResults.accuracy
        });
        
        // Analyze individual test failures
        if (testResults.failures && testResults.failures.length > 0) {
          for (const failure of testResults.failures) {
            results.accuracyIssues.push({
              test: 'accuracy-suite',
              failure: failure
            });
          }
        }
      }
    } catch (error) {
      console.error('Test suite error:', error);
      results.processingErrors.push({
        type: 'test-suite',
        error: error.message,
        time: new Date().toISOString()
      });
    }
  });

  test('Network request analysis', async ({ page }) => {
    console.log('Analyzing network requests...');
    
    const requests = [];
    const responses = [];
    
    // Monitor network activity
    page.on('request', request => {
      if (request.url().includes('api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // Trigger demo extraction
    await page.locator('#demoBtn').click();
    await page.waitForTimeout(10000); // Wait for processing
    
    results.testResults.push({
      test: 'Network Analysis',
      requests: requests,
      responses: responses,
      apiErrors: responses.filter(r => r.status >= 400)
    });
  });

  test.afterAll(async () => {
    // Save detailed results
    const resultsPath = path.join('render-test-results', 'accuracy-analysis.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log('\n=== ACCURACY ANALYSIS SUMMARY ===');
    console.log(`Total tests: ${results.testResults.length}`);
    console.log(`Accuracy issues found: ${results.accuracyIssues.length}`);
    console.log(`Processing errors: ${results.processingErrors.length}`);
    
    if (results.accuracyIssues.length > 0) {
      console.log('\nAccuracy Issues:');
      results.accuracyIssues.forEach(issue => {
        console.log(`- ${issue.isin || 'N/A'}: ${issue.field || issue.failure}`);
      });
    }
    
    if (results.processingErrors.length > 0) {
      console.log('\nProcessing Errors:');
      results.processingErrors.forEach(error => {
        console.log(`- ${error.type}: ${error.error || error.message}`);
      });
    }
    
    console.log(`\nDetailed results saved to: ${resultsPath}`);
  });
});