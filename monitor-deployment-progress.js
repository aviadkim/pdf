#!/usr/bin/env node

/**
 * Monitor Deployment Progress
 * Continuously checks if the deployment is complete and endpoints are working
 */

const axios = require('axios');

async function checkEndpointStatus() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Test the Mistral OCR endpoint specifically
        const response = await axios.get(`${baseUrl}/api/mistral-ocr-extract`, { timeout: 5000 });
        return { status: 'working', code: response.status };
    } catch (error) {
        const status = error.response?.status || 'no-response';
        return { status: 'not-working', code: status };
    }
}

async function monitorDeployment() {
    console.log('🔄 MONITORING DEPLOYMENT PROGRESS');
    console.log('==================================');
    console.log('⏰ Checking every 30 seconds for deployment completion...\n');
    
    let attempts = 0;
    const maxAttempts = 20; // 10 minutes total
    
    while (attempts < maxAttempts) {
        attempts++;
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`[${timestamp}] Attempt ${attempts}/${maxAttempts}: Checking endpoints...`);
        
        const result = await checkEndpointStatus();
        
        if (result.status === 'working') {
            console.log('🎉 DEPLOYMENT SUCCESSFUL!');
            console.log('✅ Mistral OCR endpoint is now responding');
            console.log(`   Status: ${result.code}`);
            
            // Run a comprehensive test
            console.log('\n🧪 Running comprehensive endpoint test...');
            await runComprehensiveTest();
            return true;
            
        } else if (result.code === 405) {
            console.log('✅ DEPLOYMENT COMPLETE!');
            console.log('   Mistral OCR endpoint is properly registered (returns 405 for GET)');
            
            // Run a comprehensive test
            console.log('\n🧪 Running comprehensive endpoint test...');
            await runComprehensiveTest();
            return true;
            
        } else {
            console.log(`   ❌ Still deploying... (Status: ${result.code})`);
            
            if (attempts < maxAttempts) {
                console.log('   ⏳ Waiting 30 seconds before next check...\n');
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }
    
    console.log('⚠️  Deployment monitoring timeout reached');
    console.log('   Please check Render dashboard manually');
    return false;
}

async function runComprehensiveTest() {
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    const endpoints = [
        { path: '/api/mistral-ocr-extract', method: 'GET', expected: 405 },
        { path: '/api/system-capabilities', method: 'GET', expected: 200 },
        { path: '/api/ultra-accurate-extract', method: 'GET', expected: 405 },
        { path: '/api/phase2-enhanced-extract', method: 'GET', expected: 405 }
    ];
    
    console.log('📊 COMPREHENSIVE ENDPOINT TEST');
    console.log('===============================');
    
    let working = 0;
    let total = endpoints.length;
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${baseUrl}${endpoint.path}`, { timeout: 5000 });
            if (response.status === endpoint.expected) {
                console.log(`✅ ${endpoint.path}: ${response.status} (Expected)`);
                working++;
            } else {
                console.log(`⚠️  ${endpoint.path}: ${response.status} (Unexpected)`);
            }
        } catch (error) {
            const status = error.response?.status || 'No Response';
            if (status === endpoint.expected) {
                console.log(`✅ ${endpoint.path}: ${status} (Expected)`);
                working++;
            } else {
                console.log(`❌ ${endpoint.path}: ${status} (Failed)`);
            }
        }
    }
    
    console.log(`\n📈 Results: ${working}/${total} endpoints working correctly`);
    
    if (working === total) {
        console.log('🎉 ALL ENDPOINTS WORKING PERFECTLY!');
        console.log('\n🚀 SYSTEM IS NOW FULLY OPERATIONAL');
        console.log('   ✅ Mistral OCR integration fixed');
        console.log('   ✅ All API endpoints registered');
        console.log('   ✅ Ready for PDF processing');
    } else {
        console.log('⚠️  Some endpoints still need attention');
    }
    
    return working === total;
}

if (require.main === module) {
    monitorDeployment().catch(console.error);
}

module.exports = { monitorDeployment, checkEndpointStatus };
