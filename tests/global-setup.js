// Global Setup for Playwright Tests
// Prepares the testing environment before all tests run

import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🚀 Starting Phase 3 PDF Platform Test Suite Setup');
  
  // Create test results directory
  const fs = await import('fs');
  const path = await import('path');
  
  const testResultsDir = path.resolve('test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
    console.log('📁 Created test-results directory');
  }
  
  // Start the test server
  console.log('🖥️  Starting playwright server for testing...');
  
  // Launch a browser to verify server is running
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Wait for server to be ready
    let serverReady = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (!serverReady && attempts < maxAttempts) {
      try {
        await page.goto('http://localhost:3000', { timeout: 1000 });
        
        // Check if the page loaded correctly
        const title = await page.title();
        if (title.includes('Phase 3 PDF Platform')) {
          serverReady = true;
          console.log('✅ Server is ready and responding');
        }
      } catch (error) {
        attempts++;
        console.log(`⏳ Waiting for server... (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!serverReady) {
      throw new Error('Server failed to start within timeout period');
    }
    
    // Verify API endpoints are working
    console.log('🔍 Verifying API endpoints...');
    
    const healthResponse = await page.request.get('/api/health');
    if (!healthResponse.ok()) {
      throw new Error('Health check endpoint not responding');
    }
    
    const healthData = await healthResponse.json();
    console.log('💚 Health check passed:', healthData.status);
    
    // Test processing endpoint
    const processResponse = await page.request.post('/api/process', {
      data: { mode: 'demo' }
    });
    
    if (!processResponse.ok()) {
      console.warn('⚠️  Processing endpoint test failed, but continuing...');
    } else {
      console.log('🔄 Processing endpoint verified');
    }
    
    // Create baseline screenshots for comparison
    console.log('📸 Creating baseline screenshots...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ 
      path: 'test-results/baseline-homepage.png',
      fullPage: true
    });
    
    console.log('✅ Baseline screenshots created');
    
    // Store global test configuration
    const testConfig = {
      baseURL: 'http://localhost:3000',
      serverStartTime: Date.now(),
      browserVersion: await browser.version(),
      setupCompleted: true
    };
    
    fs.writeFileSync(
      path.join(testResultsDir, 'test-config.json'),
      JSON.stringify(testConfig, null, 2)
    );
    
    console.log('📋 Test configuration saved');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error.message);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
  
  console.log('🎯 Global setup completed successfully');
  console.log('=' .repeat(50));
}

export default globalSetup;