#!/usr/bin/env node

/**
 * 🔍 RENDER DEPLOYMENT VERIFICATION
 * Tests all endpoints to determine deployment status
 */

const https = require('https');
const fs = require('fs');

console.log('🚀 RENDER DEPLOYMENT VERIFICATION');
console.log('=================================\n');

// Test endpoints
const endpoints = [
    { name: 'Main Page', url: 'https://pdf-fzzi.onrender.com/', expected: 200 },
    { name: 'Smart OCR Health', url: 'https://pdf-fzzi.onrender.com/api/smart-ocr-test', expected: 200 },
    { name: 'Smart Annotation', url: 'https://pdf-fzzi.onrender.com/smart-annotation', expected: 200 },
    { name: 'Smart OCR Stats', url: 'https://pdf-fzzi.onrender.com/api/smart-ocr-stats', expected: 200 },
    { name: 'Smart OCR Patterns', url: 'https://pdf-fzzi.onrender.com/api/smart-ocr-patterns', expected: 200 },
    { name: 'Old Bulletproof', url: 'https://pdf-fzzi.onrender.com/api/bulletproof-processor', expected: 404 }
];

let results = [];

function testEndpoint(endpoint, index) {
    return new Promise((resolve) => {
        const req = https.get(endpoint.url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = {
                    name: endpoint.name,
                    url: endpoint.url,
                    status: res.statusCode,
                    expected: endpoint.expected,
                    success: res.statusCode === endpoint.expected,
                    responseTime: Date.now() - startTime,
                    contentPreview: data.substring(0, 100).replace(/\n/g, ' ')
                };
                results.push(result);
                
                const icon = result.success ? '✅' : '❌';
                console.log(`${icon} ${result.name}: ${result.status} (${result.responseTime}ms)`);
                if (result.contentPreview) {
                    console.log(`   Preview: ${result.contentPreview}...`);
                }
                resolve(result);
            });
        });
        
        const startTime = Date.now();
        req.on('error', (err) => {
            const result = {
                name: endpoint.name,
                url: endpoint.url,
                status: 'ERROR',
                expected: endpoint.expected,
                success: false,
                error: err.message
            };
            results.push(result);
            console.log(`❌ ${result.name}: ERROR - ${result.error}`);
            resolve(result);
        });
        
        req.on('timeout', () => {
            const result = {
                name: endpoint.name,
                url: endpoint.url,
                status: 'TIMEOUT',
                expected: endpoint.expected,
                success: false,
                error: 'Request timeout'
            };
            results.push(result);
            console.log(`⏱️ ${result.name}: TIMEOUT`);
            resolve(result);
        });
    });
}

async function runTests() {
    console.log('📊 TESTING ENDPOINTS');
    console.log('===================');
    
    for (let i = 0; i < endpoints.length; i++) {
        await testEndpoint(endpoints[i], i);
        if (i < endpoints.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n📋 DEPLOYMENT ANALYSIS');
    console.log('======================');
    
    const smartOcrEndpoints = results.filter(r => r.name.includes('Smart'));
    const successfulSmartOcr = smartOcrEndpoints.filter(r => r.success);
    
    if (successfulSmartOcr.length > 0) {
        console.log('✅ SMART OCR SYSTEM DETECTED');
        console.log('🎯 Deployment successful! Smart OCR system is running.');
        console.log('🔗 Main interfaces:');
        console.log('   - Smart Annotation: https://pdf-fzzi.onrender.com/smart-annotation');
        console.log('   - Health Check: https://pdf-fzzi.onrender.com/api/smart-ocr-test');
    } else {
        console.log('❌ SMART OCR SYSTEM NOT DETECTED');
        console.log('🔍 Diagnosis:');
        
        const mainPage = results.find(r => r.name === 'Main Page');
        if (mainPage && mainPage.contentPreview.includes('Vercel')) {
            console.log('   → Old Vercel build still running');
            console.log('   → Dockerfile update may not have taken effect');
        } else if (mainPage && mainPage.status === 200) {
            console.log('   → Service is running but wrong configuration');
        } else {
            console.log('   → Service may be down or building');
        }
        
        console.log('\n💡 RECOMMENDED ACTIONS:');
        console.log('1. Check Render dashboard for build logs');
        console.log('2. Verify Dockerfile path is set to: ./Dockerfile.smart-ocr');
        console.log('3. Ensure environment variables are set:');
        console.log('   - MISTRAL_API_KEY');
        console.log('   - NODE_ENV=production');
        console.log('   - PORT=10002');
        console.log('4. Force a new deployment if needed');
    }
    
    console.log('\n🔄 CONTINUOUS MONITORING');
    console.log('========================');
    console.log('Run this script again in 2-3 minutes to check deployment progress.');
}

runTests().catch(console.error);