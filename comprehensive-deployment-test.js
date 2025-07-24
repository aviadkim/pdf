#!/usr/bin/env node

/**
 * Comprehensive Deployment Test
 * Tests all endpoints and provides detailed deployment status
 */

const axios = require('axios');

async function testAllEndpoints() {
    console.log('🚀 COMPREHENSIVE DEPLOYMENT TEST');
    console.log('=================================');
    
    const baseUrl = 'https://pdf-fzzi.onrender.com';
    const results = {
        working: [],
        failing: [],
        serverStatus: 'unknown'
    };
    
    // Test endpoints to check
    const endpoints = [
        { path: '/', method: 'GET', name: 'Homepage' },
        { path: '/api/system-capabilities', method: 'GET', name: 'System Capabilities' },
        { path: '/api/mistral-ocr-extract', method: 'GET', name: 'Mistral OCR (GET)' },
        { path: '/api/mistral-ocr-extract', method: 'POST', name: 'Mistral OCR (POST)' },
        { path: '/api/ultra-accurate-extract', method: 'GET', name: 'Ultra Accurate (GET)' },
        { path: '/api/phase2-enhanced-extract', method: 'GET', name: 'Phase2 Enhanced (GET)' },
        { path: '/smart-annotation', method: 'GET', name: 'Smart Annotation Interface' }
    ];
    
    console.log(`\n📡 Testing ${endpoints.length} endpoints...\n`);
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint.name}...`);
            
            let response;
            if (endpoint.method === 'GET') {
                response = await axios.get(`${baseUrl}${endpoint.path}`, { timeout: 10000 });
            } else {
                response = await axios.post(`${baseUrl}${endpoint.path}`, {}, { timeout: 10000 });
            }
            
            console.log(`✅ ${endpoint.name}: ${response.status}`);
            results.working.push({
                name: endpoint.name,
                path: endpoint.path,
                method: endpoint.method,
                status: response.status
            });
            
        } catch (error) {
            const status = error.response?.status || 'No Response';
            const message = error.response?.data || error.message;
            
            console.log(`❌ ${endpoint.name}: ${status}`);
            results.failing.push({
                name: endpoint.name,
                path: endpoint.path,
                method: endpoint.method,
                status: status,
                error: typeof message === 'string' ? message.substring(0, 100) : JSON.stringify(message).substring(0, 100)
            });
        }
    }
    
    // Test server responsiveness
    try {
        const startTime = Date.now();
        const response = await axios.get(baseUrl, { timeout: 5000 });
        const responseTime = Date.now() - startTime;
        
        results.serverStatus = 'responsive';
        results.responseTime = responseTime;
        
        console.log(`\n🌐 Server Status: RESPONSIVE (${responseTime}ms)`);
        
    } catch (error) {
        results.serverStatus = 'unresponsive';
        console.log('\n🌐 Server Status: UNRESPONSIVE');
    }
    
    // Summary
    console.log('\n📊 DEPLOYMENT TEST SUMMARY');
    console.log('===========================');
    console.log(`✅ Working Endpoints: ${results.working.length}`);
    console.log(`❌ Failing Endpoints: ${results.failing.length}`);
    console.log(`🌐 Server Status: ${results.serverStatus.toUpperCase()}`);
    
    if (results.working.length > 0) {
        console.log('\n✅ WORKING ENDPOINTS:');
        results.working.forEach(ep => {
            console.log(`   ${ep.name}: ${ep.method} ${ep.path} (${ep.status})`);
        });
    }
    
    if (results.failing.length > 0) {
        console.log('\n❌ FAILING ENDPOINTS:');
        results.failing.forEach(ep => {
            console.log(`   ${ep.name}: ${ep.method} ${ep.path} (${ep.status})`);
            if (ep.error) {
                console.log(`      Error: ${ep.error}`);
            }
        });
    }
    
    // Diagnosis
    console.log('\n🔍 DIAGNOSIS:');
    if (results.serverStatus === 'responsive' && results.working.length > 0) {
        if (results.failing.length === 0) {
            console.log('🎉 ALL SYSTEMS OPERATIONAL - Deployment successful!');
        } else {
            console.log('⚠️  PARTIAL DEPLOYMENT - Some endpoints not working');
            console.log('   This could indicate:');
            console.log('   - Deployment still in progress');
            console.log('   - Import/dependency issues');
            console.log('   - Route registration problems');
        }
    } else {
        console.log('❌ DEPLOYMENT ISSUES - Server not responding properly');
    }
    
    return results;
}

if (require.main === module) {
    testAllEndpoints().catch(console.error);
}

module.exports = { testAllEndpoints };
