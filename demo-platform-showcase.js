const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

async function demonstratePlatform() {
    console.log('🚀 Starting Enterprise SaaS Platform Demonstration\n');
    
    const browser = await puppeteer.launch({
        headless: false, // Show browser window
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'platform-demo-screenshots');
    try {
        await fs.mkdir(screenshotsDir, { recursive: true });
    } catch (err) {
        console.log('Screenshots directory already exists');
    }
    
    // Helper function to take screenshot
    async function captureScreen(name, description) {
        const filename = path.join(screenshotsDir, `${name}.png`);
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 Captured: ${description}`);
        console.log(`   Saved to: ${filename}\n`);
        await page.waitForTimeout(1000); // Pause for demo effect
    }
    
    try {
        // 1. Dashboard
        console.log('1️⃣ Navigating to Dashboard...');
        await page.goto('http://localhost:3000/dashboard.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        await captureScreen('01-dashboard', 'Main Dashboard - Enterprise View');
        
        // Test file upload interface
        console.log('   Testing file upload area...');
        const uploadArea = await page.$('#uploadArea');
        if (uploadArea) {
            await uploadArea.hover();
            await page.waitForTimeout(500);
            await captureScreen('02-dashboard-upload-hover', 'Dashboard - Upload Area Interaction');
        }
        
        // 2. Document History
        console.log('2️⃣ Navigating to Document History...');
        await page.goto('http://localhost:3000/history.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        await captureScreen('03-document-history', 'Document History - Processing Records');
        
        // Test search functionality
        const searchInput = await page.$('#searchInput');
        if (searchInput) {
            await searchInput.type('financial');
            await page.waitForTimeout(1000);
            await captureScreen('04-history-search', 'Document History - Search Functionality');
        }
        
        // 3. Template Management
        console.log('3️⃣ Navigating to Template Management...');
        await page.goto('http://localhost:3000/templates.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(2000);
        await captureScreen('05-templates', 'Template Management - Custom Extraction Rules');
        
        // Click on a template if available
        const templateCard = await page.$('.template-card');
        if (templateCard) {
            await templateCard.click();
            await page.waitForTimeout(1000);
            await captureScreen('06-template-detail', 'Template Management - Template Editor');
        }
        
        // 4. Analytics Dashboard
        console.log('4️⃣ Navigating to Analytics Dashboard...');
        await page.goto('http://localhost:3000/analytics.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(3000); // Extra time for charts to render
        await captureScreen('07-analytics', 'Analytics Dashboard - Performance Metrics');
        
        // 5. Test File Upload Process
        console.log('5️⃣ Testing File Upload Process...');
        await page.goto('http://localhost:3000/dashboard.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(1000);
        
        // Create a test PDF file input
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
            console.log('   File input found - ready for upload');
            await captureScreen('08-upload-ready', 'Dashboard - Upload Interface Ready');
        }
        
        // 6. API Health Check
        console.log('6️⃣ Checking API Endpoints...');
        const apiResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('http://localhost:3000/api/health');
                return await response.json();
            } catch (err) {
                return { error: err.message };
            }
        });
        console.log('   API Health:', apiResponse);
        
        // 7. Navigation Menu Test
        console.log('7️⃣ Testing Navigation Menu...');
        await page.goto('http://localhost:3000/dashboard.html', { waitUntil: 'networkidle2' });
        
        // Test hamburger menu on mobile view
        await page.setViewport({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        await captureScreen('09-mobile-view', 'Responsive Design - Mobile View');
        
        const menuToggle = await page.$('.menu-toggle');
        if (menuToggle) {
            await menuToggle.click();
            await page.waitForTimeout(500);
            await captureScreen('10-mobile-menu', 'Responsive Design - Mobile Menu');
        }
        
        // Reset to desktop view
        await page.setViewport({ width: 1920, height: 1080 });
        
        // 8. Final Overview
        console.log('8️⃣ Final Platform Overview...');
        await page.goto('http://localhost:3000/dashboard.html', { waitUntil: 'networkidle2' });
        await page.waitForTimeout(1000);
        
        // Scroll to show different sections
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
        await page.waitForTimeout(500);
        await captureScreen('11-dashboard-features', 'Dashboard - Feature Overview');
        
        console.log('\n✅ Platform Demonstration Complete!');
        console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
        console.log('\n📊 Platform Features Demonstrated:');
        console.log('   ✓ Enterprise Dashboard');
        console.log('   ✓ Document History & Search');
        console.log('   ✓ Template Management');
        console.log('   ✓ Analytics & Metrics');
        console.log('   ✓ File Upload Interface');
        console.log('   ✓ Responsive Design');
        console.log('   ✓ API Integration');
        
    } catch (error) {
        console.error('❌ Error during demonstration:', error);
    } finally {
        console.log('\n🔄 Keeping browser open for 30 seconds for manual inspection...');
        await page.waitForTimeout(30000);
        await browser.close();
        console.log('👋 Browser closed. Demo complete!');
    }
}

// Run the demonstration
demonstratePlatform().catch(console.error);