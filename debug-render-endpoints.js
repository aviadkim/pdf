/**
 * DEBUG RENDER ENDPOINTS
 * Find out exactly what system is running on Render
 */

const fetch = require('node-fetch');

async function debugRenderSystem() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    console.log('🔍 DEBUGGING RENDER SYSTEM ENDPOINTS');
    console.log('====================================\n');

    // Check what's actually running
    try {
        const response = await fetch(baseUrl);
        const html = await response.text();
        
        console.log('📄 HTML ANALYSIS:');
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Contains "Perfect Mistral": ${html.includes('Perfect Mistral')}`);
        console.log(`✅ Contains "Smart OCR": ${html.includes('Smart OCR')}`);
        console.log(`✅ Contains "Mistral": ${html.includes('Mistral')}`);
        console.log(`✅ Contains "express-server": ${html.includes('express-server')}`);
        
        // Extract system information
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
            console.log(`📋 Title: ${titleMatch[1]}`);
        }
        
    } catch (error) {
        console.log('❌ HTML check failed:', error.message);
    }
    
    console.log('\n🔗 TESTING SPECIFIC ENDPOINTS:');
    console.log('==============================');
    
    // Test all possible endpoints
    const endpoints = [
        // Perfect Mistral endpoints
        '/api/perfect-extraction',
        '/api/mistral-process',
        '/api/bulletproof-processor',
        
        // Express server endpoints
        '/api/pdf-extract',
        '/api/process-pdf',
        
        // Smart OCR endpoints
        '/api/smart-ocr-process',
        '/api/smart-ocr-stats',
        '/api/smart-ocr-patterns',
        
        // System endpoints
        '/api/system-info',
        '/api/health',
        '/api/status'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(baseUrl + endpoint, { 
                method: 'GET',
                timeout: 5000 
            });
            
            let result = `${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status}`;
            
            if (response.ok) {
                const text = await response.text();
                if (text.includes('mistral') || text.includes('Mistral')) {
                    result += ' (MISTRAL DETECTED)';
                }
                if (text.includes('express')) {
                    result += ' (EXPRESS DETECTED)';
                }
                if (text.length < 200) {
                    result += ` - ${text.substring(0, 100)}...`;
                }
            }
            
            console.log(result);
            
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
    
    console.log('\n🧪 TESTING PDF PROCESSING:');
    console.log('==========================');
    
    // Test which endpoint actually processes PDFs
    const processingEndpoints = [
        '/api/smart-ocr-process',
        '/api/pdf-extract', 
        '/api/process-pdf',
        '/api/mistral-process',
        '/api/perfect-extraction'
    ];
    
    for (const endpoint of processingEndpoints) {
        try {
            const response = await fetch(baseUrl + endpoint, { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'true' }),
                timeout: 5000 
            });
            
            console.log(`🧪 ${endpoint}: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const text = await response.text();
                console.log(`   Response: ${text.substring(0, 150)}...`);
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
    
    console.log('\n📝 ANALYSIS COMPLETE');
    console.log('===================');
    console.log('✅ HTML shows Perfect Mistral System');
    console.log('❌ But PDF processing still uses pdf-image-fallback');
    console.log('🎯 Need to find the correct Mistral processing endpoint');
}

debugRenderSystem();