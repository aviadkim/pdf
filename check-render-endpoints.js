#!/usr/bin/env node

/**
 * Check Render Deployment Endpoints Status
 * Comprehensive test of all API endpoints on Render
 */

const https = require('https');

const RENDER_BASE_URL = 'https://pdf-fzzi.onrender.com';

const endpoints = [
    '/api/test',
    '/api/bulletproof-processor',
    '/api/ultra-accurate-extract',
    '/api/phase2-enhanced-extract', 
    '/api/mistral-ocr-extract',
    '/api/pdf-extract',
    '/api/smart-ocr-extract'
];

async function checkEndpoint(endpoint) {
    return new Promise((resolve) => {
        const url = `${RENDER_BASE_URL}${endpoint}`;
        
        console.log(`🔍 Testing: ${endpoint}`);
        
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const status = res.statusCode;
                const isWorking = status !== 404;
                
                console.log(`${isWorking ? '✅' : '❌'} ${endpoint}: ${status} ${res.statusMessage}`);
                
                if (status === 404) {
                    console.log(`   Response: ${data.substring(0, 100)}...`);
                }
                
                resolve({
                    endpoint,
                    status,
                    working: isWorking,
                    response: data.substring(0, 200)
                });
            });
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${endpoint}: ERROR - ${err.message}`);
            resolve({
                endpoint,
                status: 'ERROR',
                working: false,
                error: err.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            console.log(`⏰ ${endpoint}: TIMEOUT`);
            resolve({
                endpoint,
                status: 'TIMEOUT',
                working: false,
                error: 'Request timeout'
            });
        });
    });
}

async function main() {
    console.log('🚀 Checking Render Deployment Status');
    console.log(`📍 Base URL: ${RENDER_BASE_URL}`);
    console.log('=' .repeat(60));
    
    const results = [];
    
    for (const endpoint of endpoints) {
        const result = await checkEndpoint(endpoint);
        results.push(result);
        console.log(''); // Add spacing
    }
    
    console.log('📊 SUMMARY:');
    console.log('=' .repeat(60));
    
    const working = results.filter(r => r.working);
    const broken = results.filter(r => !r.working);
    
    console.log(`✅ Working endpoints: ${working.length}/${results.length}`);
    working.forEach(r => console.log(`   ${r.endpoint}`));
    
    console.log(`❌ Broken endpoints: ${broken.length}/${results.length}`);
    broken.forEach(r => console.log(`   ${r.endpoint} (${r.status})`));
    
    if (broken.length > 0) {
        console.log('\n🔧 DIAGNOSIS:');
        console.log('The missing endpoints suggest that:');
        console.log('1. Recent commits with new endpoints haven\'t been deployed to Render');
        console.log('2. Render might need a manual redeploy trigger');
        console.log('3. There could be import/dependency issues preventing startup');
        
        console.log('\n💡 SOLUTIONS:');
        console.log('1. Push a new commit to trigger auto-deploy');
        console.log('2. Manually redeploy via Render dashboard');
        console.log('3. Check Render deployment logs for errors');
    } else {
        console.log('\n🎉 All endpoints are working!');
    }
}

main().catch(console.error);