// Real browser testing with Stagehand
import { Stagehand } from "@browserbasehq/stagehand";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testWebsiteWithRealBrowser() {
  console.log('🌐 Starting Real Browser Test with Stagehand');
  
  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    debugDom: true,
  });

  try {
    await stagehand.init();
    console.log('✅ Stagehand initialized');

    // Navigate to the website
    const websiteUrl = 'https://pdf-five-nu.vercel.app/api/family-office-upload';
    console.log(`🔍 Navigating to: ${websiteUrl}`);
    
    await stagehand.page.goto(websiteUrl);
    await stagehand.page.waitForLoadState('networkidle');
    
    console.log('✅ Website loaded');
    console.log('📄 Page title:', await stagehand.page.title());
    
    // Take screenshot of initial state
    await stagehand.page.screenshot({ path: 'website-initial.png' });
    console.log('📸 Screenshot saved: website-initial.png');
    
    // Check if upload area exists
    const uploadArea = await stagehand.page.locator('.upload-area');
    if (await uploadArea.count() > 0) {
      console.log('✅ Upload area found');
    } else {
      console.log('❌ Upload area not found');
      await stagehand.page.screenshot({ path: 'error-no-upload-area.png' });
    }
    
    // Check if file input exists
    const fileInput = await stagehand.page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      console.log('✅ File input found');
    } else {
      console.log('❌ File input not found');
    }
    
    // Test PDF upload with real Messos file
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    if (fs.existsSync(pdfPath)) {
      console.log('📄 Found Messos PDF, testing upload...');
      
      // Upload the file
      await fileInput.setInputFiles(pdfPath);
      console.log('✅ File selected for upload');
      
      // Wait for processing to start
      await stagehand.page.waitForSelector('.processing', { state: 'visible' });
      console.log('⏳ Processing started');
      
      // Take screenshot during processing
      await stagehand.page.screenshot({ path: 'processing.png' });
      
      // Wait for results (max 30 seconds)
      try {
        await stagehand.page.waitForSelector('.results', { 
          state: 'visible', 
          timeout: 30000 
        });
        console.log('✅ Results appeared');
        
        // Take screenshot of results
        await stagehand.page.screenshot({ path: 'results.png' });
        
        // Check holdings count
        const holdingsCount = await stagehand.page.locator('#resultsSummary .summary-value').first().textContent();
        console.log(`📊 Holdings found: ${holdingsCount}`);
        
        // Check total value
        const totalValue = await stagehand.page.locator('#resultsSummary .summary-value').nth(1).textContent();
        console.log(`💰 Total value: ${totalValue}`);
        
        // Check processing time
        const processingTime = await stagehand.page.locator('#resultsSummary .summary-value').nth(2).textContent();
        console.log(`⏱️ Processing time: ${processingTime}`);
        
        // Check if holdings table has data
        const holdingsRows = await stagehand.page.locator('#holdingsTableBody tr');
        const rowCount = await holdingsRows.count();
        console.log(`📋 Holdings table rows: ${rowCount}`);
        
        if (rowCount === 0) {
          console.log('❌ PROBLEM: No holdings extracted!');
          
          // Check console errors
          const logs = [];
          stagehand.page.on('console', msg => logs.push(msg.text()));
          console.log('🐛 Console logs:', logs);
          
          // Take screenshot of empty results
          await stagehand.page.screenshot({ path: 'empty-results.png' });
          
          return {
            success: false,
            issue: 'No holdings extracted',
            holdingsCount: 0,
            screenshots: ['website-initial.png', 'processing.png', 'results.png', 'empty-results.png']
          };
        } else {
          console.log('✅ SUCCESS: Holdings extracted!');
          
          // Get first few holdings details
          for (let i = 0; i < Math.min(3, rowCount); i++) {
            const row = holdingsRows.nth(i);
            const securityName = await row.locator('td').nth(1).textContent();
            const isin = await row.locator('td').nth(2).textContent();
            const value = await row.locator('td').nth(3).textContent();
            console.log(`  ${i+1}. ${securityName} (${isin}) - ${value}`);
          }
          
          return {
            success: true,
            holdingsCount: parseInt(holdingsCount),
            totalValue: totalValue,
            processingTime: processingTime,
            screenshots: ['website-initial.png', 'processing.png', 'results.png']
          };
        }
        
      } catch (timeoutError) {
        console.log('❌ Timeout waiting for results');
        await stagehand.page.screenshot({ path: 'timeout-error.png' });
        
        return {
          success: false,
          issue: 'Processing timeout',
          screenshots: ['website-initial.png', 'processing.png', 'timeout-error.png']
        };
      }
      
    } else {
      console.log('❌ Messos PDF not found, cannot test upload');
      return {
        success: false,
        issue: 'PDF file not found'
      };
    }
    
  } catch (error) {
    console.error('❌ Browser test failed:', error);
    await stagehand.page.screenshot({ path: 'critical-error.png' });
    
    return {
      success: false,
      issue: 'Browser test failed',
      error: error.message,
      screenshots: ['critical-error.png']
    };
    
  } finally {
    await stagehand.close();
    console.log('🔚 Browser closed');
  }
}

// Run the test
testWebsiteWithRealBrowser()
  .then(result => {
    console.log('\n🎯 FINAL TEST RESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    if (!result.success) {
      console.log('\n❌ ISSUES FOUND - NEEDS FIXING');
      process.exit(1);
    } else {
      console.log('\n✅ ALL TESTS PASSED');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });