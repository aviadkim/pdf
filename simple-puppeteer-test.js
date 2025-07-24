/**
 * SIMPLE PUPPETEER TEST - Check actual website content
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('🎭 SIMPLE PUPPETEER LIVE TEST');
console.log('=============================');

async function simpleLiveTest() {
    let browser = null;
    
    try {
        console.log('🚀 Launching browser...');
        browser = await puppeteer.launch({
            headless: false, // Show browser
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1200, height: 800 }
        });
        
        const page = await browser.newPage();
        
        // Navigate to the live website
        console.log('🌐 Loading https://pdf-fzzi.onrender.com/...');
        await page.goto('https://pdf-fzzi.onrender.com/', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait a bit for any dynamic content
        await page.waitForTimeout(3000);
        
        console.log('✅ Website loaded');
        
        // Get page title and content
        const title = await page.title();
        console.log(`📄 Page title: ${title}`);
        
        // Check if we can find file input
        const hasFileInput = await page.$('input[type="file"]') !== null;
        console.log(`📁 File input found: ${hasFileInput ? 'Yes' : 'No'}`);
        
        // Get all button text
        const buttons = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map(btn => btn.textContent.trim()).filter(text => text);
        });
        console.log('🔘 Buttons found:', buttons);
        
        // Take a screenshot of the homepage
        console.log('📸 Taking homepage screenshot...');
        await page.screenshot({ 
            path: 'homepage-screenshot.png',
            fullPage: true 
        });
        
        // If we have file input, try to interact with it
        if (hasFileInput) {
            console.log('📤 Attempting PDF upload...');
            
            const pdfPath = path.resolve('2. Messos  - 31.03.2025.pdf');
            if (fs.existsSync(pdfPath)) {
                const fileInput = await page.$('input[type="file"]');
                await fileInput.uploadFile(pdfPath);
                console.log('✅ File uploaded');
                
                // Look for any button to submit
                const submitButtons = await page.$$('button, input[type="submit"]');
                if (submitButtons.length > 0) {
                    console.log('🔘 Clicking first button...');
                    await submitButtons[0].click();
                    
                    // Wait for any response
                    console.log('⏳ Waiting for results...');
                    await page.waitForTimeout(15000); // Wait 15 seconds
                    
                    // Take screenshot of results
                    await page.screenshot({ 
                        path: 'results-screenshot.png',
                        fullPage: true 
                    });
                    
                    // Extract any numbers from the page
                    const pageData = await page.evaluate(() => {
                        const text = document.body.innerText;
                        const numbers = text.match(/\$?[\d,]+(?:\.\d{2})?/g) || [];
                        const percentages = text.match(/\d+(?:\.\d+)?%/g) || [];
                        
                        return {
                            allText: text.substring(0, 2000), // First 2000 chars
                            numbers: numbers,
                            percentages: percentages,
                            hasResults: text.includes('securities') || text.includes('accuracy') || text.includes('total')
                        };
                    });
                    
                    console.log('\n📊 RESULTS EXTRACTED:');
                    console.log('=====================');
                    console.log('Numbers found:', pageData.numbers.slice(0, 10));
                    console.log('Percentages found:', pageData.percentages);
                    console.log('Has results:', pageData.hasResults);
                    
                    // Save the content
                    fs.writeFileSync('website-results.txt', pageData.allText);
                    console.log('✅ Results saved to website-results.txt');
                    
                    return pageData;
                }
            }
        }
        
        return { success: true };
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    } finally {
        if (browser) {
            console.log('🔒 Closing browser...');
            await browser.close();
        }
    }
}

// Run the test
simpleLiveTest().then(results => {
    console.log('\n✅ PUPPETEER TEST COMPLETE');
    console.log('Check homepage-screenshot.png and results-screenshot.png');
}).catch(console.error);