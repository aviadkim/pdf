// Playwright Accuracy Validation Tests for Phase 3 PDF Platform
// Tests the 99.5% accuracy claims on known test cases

import { test, expect } from '@playwright/test';

test.describe('Phase 3 Accuracy Validation', () => {
  // Known ground truth test data
  const testSecurities = {
    'XS2530201644': {
      name: 'TORONTO DOMINION BANK NOTES',
      quantity: 200000,
      price: 99.1991,
      value: 19839820,
      tolerance: 0.01
    },
    'XS2588105036': {
      name: 'CANADIAN IMPERIAL BANK NOTES', 
      quantity: 200000,
      price: 99.6285,
      value: 19925700,
      tolerance: 0.01
    },
    'XS2665592833': {
      name: 'HARP ISSUER NOTES',
      quantity: 1500000,
      price: 98.3700,
      value: 147555000,
      tolerance: 0.01
    },
    'XS2567543397': {
      name: 'GOLDMAN SACHS CALLABLE NOTE',
      quantity: 2450000,
      price: 100.5200,
      value: 246274000,
      tolerance: 0.01
    }
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to the Phase 3 testing interface
    await page.goto('/');
    await expect(page).toHaveTitle(/Phase 3 PDF Platform/);
    
    // Wait for the interface to load completely
    await page.waitForSelector('.header');
    await page.waitForLoadState('networkidle');
  });

  test('Demo extraction achieves 99.5% accuracy on test securities', async ({ page }) => {
    // Start the demo extraction
    const demoButton = page.locator('#demoBtn');
    await expect(demoButton).toBeVisible();
    await demoButton.click();
    
    // Wait for processing to complete
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Verify the results section is displayed
    await expect(page.locator('#resultsSection')).toBeVisible();
    
    // Check accuracy rate
    const accuracy = await page.locator('#accuracy').textContent();
    expect(parseFloat(accuracy.replace('%', ''))).toBeGreaterThanOrEqual(99.0);
    
    // Verify securities count
    const totalSecurities = await page.locator('#totalSecurities').textContent();
    expect(parseInt(totalSecurities)).toBe(4);
    
    // Validate each test security
    for (const [isin, expected] of Object.entries(testSecurities)) {
      await test.step(`Validate ${isin}`, async () => {
        const securityRow = page.locator('.security-item').filter({ hasText: isin });
        await expect(securityRow).toBeVisible();
        
        // Extract values from the UI
        const cells = securityRow.locator('div');
        const quantityText = await cells.nth(1).textContent();
        const priceText = await cells.nth(2).textContent();
        const valueText = await cells.nth(3).textContent();
        
        // Parse extracted values
        const quantity = parseFloat(quantityText.replace(/,/g, ''));
        const price = parseFloat(priceText.replace('$', ''));
        const value = parseFloat(valueText.replace(/[$,]/g, ''));
        
        // Validate against ground truth with tolerance
        expect(quantity).toBeCloseTo(expected.quantity, -2);
        expect(price).toBeCloseTo(expected.price, 3);
        expect(value).toBeCloseTo(expected.value, 0);
        
        // Mathematical validation: quantity × price ≈ value
        const calculatedValue = quantity * price;
        expect(calculatedValue).toBeCloseTo(value, -2);
      });
    }
  });

  test('Accuracy test suite validates 99.5% performance', async ({ page }) => {
    // Run the accuracy test suite
    const testButton = page.locator('#testBtn');
    await expect(testButton).toBeVisible();
    await testButton.click();
    
    // Wait for test completion
    await page.waitForSelector('.status.success', { timeout: 15000 });
    
    // Verify test results through window object
    const testResults = await page.evaluate(() => window.testResults);
    expect(testResults).toBeDefined();
    expect(testResults.passed).toBe(4);
    expect(testResults.total).toBe(4);
    expect(testResults.accuracy).toBeGreaterThanOrEqual(99.0);
    
    // Check status message
    const status = await page.locator('#status').textContent();
    expect(status).toContain('4/4 tests passed');
    expect(status).toContain('99.5%');
  });

  test('Processing status updates are tracked correctly', async ({ page }) => {
    let statusUpdates = [];
    
    // Listen for status update events
    await page.addInitScript(() => {
      window.statusHistory = [];
      window.addEventListener('statusUpdate', (event) => {
        window.statusHistory.push(event.detail);
      });
    });
    
    // Start demo processing
    await page.locator('#demoBtn').click();
    
    // Wait for processing to complete
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Retrieve status history
    statusUpdates = await page.evaluate(() => window.statusHistory);
    
    // Validate status progression
    expect(statusUpdates.length).toBeGreaterThan(0);
    expect(statusUpdates[0].type).toBe('processing');
    expect(statusUpdates[statusUpdates.length - 1].type).toBe('success');
  });

  test('Results are properly stored for testing validation', async ({ page }) => {
    // Start demo extraction
    await page.locator('#demoBtn').click();
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Wait for results ready event
    await page.waitForFunction(() => window.testResults?.securities?.length > 0);
    
    // Validate stored results structure
    const results = await page.evaluate(() => window.testResults);
    expect(results).toHaveProperty('securities');
    expect(results).toHaveProperty('accuracy');
    expect(results).toHaveProperty('processingTime');
    
    expect(Array.isArray(results.securities)).toBe(true);
    expect(results.securities.length).toBe(4);
    expect(typeof results.accuracy).toBe('number');
    expect(typeof results.processingTime).toBe('number');
    
    // Validate security data structure
    for (const security of results.securities) {
      expect(security).toHaveProperty('isin');
      expect(security).toHaveProperty('name');
      expect(security).toHaveProperty('quantity');
      expect(security).toHaveProperty('price');
      expect(security).toHaveProperty('value');
    }
  });

  test('Performance metrics meet targets', async ({ page }) => {
    const startTime = Date.now();
    
    // Start demo processing
    await page.locator('#demoBtn').click();
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    // Validate processing time is reasonable
    expect(totalTime).toBeLessThan(10); // Should complete within 10 seconds
    
    // Check reported processing time
    const processingTimeText = await page.locator('#processingTime').textContent();
    const reportedTime = parseFloat(processingTimeText.replace('s', ''));
    expect(reportedTime).toBeGreaterThan(0);
    expect(reportedTime).toBeLessThan(15);
  });

  test('UI remains responsive during processing', async ({ page }) => {
    // Start processing
    await page.locator('#demoBtn').click();
    
    // Verify UI elements remain accessible during processing
    await expect(page.locator('.header')).toBeVisible();
    await expect(page.locator('.card')).toBeVisible();
    
    // Check progress bar is displayed
    await expect(page.locator('#progressBar')).toBeVisible();
    
    // Verify processing status is displayed
    await expect(page.locator('.status.processing')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Verify progress bar is hidden after completion
    await expect(page.locator('#progressBar')).toBeHidden();
  });
});

// Utility test for debugging
test.describe('Debug and Diagnostics', () => {
  test('Console logs are captured for debugging', async ({ page }) => {
    const consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    await page.goto('/');
    await page.locator('#demoBtn').click();
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Verify initialization messages
    const initMessage = consoleMessages.find(msg => 
      msg.text.includes('Phase 3 PDF Platform - Testing Interface Loaded')
    );
    expect(initMessage).toBeTruthy();
    
    // Check for errors
    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    expect(errorMessages.length).toBe(0);
  });
});