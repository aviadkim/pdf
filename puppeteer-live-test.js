/**
 * REAL PUPPETEER LIVE WEBSITE TEST
 * Actually opens the website and tests PDF upload to get real results
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('🎭 REAL PUPPETEER LIVE WEBSITE TEST');
console.log('===================================');

async function testLiveWebsite() {
    let browser = null;
    
    try {
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Navigate to the live website
        console.log('🌐 Navigating to https://pdf-fzzi.onrender.com/...');
        await page.goto('https://pdf-fzzi.onrender.com/', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('✅ Website loaded successfully');
        
        // Check if PDF file exists
        const pdfPath = path.resolve('2. Messos  - 31.03.2025.pdf');
        if (!fs.existsSync(pdfPath)) {
            throw new Error('PDF file not found: ' + pdfPath);
        }
        
        console.log('📄 PDF file found, preparing upload...');
        
        // Find the file input element
        const fileInput = await page.$('input[type="file"]');
        if (!fileInput) {
            throw new Error('File input not found on page');
        }
        
        // Upload the PDF file
        console.log('📤 Uploading PDF file...');
        await fileInput.uploadFile(pdfPath);
        
        // Find and click the submit button
        const submitButton = await page.$('button[type="submit"], input[type="submit"], button:contains("Process")');
        if (!submitButton) {
            // Try to find any button with processing-related text
            const buttons = await page.$$('button');
            let processingButton = null;
            
            for (const button of buttons) {
                const text = await page.evaluate(el => el.textContent, button);
                if (text.includes('Process') || text.includes('Submit') || text.includes('Upload')) {
                    processingButton = button;
                    break;
                }
            }
            
            if (processingButton) {
                console.log('🔘 Found processing button, clicking...');
                await processingButton.click();
            } else {
                throw new Error('No submit/process button found');
            }
        } else {
            console.log('🔘 Clicking submit button...');
            await submitButton.click();
        }
        
        // Wait for results
        console.log('⏳ Waiting for processing results...');
        await page.waitForTimeout(10000); // Wait 10 seconds for processing
        
        // Try to extract results from the page
        const results = await page.evaluate(() => {
            // Look for various result patterns
            const resultElements = document.querySelectorAll('*');
            const results = {
                securities: 0,
                totalValue: 0,
                accuracy: 0,
                text: document.body.innerText
            };
            
            // Search for numbers in the text
            const text = document.body.innerText;
            
            // Look for securities count
            const securitiesMatch = text.match(/(\d+)\s*securities|securities[:\s]*(\d+)/i);
            if (securitiesMatch) {
                results.securities = parseInt(securitiesMatch[1] || securitiesMatch[2]);
            }
            
            // Look for total value
            const valueMatches = text.match(/\$([0-9,]+(?:\.[0-9]{2})?)/g);
            if (valueMatches) {
                const values = valueMatches.map(v => parseFloat(v.replace(/[$,]/g, '')));
                results.totalValue = Math.max(...values); // Take the largest value
            }
            
            // Look for accuracy
            const accuracyMatch = text.match(/(\d+(?:\.\d+)?)%\s*accuracy|accuracy[:\s]*(\d+(?:\.\d+)?)%/i);
            if (accuracyMatch) {
                results.accuracy = parseFloat(accuracyMatch[1] || accuracyMatch[2]);
            }
            
            return results;
        });
        
        console.log('\n🎯 LIVE WEBSITE TEST RESULTS');
        console.log('=============================');
        console.log(`📊 Securities Found: ${results.securities}`);
        console.log(`💰 Total Value: $${results.totalValue.toLocaleString()}`);
        console.log(`🎯 Accuracy: ${results.accuracy}%`);
        console.log(`🎯 Target: $19,464,431`);
        
        if (results.totalValue > 0) {
            const realAccuracy = Math.min(100, (Math.min(19464431, results.totalValue) / Math.max(19464431, results.totalValue)) * 100);
            console.log(`📊 Calculated Accuracy: ${realAccuracy.toFixed(2)}%`);
        }
        
        // Take a screenshot
        console.log('📸 Taking screenshot...');
        await page.screenshot({ 
            path: 'live-test-results.png',
            fullPage: true 
        });
        
        console.log('✅ Screenshot saved as live-test-results.png');
        
        // Save full page text for analysis
        fs.writeFileSync('live-test-page-content.txt', results.text);
        console.log('✅ Page content saved as live-test-page-content.txt');
        
        return results;
        
    } catch (error) {
        console.error('❌ Live test error:', error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the live test
testLiveWebsite().then(results => {
    if (results) {
        console.log('\n🎉 LIVE TEST COMPLETED SUCCESSFULLY!');
        console.log('Check live-test-results.png and live-test-page-content.txt for details');
        
        if (results.accuracy > 90) {
            console.log('✅ HIGH ACCURACY DETECTED - New deployment is working!');
        } else if (results.totalValue > 15000000) {
            console.log('✅ HIGH VALUE DETECTED - System is processing correctly!');
        } else {
            console.log('⚠️ Results seem low - may need more time for deployment');
        }
    } else {
        console.log('❌ Live test failed - check logs above');
    }
}).catch(error => {
    console.error('❌ Test execution error:', error);
});