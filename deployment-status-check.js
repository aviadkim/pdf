#!/usr/bin/env node

/**
 * DEPLOYMENT STATUS CHECK
 * 
 * Quick check to see if the latest deployment with PDF fixes is active
 */

const axios = require('axios');

async function checkDeploymentStatus() {
    console.log('🔍 CHECKING DEPLOYMENT STATUS');
    console.log('==============================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    
    try {
        // Test 1: Check if service is responding
        console.log('1️⃣ Testing service response...');
        const response = await axios.get(baseUrl);
        console.log(`✅ Service responding: ${response.status}`);
        
        // Test 2: Check for comprehensive system indicators
        console.log('2️⃣ Checking for comprehensive system...');
        const content = response.data;
        
        const hasSystemCapabilities = content.includes('system-capabilities');
        const hasMistralOCR = content.includes('mistral-ocr');
        const hasRobustProcessor = content.includes('robust') || content.includes('ROBUST');
        const hasGraphicsMagick = content.includes('GraphicsMagick') || content.includes('gm');
        
        console.log(`   System capabilities mentioned: ${hasSystemCapabilities ? '✅' : '❌'}`);
        console.log(`   Mistral OCR mentioned: ${hasMistralOCR ? '✅' : '❌'}`);
        console.log(`   Robust processor: ${hasRobustProcessor ? '✅' : '❌'}`);
        console.log(`   GraphicsMagick: ${hasGraphicsMagick ? '✅' : '❌'}`);
        
        // Test 3: Check API endpoints
        console.log('3️⃣ Testing API endpoints...');
        const endpoints = [
            '/api/system-capabilities',
            '/api/mistral-ocr-extract',
            '/api/ultra-accurate-extract'
        ];
        
        for (const endpoint of endpoints) {
            try {
                await axios.get(`${baseUrl}${endpoint}`);
                console.log(`   ✅ ${endpoint}: Available`);
            } catch (error) {
                const status = error.response?.status || 'No Response';
                if (status === 405) {
                    console.log(`   ✅ ${endpoint}: Available (405 Method Not Allowed - expected for POST endpoints)`);
                } else if (status === 404) {
                    console.log(`   ❌ ${endpoint}: Not found (404)`);
                } else {
                    console.log(`   ⚠️  ${endpoint}: ${status}`);
                }
            }
        }
        
        // Test 4: Check if latest deployment is active
        console.log('4️⃣ Checking deployment version...');
        if (!hasSystemCapabilities && !hasMistralOCR) {
            console.log('❌ ISSUE: Service appears to be running an older version');
            console.log('   The comprehensive system with API endpoints is not active');
            console.log('   This suggests the deployment may not have completed or failed');
        } else {
            console.log('✅ Service appears to be running the comprehensive system');
        }
        
        return {
            responding: true,
            hasSystemCapabilities,
            hasMistralOCR,
            hasRobustProcessor,
            hasGraphicsMagick,
            deploymentStatus: hasSystemCapabilities && hasMistralOCR ? 'current' : 'outdated'
        };
        
    } catch (error) {
        console.error('❌ Service check failed:', error.message);
        return {
            responding: false,
            error: error.message,
            deploymentStatus: 'unknown'
        };
    }
}

async function main() {
    const status = await checkDeploymentStatus();
    
    console.log('\n📊 DEPLOYMENT STATUS SUMMARY');
    console.log('=============================');
    console.log(`🌐 Service Status: ${status.responding ? 'RESPONDING' : 'NOT RESPONDING'}`);
    console.log(`📦 Deployment Status: ${status.deploymentStatus?.toUpperCase() || 'UNKNOWN'}`);
    
    if (status.deploymentStatus === 'outdated') {
        console.log('\n⚠️  DEPLOYMENT ISSUE DETECTED');
        console.log('============================');
        console.log('The service is running but appears to be an older version.');
        console.log('The latest fixes for PDF processing may not be active.');
        console.log('');
        console.log('🔧 RECOMMENDED ACTIONS:');
        console.log('1. Check Render dashboard for deployment status');
        console.log('2. Look for any build/deployment errors');
        console.log('3. Consider manual redeploy if needed');
        console.log('4. Verify environment variables are set');
    } else if (status.deploymentStatus === 'current') {
        console.log('\n✅ DEPLOYMENT APPEARS CURRENT');
        console.log('==============================');
        console.log('The service appears to be running the latest version.');
        console.log('API endpoint issues may be due to other factors.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { checkDeploymentStatus };
