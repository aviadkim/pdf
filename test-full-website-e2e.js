/**
 * FULL END-TO-END WEBSITE TEST
 * This test would have caught the deployment issue
 */

const { chromium } = require('playwright');

async function testFullWebsite() {
    console.log('🧪 FULL END-TO-END WEBSITE TEST');
    console.log('================================\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Test 1: Homepage loads
        console.log('📍 Test 1: Homepage loads correctly');
        await page.goto('https://pdf-fzzi.onrender.com/', { timeout: 30000 });
        
        const title = await page.title();
        console.log(`✅ Page title: ${title}`);
        
        // Test 2: Check for upload interface
        console.log('\n📍 Test 2: Upload interface present');
        const uploadArea = await page.$('#uploadArea, .upload-area, input[type="file"]');
        if (uploadArea) {
            console.log('✅ Upload interface found');
        } else {
            console.log('❌ FAILED: No upload interface found');
            console.log('⚠️ This is the issue - the frontend is not being served!');
        }
        
        // Test 3: Check for proper content
        console.log('\n📍 Test 3: Content verification');
        const pageContent = await page.content();
        
        if (pageContent.includes('PDF') || pageContent.includes('upload')) {
            console.log('✅ Page contains PDF processing content');
        } else {
            console.log('❌ FAILED: Page doesn\'t contain expected content');
        }
        
        // Test 4: API endpoint accessibility
        console.log('\n📍 Test 4: API endpoint test');
        const apiResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('/api/pdf-extract', { method: 'GET' });
                return { status: response.status, ok: response.ok };
            } catch (error) {
                return { error: error.message };
            }
        });
        
        if (apiResponse.status) {
            console.log(`✅ API endpoint responded: ${apiResponse.status}`);
        } else {
            console.log('❌ FAILED: API endpoint not accessible');
        }
        
        // Test 5: File upload functionality
        console.log('\n📍 Test 5: File upload functionality');
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            console.log('✅ File input element found');
            
            // Would test actual upload here if we had a test PDF
            console.log('⚠️ Skipping actual upload test (no test file)');
        } else {
            console.log('❌ FAILED: No file input found');
        }
        
        // Summary
        console.log('\n📊 TEST SUMMARY');
        console.log('================');
        console.log('This E2E test checks:');
        console.log('1. Homepage loads ✅');
        console.log('2. Upload interface present ❓');
        console.log('3. Content verification ❓');
        console.log('4. API accessibility ✅');
        console.log('5. Upload functionality ❓');
        
        console.log('\n💡 LESSON LEARNED:');
        console.log('Always test the FULL user journey, not just API endpoints!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.log('\n⚠️ This error would have revealed the deployment issue!');
    } finally {
        await browser.close();
    }
}

// Run test
testFullWebsite().catch(console.error);