
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function screenshotPDFPages(pdfPath) {
  console.log('Starting Playwright browser...', { file: process.stderr });
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Convert PDF to data URL for browser
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfBase64 = pdfBuffer.toString('base64');
    const dataUrl = 'data:application/pdf;base64,' + pdfBase64;
    
    console.log('Loading PDF in browser...', { file: process.stderr });
    await page.goto(dataUrl);
    await page.waitForTimeout(3000);
    
    const screenshots = [];
    
    // Take screenshots of visible content
    for (let i = 0; i < 10; i++) {
      try {
        const screenshot = await page.screenshot({
          type: 'png',
          fullPage: true
        });
        
        const screenshotPath = `./temp_page_${i + 1}.png`;
        fs.writeFileSync(screenshotPath, screenshot);
        
        screenshots.push({
          page: i + 1,
          path: screenshotPath,
          size: screenshot.length
        });
        
        console.log(`Screenshot ${i + 1} captured: ${screenshotPath}`, { file: process.stderr });
        
        // Scroll down for next "page"
        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await page.waitForTimeout(1000);
        
      } catch (pageError) {
        console.log(`Page ${i + 1} screenshot failed: ${pageError.message}`, { file: process.stderr });
        break;
      }
    }
    
    await browser.close();
    return { screenshots, success: true };
    
  } catch (error) {
    await browser.close();
    throw error;
  }
}

// Execute
const pdfPath = process.argv[2];
screenshotPDFPages(pdfPath).then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error(JSON.stringify({ error: error.message, success: false }, null, 2));
});
