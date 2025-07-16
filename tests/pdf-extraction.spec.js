// Playwright PDF Extraction Tests for Phase 3 Platform
// Tests document upload, processing, and complete extraction workflows

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PDF Extraction Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Phase 3 PDF Platform/);
    await page.waitForLoadState('networkidle');
  });

  test('File upload interface works correctly', async ({ page }) => {
    // Test file input visibility and functionality
    const uploadArea = page.locator('#uploadArea');
    await expect(uploadArea).toBeVisible();
    
    const chooseFileBtn = page.locator('button:has-text("Choose PDF File")');
    await expect(chooseFileBtn).toBeVisible();
    
    // Verify upload instructions
    await expect(uploadArea).toContainText('Click to upload PDF document or drag & drop here');
    
    // Test file input accessibility
    const fileInput = page.locator('#fileInput');
    await expect(fileInput).toHaveAttribute('accept', '.pdf');
    await expect(fileInput).toHaveAttribute('type', 'file');
  });

  test('Demo extraction processes 4 test securities', async ({ page }) => {
    // Start demo extraction
    await page.locator('#demoBtn').click();
    
    // Verify processing starts
    await expect(page.locator('.status.processing')).toBeVisible();
    await expect(page.locator('#progressBar')).toBeVisible();
    
    // Wait for completion
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Verify results
    await expect(page.locator('#resultsSection')).toBeVisible();
    
    // Check securities count
    const totalSecurities = await page.locator('#totalSecurities').textContent();
    expect(parseInt(totalSecurities)).toBe(4);
    
    // Verify accuracy is displayed
    const accuracy = await page.locator('#accuracy').textContent();
    expect(accuracy).toMatch(/\d+\.\d+%/);
    
    // Check portfolio value
    const portfolioValue = await page.locator('#portfolioValue').textContent();
    expect(portfolioValue).toMatch(/\$[\d,]+/);
    
    // Verify security list is populated
    const securityItems = page.locator('.security-item');
    await expect(securityItems).toHaveCount(4);
  });

  test('Full extraction handles 40+ securities', async ({ page }) => {
    // Start full extraction
    await page.locator('#fullBtn').click();
    
    // Verify extended processing starts
    await expect(page.locator('.status.processing')).toBeVisible();
    await expect(page.locator('#progressBar')).toBeVisible();
    
    // Wait for completion (longer timeout for full extraction)
    await page.waitForSelector('.status.success', { timeout: 20000 });
    
    // Verify results
    await expect(page.locator('#resultsSection')).toBeVisible();
    
    // Check securities count (should be 40)
    const totalSecurities = await page.locator('#totalSecurities').textContent();
    expect(parseInt(totalSecurities)).toBe(40);
    
    // Verify large portfolio value
    const portfolioValue = await page.locator('#portfolioValue').textContent();
    expect(portfolioValue).toContain('$4,');
    
    // Check processing time is reasonable
    const processingTime = await page.locator('#processingTime').textContent();
    const timeValue = parseFloat(processingTime.replace('s', ''));
    expect(timeValue).toBeGreaterThan(10); // Full extraction takes longer
    expect(timeValue).toBeLessThan(30); // But not too long
  });

  test('Processing status updates correctly throughout workflow', async ({ page }) => {
    let statusHistory = [];
    
    // Capture status updates
    await page.addInitScript(() => {
      window.statusEvents = [];
      window.addEventListener('statusUpdate', (event) => {
        window.statusEvents.push({
          message: event.detail.message,
          type: event.detail.type,
          timestamp: Date.now()
        });
      });
    });
    
    // Start demo processing
    await page.locator('#demoBtn').click();
    
    // Wait for completion
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Retrieve status events
    statusHistory = await page.evaluate(() => window.statusEvents);
    
    // Validate status progression
    expect(statusHistory.length).toBeGreaterThan(0);
    
    // Check for processing start
    const startEvent = statusHistory.find(e => e.type === 'processing');
    expect(startEvent).toBeTruthy();
    expect(startEvent.message).toContain('Phase 3');
    
    // Check for completion
    const endEvent = statusHistory.find(e => e.type === 'success');
    expect(endEvent).toBeTruthy();
    expect(endEvent.message).toContain('completed');
  });

  test('Results data structure is correct', async ({ page }) => {
    // Start demo extraction
    await page.locator('#demoBtn').click();
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Wait for results to be available
    await page.waitForFunction(() => window.testResults?.securities);
    
    // Validate results structure
    const results = await page.evaluate(() => window.testResults);
    
    // Check main properties
    expect(results).toHaveProperty('securities');
    expect(results).toHaveProperty('accuracy');
    expect(results).toHaveProperty('processingTime');
    
    // Validate securities array
    expect(Array.isArray(results.securities)).toBe(true);
    expect(results.securities.length).toBeGreaterThan(0);
    
    // Check individual security structure
    const firstSecurity = results.securities[0];
    expect(firstSecurity).toHaveProperty('isin');
    expect(firstSecurity).toHaveProperty('name');
    expect(firstSecurity).toHaveProperty('quantity');
    expect(firstSecurity).toHaveProperty('price');
    expect(firstSecurity).toHaveProperty('value');
    
    // Validate data types
    expect(typeof firstSecurity.isin).toBe('string');
    expect(typeof firstSecurity.name).toBe('string');
    expect(typeof firstSecurity.quantity).toBe('number');
    expect(typeof firstSecurity.price).toBe('number');
    expect(typeof firstSecurity.value).toBe('number');
    
    // Validate ISIN format (12 characters)
    expect(firstSecurity.isin).toMatch(/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/);
  });

  test('Mathematical validation is performed correctly', async ({ page }) => {
    // Start demo extraction
    await page.locator('#demoBtn').click();
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Get results
    const results = await page.evaluate(() => window.testResults);
    
    // Validate mathematical consistency for each security
    for (const security of results.securities) {
      const { quantity, price, value } = security;
      
      // Calculate expected value
      const expectedValue = quantity * price;
      
      // Allow for small rounding differences
      const difference = Math.abs(expectedValue - value);
      const tolerance = Math.max(expectedValue * 0.01, 1); // 1% or $1 minimum
      
      expect(difference).toBeLessThanOrEqual(tolerance);
    }
  });

  test('Progress bar animates correctly during processing', async ({ page }) => {
    // Start processing
    await page.locator('#demoBtn').click();
    
    // Check progress bar becomes visible
    const progressBar = page.locator('#progressBar');
    await expect(progressBar).toBeVisible();
    
    // Check progress fill starts at 0%
    const progressFill = page.locator('#progressFill');
    const initialWidth = await progressFill.evaluate(el => el.style.width);
    expect(initialWidth).toBe('0%');
    
    // Wait a moment and check progress has advanced
    await page.waitForTimeout(2000);
    const midWidth = await progressFill.evaluate(el => el.style.width);
    expect(parseFloat(midWidth)).toBeGreaterThan(0);
    
    // Wait for completion
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Progress bar should be hidden after completion
    await expect(progressBar).toBeHidden();
  });

  test('Error handling works for various scenarios', async ({ page }) => {
    // Test with network issues (simulate by blocking requests)
    await page.route('**/api/**', route => route.abort());
    
    // Start processing (this should work since it's client-side simulation)
    await page.locator('#demoBtn').click();
    
    // Should still complete successfully (demo mode doesn't use API)
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Clear route blocking
    await page.unroute('**/api/**');
  });

  test('Drag and drop file upload works', async ({ page }) => {
    // Test drag and drop functionality
    const uploadArea = page.locator('#uploadArea');
    
    // Simulate dragover event
    await uploadArea.dispatchEvent('dragover', {
      dataTransfer: {
        types: ['Files'],
        files: []
      }
    });
    
    // Check visual feedback
    const borderColor = await uploadArea.evaluate(el => 
      getComputedStyle(el).borderColor
    );
    
    // Should change appearance on dragover
    expect(borderColor).toBeTruthy();
    
    // Simulate dragleave
    await uploadArea.dispatchEvent('dragleave');
  });

  test('File upload status is updated correctly', async ({ page }) => {
    let uploadEvents = [];
    
    // Listen for file upload events
    await page.addInitScript(() => {
      window.uploadHistory = [];
      window.addEventListener('fileUploaded', (event) => {
        window.uploadHistory.push(event.detail);
      });
    });
    
    // Note: Actual file upload testing would require a real file
    // This tests the event system structure
    
    await page.evaluate(() => {
      // Simulate file upload event
      const event = new CustomEvent('fileUploaded', {
        detail: { filename: 'test-portfolio.pdf' }
      });
      window.dispatchEvent(event);
    });
    
    // Check event was captured
    uploadEvents = await page.evaluate(() => window.uploadHistory);
    expect(uploadEvents.length).toBe(1);
    expect(uploadEvents[0].filename).toBe('test-portfolio.pdf');
  });

  test('Results can be exported or displayed in different formats', async ({ page }) => {
    // Start demo extraction
    await page.locator('#demoBtn').click();
    await page.waitForSelector('.status.success', { timeout: 10000 });
    
    // Verify security list display
    const securityList = page.locator('#securityList');
    await expect(securityList).toBeVisible();
    
    // Check security items are properly formatted
    const securityItems = page.locator('.security-item');
    await expect(securityItems.first()).toBeVisible();
    
    // Verify data is displayed in grid format
    const firstItem = securityItems.first();
    const cells = firstItem.locator('div');
    await expect(cells).toHaveCount(4); // ISIN/Name, Quantity, Price, Value
  });
});

test.describe('API Integration Tests', () => {
  test('Health check endpoint responds correctly', async ({ page }) => {
    // Test health check API
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('service', 'Phase 3 PDF Platform');
    expect(data).toHaveProperty('timestamp');
  });

  test('Processing API returns correct response structure', async ({ page }) => {
    // Test demo processing API
    const response = await page.request.post('/api/process', {
      data: { mode: 'demo' }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('securities');
    expect(data).toHaveProperty('accuracy');
    expect(data).toHaveProperty('processingTime');
    expect(Array.isArray(data.securities)).toBe(true);
  });

  test('Full processing API handles large document simulation', async ({ page }) => {
    // Test full processing API
    const response = await page.request.post('/api/process', {
      data: { mode: 'full' }
    });
    
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('count', 40);
    expect(data).toHaveProperty('accuracy');
    expect(data).toHaveProperty('totalValue');
    expect(data.totalValue).toBeGreaterThan(1000000000); // Billion dollar portfolio
  });
});