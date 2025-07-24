/**
 * CHECK HOMEPAGE CONTENT
 * Verify what HTML is being served
 */

const fetch = require('node-fetch');

async function checkHomepageContent() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    console.log('🔍 Checking homepage HTML content...\n');
    
    try {
        const response = await fetch(baseUrl);
        const html = await response.text();
        
        // Check for key elements
        console.log('✅ Version indicator found:', html.includes('Direct PDF parsing bypass enabled (v2.1)'));
        console.log('✅ Drop zone found:', html.includes('drop-zone'));
        console.log('✅ Drag text found:', html.includes('Drag and drop your PDF'));
        console.log('✅ File input found:', html.includes('file-input'));
        console.log('✅ Script tag found:', html.includes('addEventListener'));
        
        // Extract the form section
        const formStart = html.indexOf('<form');
        const formEnd = html.indexOf('</form>') + 7;
        
        if (formStart !== -1 && formEnd !== -1) {
            console.log('\n📄 Form section:');
            console.log(html.substring(formStart - 200, formEnd).substring(0, 500) + '...');
        }
        
        // Save full HTML for inspection
        const fs = require('fs').promises;
        await fs.writeFile('homepage-content.html', html);
        console.log('\n💾 Full HTML saved to homepage-content.html');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkHomepageContent();