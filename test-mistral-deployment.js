#!/usr/bin/env node

const fetch = require('node-fetch');

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://pdf-fzzi.onrender.com';
const TEST_TIMEOUT = 30000; // 30 seconds

console.log('🚀 Mistral OCR Deployment Test Suite');
console.log('====================================\n');
console.log(`📍 Testing deployment at: ${DEPLOYMENT_URL}`);
console.log(`⏱️  Timeout: ${TEST_TIMEOUT / 1000} seconds\n`);

// Test results tracking
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to run a test
async function runTest(name, testFn) {
    console.log(`\n🧪 ${name}...`);
    const startTime = Date.now();
    
    try {
        await testFn();
        const duration = Date.now() - startTime;
        console.log(`✅ PASSED (${duration}ms)`);
        results.passed++;
        results.tests.push({ name, status: 'passed', duration });
    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`❌ FAILED (${duration}ms)`);
        console.log(`   Error: ${error.message}`);
        results.failed++;
        results.tests.push({ name, status: 'failed', duration, error: error.message });
    }
}

// Test 1: Check if server is up
async function testServerHealth() {
    const response = await fetch(`${DEPLOYMENT_URL}/`, { timeout: TEST_TIMEOUT });
    if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
    }
}

// Test 2: Check Mistral OCR endpoint exists
async function testMistralEndpoint() {
    const response = await fetch(`${DEPLOYMENT_URL}/api/mistral-ocr-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        timeout: TEST_TIMEOUT
    });
    
    // We expect an error about missing file, not 404
    if (response.status === 404) {
        throw new Error('Mistral OCR endpoint not found');
    }
}

// Test 3: Check environment configuration
async function testEnvironmentConfig() {
    const response = await fetch(`${DEPLOYMENT_URL}/api/smart-ocr/stats`, {
        timeout: TEST_TIMEOUT
    });
    
    if (!response.ok) {
        throw new Error(`Stats endpoint returned ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`   📊 Mistral enabled: ${data.mistralEnabled}`);
    console.log(`   📊 Environment: ${data.environment || 'Not specified'}`);
    
    if (!data.mistralEnabled) {
        throw new Error('Mistral is not enabled - check MISTRAL_API_KEY environment variable');
    }
}

// Test 4: Test actual PDF processing with Mistral
async function testMistralProcessing() {
    // Create a simple test PDF content
    const testPdfBase64 = 'JVBERi0xLjQKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA0IDAgUgo+Pgo+PgovQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgoxMDAgNzAwIFRkCihUZXN0IE1pc3RyYWwgT0NSKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxNTcgMDAwMDAgbiAKMDAwMDAwMDI3MiAwMDAwMCBuIAowMDAwMDAwMzU4IDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDUzCiUlRU9G';
    
    const formData = new FormData();
    formData.append('pdf', Buffer.from(testPdfBase64, 'base64'), 'test.pdf');
    
    const response = await fetch(`${DEPLOYMENT_URL}/api/mistral-ocr-extract`, {
        method: 'POST',
        body: formData,
        timeout: TEST_TIMEOUT
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mistral processing failed: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`   📄 Extracted text length: ${data.extractedText?.length || 0}`);
    console.log(`   🔮 Used Mistral: ${data.metadata?.method === 'mistral'}`);
}

// Test 5: Check API key configuration warning
async function testApiKeyWarning() {
    console.log(`   ⚠️  Note: If Mistral is not enabled, ensure MISTRAL_API_KEY is set in Render environment`);
    console.log(`   📝 To set it in Render:`);
    console.log(`      1. Go to your service dashboard`);
    console.log(`      2. Navigate to Environment > Environment Variables`);
    console.log(`      3. Add MISTRAL_API_KEY with your actual key`);
    console.log(`      4. Deploy the service again`);
}

// Run all tests
async function runAllTests() {
    console.log('Starting tests...\n');
    
    await runTest('Server Health Check', testServerHealth);
    await runTest('Mistral OCR Endpoint', testMistralEndpoint);
    await runTest('Environment Configuration', testEnvironmentConfig);
    
    // Only run processing test if Mistral is enabled
    if (results.tests.find(t => t.name === 'Environment Configuration')?.status === 'passed') {
        await runTest('Mistral PDF Processing', testMistralProcessing);
    }
    
    await runTest('API Key Configuration Info', testApiKeyWarning);
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Summary:');
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   📝 Total: ${results.tests.length}`);
    
    // Write results to file
    const fs = require('fs');
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultFile = `mistral-deployment-test-${timestamp}.json`;
    
    fs.writeFileSync(resultFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        deploymentUrl: DEPLOYMENT_URL,
        summary: {
            passed: results.passed,
            failed: results.failed,
            total: results.tests.length
        },
        tests: results.tests
    }, null, 2));
    
    console.log(`\n📄 Results saved to: ${resultFile}`);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Error handling
process.on('unhandledRejection', (error) => {
    console.error('\n❌ Unhandled error:', error);
    process.exit(1);
});

// Run tests
runAllTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});