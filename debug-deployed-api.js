// 🔍 DEBUG DEPLOYED API - Check what endpoints are available
import fetch from 'node-fetch';

const VERCEL_URL = 'https://pdf-main-c4y6onuiz-aviads-projects-0f56b7ac.vercel.app';

async function debugDeployedAPI() {
  console.log('🔍 DEBUGGING DEPLOYED API');
  console.log('=========================\n');

  // Test different endpoints
  const endpoints = [
    '/api/test',
    '/api/public-extract',
    '/api/extract',
    '/api/health'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📋 Testing: ${endpoint}`);
      console.log('=' + '='.repeat(endpoint.length + 9));
      
      const response = await fetch(`${VERCEL_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Debug-Test/1.0',
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 200)}...`);
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('');
  }

  // Test OPTIONS requests
  console.log('📋 Testing OPTIONS requests');
  console.log('===========================');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/extract`, {
      method: 'OPTIONS',
      headers: {
        'User-Agent': 'Debug-Test/1.0'
      }
    });
    
    console.log(`OPTIONS Status: ${response.status}`);
    console.log(`CORS Headers: ${response.headers.get('access-control-allow-origin')}`);
    console.log(`Methods: ${response.headers.get('access-control-allow-methods')}`);
    
  } catch (error) {
    console.log(`❌ OPTIONS Error: ${error.message}`);
  }
}

debugDeployedAPI().catch(console.error);