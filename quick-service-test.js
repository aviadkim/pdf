#!/usr/bin/env node

const fetch = require('node-fetch');

const DEPLOYMENT_URL = 'https://pdf-fzzi.onrender.com';

console.log('🔍 Quick Service Test - Checking Available Endpoints');
console.log('===================================================\n');

async function testEndpoint(url, method = 'GET') {
    try {
        const response = await fetch(url, { 
            method,
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        console.log(`${method} ${url}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const text = await response.text();
            if (text.length > 0) {
                console.log(`   Content preview: ${text.substring(0, 100)}...`);
            }
        }
        
        return response.status;
    } catch (error) {
        console.log(`${method} ${url}: ERROR - ${error.message}`);
        return 0;
    }
}

async function runQuickTests() {
    console.log('Testing key endpoints...\n');
    
    const endpoints = [
        { url: `${DEPLOYMENT_URL}/`, method: 'GET' },
        { url: `${DEPLOYMENT_URL}/smart-annotation`, method: 'GET' },
        { url: `${DEPLOYMENT_URL}/api/smart-ocr/stats`, method: 'GET' },
        { url: `${DEPLOYMENT_URL}/api/smart-ocr/patterns`, method: 'GET' },
        { url: `${DEPLOYMENT_URL}/api/mistral-ocr-extract`, method: 'GET' },
        { url: `${DEPLOYMENT_URL}/api/smart-ocr/process`, method: 'GET' },
        { url: `${DEPLOYMENT_URL}/api/smart-ocr/learn`, method: 'GET' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
        results[endpoint.url] = await testEndpoint(endpoint.url, endpoint.method);
        console.log(''); // Add spacing
    }
    
    console.log('Summary:');
    Object.entries(results).forEach(([url, status]) => {
        const statusText = status === 200 ? '✅ OK' : 
                          status === 404 ? '❌ NOT FOUND' :
                          status === 0 ? '💥 ERROR' : `⚠️  ${status}`;
        console.log(`   ${statusText} - ${url}`);
    });
    
    return results;
}

runQuickTests().catch(console.error);