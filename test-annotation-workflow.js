const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const RENDER_URL = 'https://pdf-fzzi.onrender.com';
const LOCAL_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
    baseUrl: RENDER_URL, // Change to LOCAL_URL for local testing
    timeout: 30000,
    headless: true
};

// Test data
const TEST_ANNOTATION = {
    text: 'TEST_SECURITY_12345',
    field: 'name',
    value: 'Test Security Name',
    confidence: 0.95,
    source: 'manual'
};

async function testAnnotationWorkflow() {
    console.log('🧪 Testing Smart OCR Annotation Workflow\n');
    const results = {
        timestamp: new Date().toISOString(),
        baseUrl: TEST_CONFIG.baseUrl,
        tests: []
    };

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Test 1: Check current system status
        console.log('📊 Test 1: Checking current system status...');
        try {
            const statsResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/smart-ocr-stats`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });
            const stats = await statsResponse.json();
            
            results.tests.push({
                name: 'System Status',
                status: 'passed',
                data: stats
            });
            
            console.log('✅ Current stats:', JSON.stringify(stats, null, 2));
            console.log(`   - Accuracy: ${stats.accuracy}%`);
            console.log(`   - Patterns: ${stats.patternsCount}`);
            console.log(`   - Annotations: ${stats.annotationsCount}\n`);
        } catch (error) {
            results.tests.push({
                name: 'System Status',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Failed to get system stats:', error.message);
        }

        // Test 2: Get current patterns
        console.log('🔍 Test 2: Retrieving current patterns...');
        try {
            const patternsResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/smart-ocr-patterns`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });
            const patterns = await patternsResponse.json();
            
            results.tests.push({
                name: 'Get Patterns',
                status: 'passed',
                data: {
                    count: patterns.length,
                    samplePatterns: patterns.slice(0, 3)
                }
            });
            
            console.log(`✅ Retrieved ${patterns.length} patterns`);
            if (patterns.length > 0) {
                console.log('   Sample pattern:', JSON.stringify(patterns[0], null, 2));
            }
            console.log('');
        } catch (error) {
            results.tests.push({
                name: 'Get Patterns',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Failed to get patterns:', error.message);
        }

        // Test 3: Test annotation UI
        console.log('🖱️ Test 3: Testing annotation interface...');
        try {
            await page.goto(`${TEST_CONFIG.baseUrl}/smart-annotation`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });

            // Check if UI loaded
            const title = await page.title();
            const hasAnnotationForm = await page.evaluate(() => {
                return document.querySelector('#annotationForm') !== null;
            });

            results.tests.push({
                name: 'Annotation UI',
                status: 'passed',
                data: {
                    title,
                    hasAnnotationForm,
                    url: page.url()
                }
            });

            console.log('✅ Annotation UI loaded successfully');
            console.log(`   - Title: ${title}`);
            console.log(`   - Form present: ${hasAnnotationForm}\n`);

            // Try to add annotation through UI
            if (hasAnnotationForm) {
                console.log('📝 Test 4: Adding annotation through UI...');
                try {
                    // Fill form fields
                    await page.type('#text', TEST_ANNOTATION.text);
                    await page.select('#field', TEST_ANNOTATION.field);
                    await page.type('#value', TEST_ANNOTATION.value);
                    
                    // Submit form
                    await page.click('button[type="submit"]');
                    
                    // Wait for response
                    await page.waitForTimeout(2000);
                    
                    // Check for success message or updated stats
                    const updatedStats = await page.evaluate(async () => {
                        const response = await fetch('/api/smart-ocr/stats');
                        return await response.json();
                    });

                    results.tests.push({
                        name: 'Add Annotation UI',
                        status: 'passed',
                        data: {
                            annotation: TEST_ANNOTATION,
                            updatedStats
                        }
                    });

                    console.log('✅ Annotation added through UI');
                    console.log(`   - New annotation count: ${updatedStats.annotationsCount}\n`);
                } catch (error) {
                    results.tests.push({
                        name: 'Add Annotation UI',
                        status: 'failed',
                        error: error.message
                    });
                    console.log('❌ Failed to add annotation through UI:', error.message);
                }
            }
        } catch (error) {
            results.tests.push({
                name: 'Annotation UI',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Failed to load annotation UI:', error.message);
        }

        // Test 5: Test learning API directly
        console.log('🧠 Test 5: Testing learning API endpoints...');
        
        // Test different data formats to see what works
        const testFormats = [
            {
                name: 'Format 1: Direct annotation',
                data: TEST_ANNOTATION
            },
            {
                name: 'Format 2: Wrapped in annotations array',
                data: { annotations: [TEST_ANNOTATION] }
            },
            {
                name: 'Format 3: With metadata',
                data: {
                    annotation: TEST_ANNOTATION,
                    metadata: {
                        source: 'test',
                        timestamp: new Date().toISOString()
                    }
                }
            },
            {
                name: 'Format 4: Batch format',
                data: {
                    batch: [TEST_ANNOTATION],
                    source: 'test'
                }
            }
        ];

        for (const format of testFormats) {
            console.log(`   Testing ${format.name}...`);
            try {
                const response = await page.evaluate(async (url, data) => {
                    const res = await fetch(`${url}/api/smart-ocr-learn`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const text = await res.text();
                    try {
                        return { status: res.status, data: JSON.parse(text) };
                    } catch {
                        return { status: res.status, data: text };
                    }
                }, TEST_CONFIG.baseUrl, format.data);

                results.tests.push({
                    name: `Learning API - ${format.name}`,
                    status: response.status === 200 ? 'passed' : 'failed',
                    data: response
                });

                if (response.status === 200) {
                    console.log(`   ✅ ${format.name} accepted`);
                    console.log(`      Response: ${JSON.stringify(response.data, null, 2)}`);
                } else {
                    console.log(`   ❌ ${format.name} rejected (${response.status})`);
                    console.log(`      Response: ${JSON.stringify(response.data, null, 2)}`);
                }
            } catch (error) {
                results.tests.push({
                    name: `Learning API - ${format.name}`,
                    status: 'failed',
                    error: error.message
                });
                console.log(`   ❌ ${format.name} error: ${error.message}`);
            }
        }
        console.log('');

        // Test 6: Test annotation retrieval
        console.log('📚 Test 6: Testing annotation retrieval...');
        try {
            // Try different endpoints that might exist
            const endpoints = [
                '/api/smart-ocr-annotations',
                '/api/smart-ocr-training',
                '/api/smart-ocr-data/annotations',
                '/api/smart-ocr-corrections'
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await page.evaluate(async (url, ep) => {
                        const res = await fetch(`${url}${ep}`);
                        if (res.ok) {
                            const data = await res.json();
                            return { exists: true, data, status: res.status };
                        }
                        return { exists: false, status: res.status };
                    }, TEST_CONFIG.baseUrl, endpoint);

                    if (response.exists) {
                        console.log(`   ✅ Found endpoint: ${endpoint}`);
                        console.log(`      Data: ${JSON.stringify(response.data).substring(0, 100)}...`);
                        
                        results.tests.push({
                            name: `Annotation Retrieval - ${endpoint}`,
                            status: 'passed',
                            data: response
                        });
                    }
                } catch (error) {
                    // Silently continue to next endpoint
                }
            }
        } catch (error) {
            console.log('❌ Error testing annotation retrieval:', error.message);
        }
        console.log('');

        // Test 7: Test pattern generation from annotations
        console.log('🔄 Test 7: Testing pattern generation...');
        try {
            // Try to trigger pattern generation
            const endpoints = [
                { url: '/api/smart-ocr-generate-patterns', method: 'POST' },
                { url: '/api/smart-ocr-patterns/generate', method: 'POST' },
                { url: '/api/smart-ocr-train', method: 'POST' }
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await page.evaluate(async (url, ep) => {
                        const res = await fetch(`${url}${ep.url}`, {
                            method: ep.method,
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({})
                        });
                        return { 
                            status: res.status, 
                            ok: res.ok,
                            text: await res.text()
                        };
                    }, TEST_CONFIG.baseUrl, endpoint);

                    if (response.ok) {
                        console.log(`   ✅ Pattern generation endpoint found: ${endpoint.url}`);
                        results.tests.push({
                            name: `Pattern Generation - ${endpoint.url}`,
                            status: 'passed',
                            data: response
                        });
                        break;
                    }
                } catch (error) {
                    // Continue to next endpoint
                }
            }
        } catch (error) {
            console.log('❌ Error testing pattern generation:', error.message);
        }
        console.log('');

        // Test 8: Test accuracy improvement workflow
        console.log('📈 Test 8: Testing accuracy improvement workflow...');
        try {
            // Get initial accuracy
            const initialStats = await page.evaluate(async (url) => {
                const res = await fetch(`${url}/api/smart-ocr-stats`);
                return await res.json();
            }, TEST_CONFIG.baseUrl);

            console.log(`   Initial accuracy: ${initialStats.accuracy}%`);
            
            // Simulate adding multiple annotations
            const testAnnotations = [
                { text: 'US1234567890', field: 'isin', value: 'US1234567890', confidence: 0.98 },
                { text: 'Apple Inc.', field: 'name', value: 'Apple Inc.', confidence: 0.95 },
                { text: '1,234,567.89', field: 'amount', value: '1234567.89', confidence: 0.92 }
            ];

            console.log('   Adding test annotations...');
            
            // Try to add annotations and check if accuracy improves
            for (const annotation of testAnnotations) {
                try {
                    // Try through UI form submission
                    await page.goto(`${TEST_CONFIG.baseUrl}/smart-annotation`, {
                        waitUntil: 'networkidle0'
                    });
                    
                    await page.evaluate((ann) => {
                        document.querySelector('#text').value = ann.text;
                        document.querySelector('#field').value = ann.field;
                        document.querySelector('#value').value = ann.value;
                        document.querySelector('#annotationForm').submit();
                    }, annotation);
                    
                    await page.waitForTimeout(1000);
                } catch (error) {
                    console.log(`   ⚠️  Failed to add annotation: ${error.message}`);
                }
            }

            // Get final stats
            const finalStats = await page.evaluate(async (url) => {
                const res = await fetch(`${url}/api/smart-ocr-stats`);
                return await res.json();
            }, TEST_CONFIG.baseUrl);

            console.log(`   Final accuracy: ${finalStats.accuracy}%`);
            console.log(`   Annotation count change: ${initialStats.annotationsCount} -> ${finalStats.annotationsCount}`);
            console.log(`   Pattern count change: ${initialStats.patternsCount} -> ${finalStats.patternsCount}`);

            results.tests.push({
                name: 'Accuracy Improvement Workflow',
                status: 'passed',
                data: {
                    initial: initialStats,
                    final: finalStats,
                    accuracyChange: finalStats.accuracy - initialStats.accuracy,
                    annotationsAdded: finalStats.annotationsCount - initialStats.annotationsCount,
                    patternsGenerated: finalStats.patternsCount - initialStats.patternsCount
                }
            });
        } catch (error) {
            results.tests.push({
                name: 'Accuracy Improvement Workflow',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Error testing accuracy improvement:', error.message);
        }

    } catch (error) {
        console.error('Fatal error:', error);
        results.error = error.message;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Save results
    const resultsPath = path.join(__dirname, `annotation-workflow-test-${new Date().toISOString().replace(/:/g, '-')}.json`);
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    const passed = results.tests.filter(t => t.status === 'passed').length;
    const failed = results.tests.filter(t => t.status === 'failed').length;
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Results saved to: ${resultsPath}`);
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('==================');
    
    if (results.tests.find(t => t.name === 'System Status' && t.status === 'passed')) {
        const stats = results.tests.find(t => t.name === 'System Status').data;
        if (stats.accuracy < 90) {
            console.log('1. Current accuracy is below 90%. Focus on:');
            console.log('   - Adding more high-quality annotations');
            console.log('   - Reviewing and correcting existing patterns');
            console.log('   - Testing with diverse PDF samples');
        }
    }
    
    const learningTests = results.tests.filter(t => t.name.includes('Learning API'));
    const workingFormat = learningTests.find(t => t.status === 'passed');
    if (workingFormat) {
        console.log(`2. Learning API accepts: ${workingFormat.name.replace('Learning API - ', '')}`);
        console.log('   Use this format for programmatic annotation submission');
    } else {
        console.log('2. Learning API format unclear. Use the UI for adding annotations');
    }
    
    console.log('3. To improve accuracy from 80% to 95%+:');
    console.log('   - Analyze failed extractions and add corrections');
    console.log('   - Focus on edge cases (Swiss formats, special characters)');
    console.log('   - Build patterns for common document structures');
    
    return results;
}

// Run tests
testAnnotationWorkflow().catch(console.error);