/**
 * CHECK HOMEPAGE FOR VERSION INDICATOR
 */

const fetch = require('node-fetch');

async function checkHomepageVersion() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    console.log('🔍 CHECKING HOMEPAGE FOR VERSION INDICATOR');
    console.log('==========================================\n');
    
    try {
        const response = await fetch(baseUrl);
        const html = await response.text();
        
        console.log('📄 Searching for version indicators...\n');
        
        if (html.includes('Direct PDF parsing bypass enabled (v2.1)')) {
            console.log('✅ CONFIRMED: New version (v2.1) is live!');
            console.log('🎯 Direct PDF parsing bypass should be active\n');
        } else if (html.includes('Smart OCR')) {
            console.log('⚠️ Smart OCR system detected, but no version indicator');
            console.log('🔄 Changes may not have deployed yet\n');
        } else {
            console.log('❓ Unknown system detected\n');
        }
        
        // Look for specific text snippets
        const indicators = [
            'Direct PDF parsing bypass enabled',
            'Smart OCR',
            'Financial PDF Processing System',
            'v2.1'
        ];
        
        console.log('📝 Found indicators:');
        indicators.forEach(indicator => {
            if (html.includes(indicator)) {
                console.log(`  ✅ "${indicator}"`);
            } else {
                console.log(`  ❌ "${indicator}"`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error checking homepage:', error.message);
    }
}

checkHomepageVersion();