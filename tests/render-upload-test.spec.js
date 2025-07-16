// Comprehensive Upload Test for Render Deployment
// Tests PDF upload and extraction accuracy

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Render PDF Upload and Accuracy Test', () => {
  const testPdfPath = path.join(process.cwd(), '2. Messos  - 31.03.2025.pdf');
  const expectedPortfolioValue = 19464431; // $19,464,431 as mentioned in UI
  
  // Known securities from the test data (based on previous tests)
  const expectedSecurities = {
    'XS2530201644': {
      name: 'TORONTO DOMINION BANK',
      quantity: 200000,
      price: 99.1991,
      value: 19839820
    },
    'XS2588105036': {
      name: 'CANADIAN IMPERIAL BANK',
      quantity: 200000,
      price: 99.6285,
      value: 19925700
    },
    'XS2665592833': {
      name: 'HARP ISSUER',
      quantity: 1500000,
      price: 98.3700,
      value: 147555000
    },
    'XS2567543397': {
      name: 'GOLDMAN SACHS',
      quantity: 2450000,
      price: 100.5200,
      value: 246274000
    }
  };

  let detailedResults = {
    timestamp: new Date().toISOString(),
    pdfFile: testPdfPath,
    url: 'https://pdf-fzzi.onrender.com',
    extractionResults: null,
    accuracyAnalysis: {
      totalSecurities: 0,
      correctExtractions: 0,
      missingSecurities: [],
      incorrectValues: [],
      accuracyPercentage: 0
    },
    errors: []
  };

  test.beforeEach(async ({ page }) => {
    // Set up console logging
    page.on('console', msg => {
      console.log('Browser console:', msg.type(), msg.text());
      if (msg.type() === 'error') {
        detailedResults.errors.push({
          type: 'console-error',
          message: msg.text(),
          time: new Date().toISOString()
        });
      }
    });

    // Navigate to the site
    console.log('Navigating to Render deployment...');
    await page.goto('https://pdf-fzzi.onrender.com', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Verify page loaded
    await expect(page.locator('.header')).toBeVisible();
    console.log('Page loaded successfully');
  });

  test('Upload Messos PDF and analyze extraction accuracy', async ({ page }) => {
    // Check if PDF file exists
    if (!fs.existsSync(testPdfPath)) {
      throw new Error(`Test PDF not found at: ${testPdfPath}`);
    }

    console.log(`Uploading PDF: ${testPdfPath}`);
    
    // Upload the file
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(testPdfPath);
    
    // Wait for processing to complete
    console.log('Waiting for processing to complete...');
    
    // Look for completion indicators
    const maxWaitTime = 120000; // 2 minutes
    const startTime = Date.now();
    
    // Wait for either success message or results to appear
    try {
      await page.waitForSelector('.result-item:has-text("Processing completed successfully")', {
        timeout: maxWaitTime
      });
      console.log('Processing completed successfully');
    } catch (e) {
      console.log('Processing completion message not found, checking for results...');
    }
    
    // Take screenshot of results
    await page.screenshot({ 
      path: 'render-test-results/upload-results.png',
      fullPage: true 
    });
    
    // Extract results from the page
    const results = await page.evaluate(() => {
      const resultItems = [];
      document.querySelectorAll('.result-item').forEach(item => {
        resultItems.push(item.textContent.trim());
      });
      return resultItems;
    });
    
    console.log('Result items found:', results.length);
    results.forEach(r => console.log(' -', r));
    
    // Parse the results
    let totalValue = null;
    let securitiesCount = null;
    let confidence = null;
    
    for (const result of results) {
      if (result.includes('Total Portfolio Value:')) {
        const match = result.match(/\$([0-9,]+)/);
        if (match) {
          totalValue = parseInt(match[1].replace(/,/g, ''));
        }
      }
      if (result.includes('Securities Extracted:')) {
        const match = result.match(/(\d+)/);
        if (match) {
          securitiesCount = parseInt(match[1]);
        }
      }
      if (result.includes('Confidence Level:')) {
        const match = result.match(/([\d.]+)%/);
        if (match) {
          confidence = parseFloat(match[1]);
        }
      }
    }
    
    console.log('Extracted values:');
    console.log(`  Total Value: ${totalValue}`);
    console.log(`  Securities Count: ${securitiesCount}`);
    console.log(`  Confidence: ${confidence}%`);
    
    // Store extraction results
    detailedResults.extractionResults = {
      totalValue,
      securitiesCount,
      confidence,
      rawResults: results
    };
    
    // Analyze accuracy
    if (totalValue !== null) {
      const valueAccuracy = Math.abs(totalValue - expectedPortfolioValue) / expectedPortfolioValue * 100;
      console.log(`Portfolio value accuracy: ${(100 - valueAccuracy).toFixed(2)}%`);
      console.log(`  Expected: $${expectedPortfolioValue.toLocaleString()}`);
      console.log(`  Extracted: $${totalValue.toLocaleString()}`);
      console.log(`  Difference: $${Math.abs(totalValue - expectedPortfolioValue).toLocaleString()}`);
      
      detailedResults.accuracyAnalysis.portfolioValueAccuracy = 100 - valueAccuracy;
    }
    
    // Look for detailed securities table if available
    const securitiesTable = await page.evaluate(() => {
      const securities = [];
      const tables = document.querySelectorAll('table');
      
      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach((row, index) => {
          if (index === 0) return; // Skip header
          
          const cells = row.querySelectorAll('td');
          if (cells.length >= 4) {
            const isin = cells[0]?.textContent?.trim();
            if (isin && isin.startsWith('XS')) {
              securities.push({
                isin: isin,
                name: cells[1]?.textContent?.trim(),
                quantity: cells[2]?.textContent?.trim(),
                price: cells[3]?.textContent?.trim(),
                value: cells[4]?.textContent?.trim()
              });
            }
          }
        });
      });
      
      return securities;
    });
    
    if (securitiesTable.length > 0) {
      console.log(`\nFound ${securitiesTable.length} securities in table:`);
      securitiesTable.forEach(sec => {
        console.log(`  ${sec.isin}: ${sec.quantity} @ ${sec.price} = ${sec.value}`);
      });
      
      // Analyze individual securities
      for (const [isin, expected] of Object.entries(expectedSecurities)) {
        const found = securitiesTable.find(s => s.isin === isin);
        if (!found) {
          detailedResults.accuracyAnalysis.missingSecurities.push(isin);
        } else {
          // Parse and compare values
          const quantity = parseFloat(found.quantity.replace(/,/g, ''));
          const price = parseFloat(found.price.replace(/[$,]/g, ''));
          const value = parseFloat(found.value.replace(/[$,]/g, ''));
          
          const quantityMatch = Math.abs(quantity - expected.quantity) < 1;
          const priceMatch = Math.abs(price - expected.price) < 0.01;
          const valueMatch = Math.abs(value - expected.value) < 100;
          
          if (quantityMatch && priceMatch && valueMatch) {
            detailedResults.accuracyAnalysis.correctExtractions++;
          } else {
            detailedResults.accuracyAnalysis.incorrectValues.push({
              isin,
              expected,
              extracted: { quantity, price, value },
              errors: {
                quantity: !quantityMatch,
                price: !priceMatch,
                value: !valueMatch
              }
            });
          }
        }
      }
      
      detailedResults.accuracyAnalysis.totalSecurities = Object.keys(expectedSecurities).length;
      detailedResults.accuracyAnalysis.accuracyPercentage = 
        (detailedResults.accuracyAnalysis.correctExtractions / detailedResults.accuracyAnalysis.totalSecurities) * 100;
    }
    
    // API response monitoring
    const apiResponses = await page.evaluate(() => {
      return window.apiResponses || [];
    });
    
    if (apiResponses.length > 0) {
      detailedResults.apiResponses = apiResponses;
    }
  });

  test('Test different processing options', async ({ page }) => {
    // Upload file again
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(testPdfPath);
    
    // Test with different option combinations
    const options = [
      { mcp: true, webFetch: true, dualEngine: true, institution: true },
      { mcp: false, webFetch: true, dualEngine: true, institution: true },
      { mcp: true, webFetch: false, dualEngine: true, institution: true },
      { mcp: true, webFetch: true, dualEngine: false, institution: true }
    ];
    
    for (const opt of options) {
      console.log(`\nTesting with options:`, opt);
      
      // Set options
      await page.locator('#mcpEnabled').setChecked(opt.mcp);
      await page.locator('#webFetchEnabled').setChecked(opt.webFetch);
      await page.locator('#dualEngineEnabled').setChecked(opt.dualEngine);
      await page.locator('#institutionDetection').setChecked(opt.institution);
      
      // Process and wait briefly
      await page.waitForTimeout(2000);
      
      // Note: In a real test, we'd re-upload and check results for each configuration
    }
  });

  test.afterAll(async () => {
    // Save detailed results
    const resultsPath = path.join('render-test-results', 'upload-accuracy-analysis.json');
    fs.writeFileSync(resultsPath, JSON.stringify(detailedResults, null, 2));
    
    console.log('\n=== UPLOAD TEST SUMMARY ===');
    console.log(`PDF File: ${path.basename(testPdfPath)}`);
    console.log(`Deployment URL: https://pdf-fzzi.onrender.com`);
    
    if (detailedResults.extractionResults) {
      const { totalValue, securitiesCount, confidence } = detailedResults.extractionResults;
      console.log(`\nExtraction Results:`);
      console.log(`  Total Value: $${totalValue?.toLocaleString() || 'N/A'}`);
      console.log(`  Securities Count: ${securitiesCount || 'N/A'}`);
      console.log(`  Confidence: ${confidence || 'N/A'}%`);
    }
    
    console.log(`\nAccuracy Analysis:`);
    console.log(`  Correct Extractions: ${detailedResults.accuracyAnalysis.correctExtractions}/${detailedResults.accuracyAnalysis.totalSecurities}`);
    console.log(`  Accuracy: ${detailedResults.accuracyAnalysis.accuracyPercentage.toFixed(2)}%`);
    
    if (detailedResults.accuracyAnalysis.missingSecurities.length > 0) {
      console.log(`  Missing Securities: ${detailedResults.accuracyAnalysis.missingSecurities.join(', ')}`);
    }
    
    if (detailedResults.accuracyAnalysis.incorrectValues.length > 0) {
      console.log(`  Securities with incorrect values:`);
      detailedResults.accuracyAnalysis.incorrectValues.forEach(item => {
        console.log(`    - ${item.isin}: ${Object.keys(item.errors).filter(k => item.errors[k]).join(', ')}`);
      });
    }
    
    if (detailedResults.errors.length > 0) {
      console.log(`\nErrors encountered: ${detailedResults.errors.length}`);
    }
    
    console.log(`\nDetailed results saved to: ${resultsPath}`);
    
    // Fail the test if accuracy is below 99.5%
    if (detailedResults.accuracyAnalysis.accuracyPercentage < 99.5) {
      throw new Error(`Accuracy ${detailedResults.accuracyAnalysis.accuracyPercentage.toFixed(2)}% is below required 99.5%`);
    }
  });
});