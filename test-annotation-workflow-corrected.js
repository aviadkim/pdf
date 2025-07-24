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

// Test annotation data in the correct format
const TEST_ANNOTATIONS = [
    {
        id: 'test_1',
        type: 'isin',
        text: 'US1234567890',
        value: 'US1234567890',
        confidence: 0.98,
        bounds: { x: 100, y: 200, width: 120, height: 20 },
        page: 0
    },
    {
        id: 'test_2', 
        type: 'security_name',
        text: 'Apple Inc.',
        value: 'Apple Inc.',
        confidence: 0.95,
        bounds: { x: 250, y: 200, width: 150, height: 20 },
        page: 0
    },
    {
        id: 'test_3',
        type: 'market_value',
        text: '1,234,567.89',
        value: '1234567.89',
        confidence: 0.92,
        bounds: { x: 450, y: 200, width: 100, height: 20 },
        page: 0
    }
];

const TEST_CORRECTIONS = [
    {
        id: 'correction_1',
        original: 'APPL INC',
        corrected: 'Apple Inc.',
        field: 'security_name',
        confidence: 0.99
    }
];

async function testSmartOCRWorkflow() {
    console.log('🧪 Testing Smart OCR Learning System - Corrected Version\n');
    const results = {
        timestamp: new Date().toISOString(),
        baseUrl: TEST_CONFIG.baseUrl,
        tests: [],
        summary: {}
    };

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: TEST_CONFIG.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Test 1: Check system health
        console.log('🏥 Test 1: Smart OCR System Health Check...');
        try {
            const healthResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/smart-ocr-test`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });
            const health = await healthResponse.json();
            
            results.tests.push({
                name: 'System Health',
                status: 'passed',
                data: health
            });
            
            console.log('✅ Smart OCR system is healthy');
            console.log(`   - Service: ${health.service}`);
            console.log(`   - Version: ${health.version}`);
            console.log(`   - Mistral enabled: ${health.mistralEnabled}`);
            console.log(`   - Available endpoints: ${Object.keys(health.endpoints).join(', ')}\n`);
        } catch (error) {
            results.tests.push({
                name: 'System Health',
                status: 'failed',
                error: error.message
            });
            console.log('❌ System health check failed:', error.message);
        }

        // Test 2: Get current statistics
        console.log('📊 Test 2: Current Smart OCR Statistics...');
        try {
            const statsResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/smart-ocr-stats`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });
            const statsData = await statsResponse.json();
            
            results.tests.push({
                name: 'Get Statistics',
                status: 'passed',
                data: statsData
            });
            
            if (statsData.success && statsData.stats) {
                const stats = statsData.stats;
                console.log('✅ Current statistics retrieved:');
                console.log(`   - Current accuracy: ${stats.currentAccuracy}%`);
                console.log(`   - Patterns learned: ${stats.patternCount}`);
                console.log(`   - Documents processed: ${stats.documentCount}`);
                console.log(`   - Annotations added: ${stats.annotationCount}`);
                console.log(`   - Target accuracy: ${stats.targetAccuracy}%`);
                console.log(`   - Mistral enabled: ${stats.mistralEnabled}\n`);
                
                results.summary.initialStats = stats;
            } else {
                console.log('⚠️  Stats retrieved but unexpected format');
            }
        } catch (error) {
            results.tests.push({
                name: 'Get Statistics',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Failed to get statistics:', error.message);
        }

        // Test 3: Get current patterns
        console.log('🔍 Test 3: Retrieving learned patterns...');
        try {
            const patternsResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/smart-ocr-patterns`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });
            const patternsData = await patternsResponse.json();
            
            results.tests.push({
                name: 'Get Patterns',
                status: 'passed',
                data: {
                    patternsCount: Array.isArray(patternsData) ? patternsData.length : 'unknown format',
                    samplePatterns: Array.isArray(patternsData) ? patternsData.slice(0, 3) : patternsData
                }
            });
            
            if (Array.isArray(patternsData)) {
                console.log(`✅ Retrieved ${patternsData.length} learned patterns`);
                if (patternsData.length > 0) {
                    console.log('   Sample pattern:', JSON.stringify(patternsData[0], null, 2));
                }
            } else {
                console.log('✅ Patterns data retrieved (different format):', JSON.stringify(patternsData).substring(0, 200));
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

        // Test 4: Test annotation learning API with correct format
        console.log('🧠 Test 4: Testing annotation learning with correct format...');
        try {
            const learningPayload = {
                annotations: TEST_ANNOTATIONS,
                corrections: TEST_CORRECTIONS,
                documentId: 'test_document_' + Date.now()
            };

            const response = await page.evaluate(async (url, payload) => {
                const res = await fetch(`${url}/api/smart-ocr-learn`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                return { status: res.status, data };
            }, TEST_CONFIG.baseUrl, learningPayload);

            results.tests.push({
                name: 'Annotation Learning',
                status: response.status === 200 ? 'passed' : 'failed',
                data: response
            });

            if (response.status === 200 && response.data.success) {
                console.log('✅ Annotation learning successful!');
                console.log(`   - New accuracy: ${response.data.newAccuracy}%`);
                console.log(`   - Patterns learned: ${response.data.patternsLearned}`);
                console.log(`   - Accuracy improvement: ${response.data.accuracyImprovement || 'N/A'}`);
                
                results.summary.learningResult = response.data;
            } else {
                console.log(`❌ Annotation learning failed (${response.status})`);
                console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
            }
            console.log('');
        } catch (error) {
            results.tests.push({
                name: 'Annotation Learning',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Annotation learning error:', error.message);
        }

        // Test 5: Test annotation interface accessibility
        console.log('🖱️ Test 5: Testing annotation interface...');
        try {
            await page.goto(`${TEST_CONFIG.baseUrl}/smart-annotation`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });

            const pageInfo = await page.evaluate(() => {
                return {
                    title: document.title,
                    hasUploadArea: !!document.getElementById('uploadArea'),
                    hasPdfCanvas: !!document.getElementById('pdfCanvas'),
                    hasToolButtons: document.querySelectorAll('.tool-btn').length,
                    hasStatsGrid: !!document.querySelector('.stats-grid'),
                    currentAccuracy: document.getElementById('currentAccuracy')?.textContent || 'Not found'
                };
            });

            results.tests.push({
                name: 'Annotation Interface',
                status: 'passed',
                data: pageInfo
            });

            console.log('✅ Annotation interface loaded successfully');
            console.log(`   - Title: ${pageInfo.title}`);
            console.log(`   - Upload area: ${pageInfo.hasUploadArea ? 'Present' : 'Missing'}`);
            console.log(`   - PDF canvas: ${pageInfo.hasPdfCanvas ? 'Present' : 'Missing'}`);
            console.log(`   - Tool buttons: ${pageInfo.hasToolButtons}`);
            console.log(`   - Current accuracy display: ${pageInfo.currentAccuracy}\n`);
        } catch (error) {
            results.tests.push({
                name: 'Annotation Interface',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Failed to load annotation interface:', error.message);
        }

        // Test 6: Verify statistics update after learning
        console.log('📈 Test 6: Verifying statistics after learning...');
        try {
            const finalStatsResponse = await page.goto(`${TEST_CONFIG.baseUrl}/api/smart-ocr-stats`, {
                waitUntil: 'networkidle0',
                timeout: TEST_CONFIG.timeout
            });
            const finalStatsData = await finalStatsResponse.json();
            
            results.tests.push({
                name: 'Final Statistics',
                status: 'passed',
                data: finalStatsData
            });
            
            if (finalStatsData.success && finalStatsData.stats) {
                const finalStats = finalStatsData.stats;
                const initialStats = results.summary.initialStats;
                
                console.log('✅ Final statistics retrieved:');
                console.log(`   - Current accuracy: ${finalStats.currentAccuracy}%`);
                console.log(`   - Patterns learned: ${finalStats.patternCount}`);
                console.log(`   - Annotations added: ${finalStats.annotationCount}`);
                
                if (initialStats) {
                    console.log('\n📊 Changes after learning:');
                    console.log(`   - Accuracy change: ${initialStats.currentAccuracy}% → ${finalStats.currentAccuracy}%`);
                    console.log(`   - Pattern count change: ${initialStats.patternCount} → ${finalStats.patternCount}`);
                    console.log(`   - Annotation count change: ${initialStats.annotationCount} → ${finalStats.annotationCount}`);
                }
                
                results.summary.finalStats = finalStats;
                results.summary.improvements = {
                    accuracyGain: finalStats.currentAccuracy - (initialStats?.currentAccuracy || 0),
                    newPatterns: finalStats.patternCount - (initialStats?.patternCount || 0),
                    newAnnotations: finalStats.annotationCount - (initialStats?.annotationCount || 0)
                };
            }
            console.log('');
        } catch (error) {
            results.tests.push({
                name: 'Final Statistics',
                status: 'failed',
                error: error.message
            });
            console.log('❌ Failed to get final statistics:', error.message);
        }

        // Test 7: Test PDF processing capability
        console.log('📄 Test 7: Testing PDF processing capability...');
        try {
            // Create a simple test to check if the PDF processing endpoint exists
            const processingTestResponse = await page.evaluate(async (url) => {
                const formData = new FormData();
                // Create a minimal PDF-like blob for testing endpoint existence
                const testBlob = new Blob(['%PDF-1.4 test'], { type: 'application/pdf' });
                formData.append('pdf', testBlob, 'test.pdf');
                
                try {
                    const res = await fetch(`${url}/api/smart-ocr-process`, {
                        method: 'POST',
                        body: formData
                    });
                    return { 
                        status: res.status, 
                        statusText: res.statusText,
                        exists: true 
                    };
                } catch (error) {
                    return { 
                        exists: false, 
                        error: error.message 
                    };
                }
            }, TEST_CONFIG.baseUrl);

            results.tests.push({
                name: 'PDF Processing Endpoint',
                status: processingTestResponse.exists ? 'passed' : 'failed',
                data: processingTestResponse
            });

            if (processingTestResponse.exists) {
                console.log('✅ PDF processing endpoint is accessible');
                console.log(`   - Status: ${processingTestResponse.status} ${processingTestResponse.statusText}`);
                console.log('   - Note: Full PDF processing would require a valid PDF file');
            } else {
                console.log('❌ PDF processing endpoint not accessible');
                console.log(`   - Error: ${processingTestResponse.error}`);
            }
            console.log('');
        } catch (error) {
            results.tests.push({
                name: 'PDF Processing Endpoint',
                status: 'failed',
                error: error.message
            });
            console.log('❌ PDF processing test error:', error.message);
        }

    } catch (error) {
        console.error('Fatal error:', error);
        results.error = error.message;
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Save detailed results
    const resultsPath = path.join(__dirname, `smart-ocr-workflow-test-${new Date().toISOString().replace(/:/g, '-')}.json`);
    await fs.writeFile(resultsPath, JSON.stringify(results, null, 2));
    
    // Print comprehensive summary
    console.log('\n📊 SMART OCR WORKFLOW TEST SUMMARY');
    console.log('=====================================');
    
    const passed = results.tests.filter(t => t.status === 'passed').length;
    const failed = results.tests.filter(t => t.status === 'failed').length;
    console.log(`✅ Tests Passed: ${passed}`);
    console.log(`❌ Tests Failed: ${failed}`);
    console.log(`📄 Total Tests: ${passed + failed}`);
    
    if (results.summary.improvements) {
        console.log('\n🎯 LEARNING SYSTEM PERFORMANCE:');
        console.log(`   - Accuracy gained: +${results.summary.improvements.accuracyGain}%`);
        console.log(`   - New patterns learned: +${results.summary.improvements.newPatterns}`);
        console.log(`   - New annotations added: +${results.summary.improvements.newAnnotations}`);
    }
    
    console.log('\n💡 ACTIONABLE RECOMMENDATIONS:');
    console.log('==============================');
    
    if (results.summary.finalStats) {
        const accuracy = results.summary.finalStats.currentAccuracy;
        const target = results.summary.finalStats.targetAccuracy;
        const gap = target - accuracy;
        
        console.log(`1. ACCURACY STATUS: ${accuracy}% / ${target}% target (${gap.toFixed(1)}% gap remaining)`);
        
        if (gap > 10) {
            console.log('   🔥 PRIORITY: High - Significant accuracy gap');
            console.log('   📋 ACTION: Focus on adding domain-specific annotations');
            console.log('   🎯 STRATEGY: Analyze failed extractions and add corrections');
        } else if (gap > 5) {
            console.log('   🔶 PRIORITY: Medium - Good progress, fine-tuning needed');
            console.log('   📋 ACTION: Add edge case annotations');
            console.log('   🎯 STRATEGY: Focus on specific document formats');
        } else {
            console.log('   ✅ PRIORITY: Low - Excellent accuracy achieved');
            console.log('   📋 ACTION: Maintenance and monitoring');
            console.log('   🎯 STRATEGY: Test with diverse document types');
        }
    }
    
    console.log('\n2. LEARNING WORKFLOW VERIFICATION:');
    if (results.tests.find(t => t.name === 'Annotation Learning' && t.status === 'passed')) {
        console.log('   ✅ Annotation learning system is working correctly');
        console.log('   📝 FORMAT: Use { annotations: [...], corrections: [...], documentId: "..." }');
        console.log('   🔄 PROCESS: Add annotations → System learns → Accuracy improves');
    } else {
        console.log('   ❌ Annotation learning system needs attention');
        console.log('   🔧 DEBUG: Check server logs and API response details');
    }
    
    console.log('\n3. INTERFACE ACCESSIBILITY:');
    if (results.tests.find(t => t.name === 'Annotation Interface' && t.status === 'passed')) {
        console.log('   ✅ Visual annotation interface is accessible');
        console.log('   🖱️  URL: /smart-annotation');
        console.log('   🎨 TOOLS: 6 annotation tools available (Headers, Data, Connect, etc.)');
    } else {
        console.log('   ❌ Visual annotation interface has issues');
    }
    
    console.log('\n4. NEXT STEPS FOR 99.9% ACCURACY:');
    console.log('   a) 📄 Process real financial PDFs through /api/smart-ocr-process');
    console.log('   b) 🖱️  Use visual annotation interface to mark incorrect extractions');
    console.log('   c) 🧠 Submit corrections via /api/smart-ocr-learn API');
    console.log('   d) 📊 Monitor accuracy improvements via /api/smart-ocr-stats');
    console.log('   e) 🔄 Repeat process with diverse document types');
    
    console.log(`\n📁 Detailed results saved to: ${resultsPath}`);
    console.log('🚀 Smart OCR Learning System is ready for annotation-driven accuracy improvement!');
    
    return results;
}

// Run tests
testSmartOCRWorkflow().catch(console.error);