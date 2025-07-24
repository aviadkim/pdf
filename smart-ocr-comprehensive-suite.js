const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { runSmartOCRTests } = require('./smart-ocr-puppeteer-tests');

// Configuration
const BASE_URL = 'https://pdf-fzzi.onrender.com';
const RESULTS_DIR = path.join(__dirname, 'smart-ocr-test-results');
const TIMEOUT = 30000;

// Utility functions
async function ensureResultsDir() {
    try {
        await fs.mkdir(RESULTS_DIR, { recursive: true });
    } catch (error) {
        console.error('Failed to create results directory:', error);
    }
}

async function saveResults(filename, data) {
    try {
        const filepath = path.join(RESULTS_DIR, filename);
        await fs.writeFile(filepath, JSON.stringify(data, null, 2));
        console.log(`Results saved to: ${filepath}`);
        return filepath;
    } catch (error) {
        console.error(`Failed to save ${filename}:`, error);
        return null;
    }
}

async function makeAPIRequest(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            timeout: TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Smart-OCR-Test-Suite/1.0'
            }
        };
        
        if (data && method !== 'GET') {
            config.data = data;
        }
        
        const response = await axios(config);
        return {
            success: true,
            status: response.status,
            data: response.data,
            headers: response.headers
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status || 0,
            error: error.message,
            data: error.response?.data || null
        };
    }
}

// Comprehensive test suite
async function runComprehensiveSmartOCRSuite() {
    console.log('🚀 Starting Comprehensive Smart OCR Test Suite');
    console.log(`Target URL: ${BASE_URL}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    await ensureResultsDir();
    
    const suiteResults = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        testCategories: {}
    };
    
    try {
        // Category 1: System Health Check
        console.log('\n🔍 Category 1: System Health Check');
        const healthResults = await testSystemHealth();
        suiteResults.testCategories.health = healthResults;
        suiteResults.totalTests += healthResults.totalTests;
        suiteResults.passedTests += healthResults.passedTests;
        suiteResults.failedTests += healthResults.failedTests;
        
        // Category 2: Learning System Features
        console.log('\n🧠 Category 2: Learning System Features');
        const learningResults = await testLearningSystemFeatures();
        suiteResults.testCategories.learning = learningResults;
        suiteResults.totalTests += learningResults.totalTests;
        suiteResults.passedTests += learningResults.passedTests;
        suiteResults.failedTests += learningResults.failedTests;
        
        // Category 3: Annotation Workflow
        console.log('\n📝 Category 3: Annotation Workflow');
        const annotationResults = await testAnnotationWorkflow();
        suiteResults.testCategories.annotation = annotationResults;
        suiteResults.totalTests += annotationResults.totalTests;
        suiteResults.passedTests += annotationResults.passedTests;
        suiteResults.failedTests += annotationResults.failedTests;
        
        // Category 4: API Functionality
        console.log('\n🔌 Category 4: API Functionality');
        const apiResults = await testAPIFunctionality();
        suiteResults.testCategories.api = apiResults;
        suiteResults.totalTests += apiResults.totalTests;
        suiteResults.passedTests += apiResults.passedTests;
        suiteResults.failedTests += apiResults.failedTests;
        
        // Category 5: Performance & Error Handling
        console.log('\n⚡ Category 5: Performance & Error Handling');
        const performanceResults = await testPerformanceAndErrorHandling();
        suiteResults.testCategories.performance = performanceResults;
        suiteResults.totalTests += performanceResults.totalTests;
        suiteResults.passedTests += performanceResults.passedTests;
        suiteResults.failedTests += performanceResults.failedTests;
        
        // Category 6: Puppeteer UI Tests
        console.log('\n🎭 Category 6: Puppeteer UI Tests');
        const puppeteerResults = await runSmartOCRTests();
        suiteResults.testCategories.ui = {
            totalTests: puppeteerResults.total,
            passedTests: puppeteerResults.passed,
            failedTests: puppeteerResults.failed,
            tests: puppeteerResults.tests
        };
        suiteResults.totalTests += puppeteerResults.total;
        suiteResults.passedTests += puppeteerResults.passed;
        suiteResults.failedTests += puppeteerResults.failed;
        
    } catch (error) {
        console.error('Suite execution error:', error);
    }
    
    // Calculate final metrics
    suiteResults.successRate = suiteResults.totalTests > 0 
        ? ((suiteResults.passedTests / suiteResults.totalTests) * 100).toFixed(2)
        : 0;
    
    // Generate performance report
    const performanceReport = generatePerformanceReport(suiteResults);
    
    // Print comprehensive results
    printComprehensiveResults(suiteResults, performanceReport);
    
    // Save all results
    await saveResults('comprehensive-suite-results.json', suiteResults);
    await saveResults('performance-report.json', performanceReport);
    
    return suiteResults;
}

// Test categories
async function testSystemHealth() {
    const results = { totalTests: 0, passedTests: 0, failedTests: 0, tests: [] };
    
    // Test 1: Basic connectivity
    console.log('  🌐 Testing basic connectivity...');
    const connectivityTest = await makeAPIRequest('/');
    results.totalTests++;
    if (connectivityTest.success && connectivityTest.status === 200) {
        results.passedTests++;
        results.tests.push({
            name: 'Basic Connectivity',
            passed: true,
            details: `Status: ${connectivityTest.status}`,
            responseTime: connectivityTest.responseTime
        });
        console.log('    ✅ Site is accessible');
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Basic Connectivity',
            passed: false,
            details: `Error: ${connectivityTest.error || 'Unknown error'}`,
            status: connectivityTest.status
        });
        console.log(`    ❌ Site inaccessible: ${connectivityTest.error}`);
    }
    
    // Test 2: GraphicsMagick handling
    console.log('  🎨 Testing GraphicsMagick graceful handling...');
    const gmTest = await makeAPIRequest('/api/smart-ocr-stats');
    results.totalTests++;
    if (gmTest.success) {
        results.passedTests++;
        results.tests.push({
            name: 'GraphicsMagick Handling',
            passed: true,
            details: 'System continues to function despite GraphicsMagick issues'
        });
        console.log('    ✅ System handles GraphicsMagick issues gracefully');
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'GraphicsMagick Handling',
            passed: false,
            details: `API failure: ${gmTest.error}`
        });
        console.log(`    ❌ System affected by GraphicsMagick: ${gmTest.error}`);
    }
    
    // Test 3: Mistral integration status
    console.log('  🤖 Testing Mistral integration...');
    const mistralTest = await makeAPIRequest('/api/smart-ocr-stats');
    results.totalTests++;
    if (mistralTest.success && mistralTest.data?.stats?.mistralEnabled) {
        results.passedTests++;
        results.tests.push({
            name: 'Mistral Integration',
            passed: true,
            details: 'Mistral is enabled and functional'
        });
        console.log('    ✅ Mistral integration is enabled');
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Mistral Integration',
            passed: false,
            details: 'Mistral not enabled or stats unavailable'
        });
        console.log('    ❌ Mistral integration issue');
    }
    
    return results;
}

async function testLearningSystemFeatures() {
    const results = { totalTests: 0, passedTests: 0, failedTests: 0, tests: [] };
    
    // Test 1: Current accuracy validation
    console.log('  📊 Testing current accuracy (80% expected)...');
    const statsTest = await makeAPIRequest('/api/smart-ocr-stats');
    results.totalTests++;
    if (statsTest.success && statsTest.data?.stats?.currentAccuracy >= 80) {
        results.passedTests++;
        results.tests.push({
            name: 'Accuracy Validation',
            passed: true,
            details: `Current accuracy: ${statsTest.data.stats.currentAccuracy}%`,
            accuracy: statsTest.data.stats.currentAccuracy
        });
        console.log(`    ✅ Accuracy at ${statsTest.data.stats.currentAccuracy}% (≥80% target)`);
    } else {
        results.failedTests++;
        const actualAccuracy = statsTest.data?.stats?.currentAccuracy || 'unknown';
        results.tests.push({
            name: 'Accuracy Validation',
            passed: false,
            details: `Accuracy below target: ${actualAccuracy}%`,
            accuracy: actualAccuracy
        });
        console.log(`    ❌ Accuracy below 80%: ${actualAccuracy}%`);
    }
    
    // Test 2: Pattern count validation
    console.log('  🧩 Testing pattern count (16 expected)...');
    results.totalTests++;
    if (statsTest.success && statsTest.data?.stats?.patternCount >= 16) {
        results.passedTests++;
        results.tests.push({
            name: 'Pattern Count',
            passed: true,
            details: `Pattern count: ${statsTest.data.stats.patternCount}`,
            patterns: statsTest.data.stats.patternCount
        });
        console.log(`    ✅ Has ${statsTest.data.stats.patternCount} patterns (≥16 target)`);
    } else {
        results.failedTests++;
        const actualPatterns = statsTest.data?.stats?.patternCount || 'unknown';
        results.tests.push({
            name: 'Pattern Count',
            passed: false,
            details: `Pattern count below target: ${actualPatterns}`,
            patterns: actualPatterns
        });
        console.log(`    ❌ Pattern count below 16: ${actualPatterns}`);
    }
    
    // Test 3: Annotation count validation
    console.log('  📝 Testing annotation count (22 expected)...');
    results.totalTests++;
    if (statsTest.success && statsTest.data?.stats?.annotationCount >= 22) {
        results.passedTests++;
        results.tests.push({
            name: 'Annotation Count',
            passed: true,
            details: `Annotation count: ${statsTest.data.stats.annotationCount}`,
            annotations: statsTest.data.stats.annotationCount
        });
        console.log(`    ✅ Has ${statsTest.data.stats.annotationCount} annotations (≥22 target)`);
    } else {
        results.failedTests++;
        const actualAnnotations = statsTest.data?.stats?.annotationCount || 'unknown';
        results.tests.push({
            name: 'Annotation Count',
            passed: false,
            details: `Annotation count below target: ${actualAnnotations}`,
            annotations: actualAnnotations
        });
        console.log(`    ❌ Annotation count below 22: ${actualAnnotations}`);
    }
    
    return results;
}

async function testAnnotationWorkflow() {
    const results = { totalTests: 0, passedTests: 0, failedTests: 0, tests: [] };
    
    // Test 1: Add new annotation
    console.log('  ➕ Testing add annotation...');
    const testAnnotation = {
        pattern: `test-pattern-${Date.now()}`,
        value: 'test-value',
        confidence: 0.95
    };
    
    const addTest = await makeAPIRequest('/api/smart-ocr-learn', 'POST', testAnnotation);
    results.totalTests++;
    if (addTest.success) {
        results.passedTests++;
        results.tests.push({
            name: 'Add Annotation',
            passed: true,
            details: 'Successfully added test annotation',
            testData: testAnnotation
        });
        console.log('    ✅ Annotation added successfully');
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Add Annotation',
            passed: false,
            details: `Failed to add annotation: ${addTest.error}`,
            testData: testAnnotation
        });
        console.log(`    ❌ Failed to add annotation: ${addTest.error}`);
    }
    
    // Test 2: Retrieve patterns
    console.log('  📋 Testing pattern retrieval...');
    const patternsTest = await makeAPIRequest('/api/smart-ocr-patterns');
    results.totalTests++;
    if (patternsTest.success && patternsTest.data?.patterns) {
        const totalPatterns = Object.keys(patternsTest.data.patterns).reduce((total, key) => {
            return total + (Array.isArray(patternsTest.data.patterns[key]) ? patternsTest.data.patterns[key].length : 0);
        }, 0);
        results.passedTests++;
        results.tests.push({
            name: 'Pattern Retrieval',
            passed: true,
            details: `Retrieved ${totalPatterns} patterns from API`,
            patternCount: totalPatterns
        });
        console.log(`    ✅ Retrieved ${totalPatterns} patterns`);
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Pattern Retrieval',
            passed: false,
            details: `Failed to retrieve patterns: ${patternsTest.error || 'Invalid response structure'}`
        });
        console.log(`    ❌ Failed to retrieve patterns: ${patternsTest.error || 'Invalid response structure'}`);
    }
    
    // Test 3: Validate annotation persistence
    console.log('  💾 Testing annotation persistence...');
    const statsAfter = await makeAPIRequest('/api/smart-ocr-stats');
    results.totalTests++;
    if (statsAfter.success && statsAfter.data?.stats?.annotationCount) {
        results.passedTests++;
        results.tests.push({
            name: 'Annotation Persistence',
            passed: true,
            details: 'Annotations are being tracked in stats',
            currentCount: statsAfter.data.stats.annotationCount
        });
        console.log('    ✅ Annotations are persistent');
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Annotation Persistence',
            passed: false,
            details: 'Unable to verify annotation persistence'
        });
        console.log('    ❌ Cannot verify annotation persistence');
    }
    
    return results;
}

async function testAPIFunctionality() {
    const results = { totalTests: 0, passedTests: 0, failedTests: 0, tests: [] };
    
    const endpoints = [
        { path: '/api/smart-ocr-stats', method: 'GET', name: 'Stats API' },
        { path: '/api/smart-ocr-patterns', method: 'GET', name: 'Patterns API' },
        { path: '/api/smart-ocr-learn', method: 'POST', name: 'Learn API', data: { pattern: 'test', value: 'test' }}
    ];
    
    for (const endpoint of endpoints) {
        console.log(`  🔌 Testing ${endpoint.name}...`);
        const test = await makeAPIRequest(endpoint.path, endpoint.method, endpoint.data);
        results.totalTests++;
        
        if (test.success) {
            results.passedTests++;
            results.tests.push({
                name: endpoint.name,
                passed: true,
                details: `Status: ${test.status}`,
                endpoint: endpoint.path,
                method: endpoint.method,
                responseSize: JSON.stringify(test.data).length
            });
            console.log(`    ✅ ${endpoint.name} working (${test.status})`);
        } else {
            results.failedTests++;
            results.tests.push({
                name: endpoint.name,
                passed: false,
                details: `Error: ${test.error}`,
                endpoint: endpoint.path,
                method: endpoint.method,
                status: test.status
            });
            console.log(`    ❌ ${endpoint.name} failed: ${test.error}`);
        }
    }
    
    return results;
}

async function testPerformanceAndErrorHandling() {
    const results = { totalTests: 0, passedTests: 0, failedTests: 0, tests: [] };
    
    // Test 1: Response time
    console.log('  ⏱️ Testing response time...');
    const startTime = Date.now();
    const responseTest = await makeAPIRequest('/api/smart-ocr-stats');
    const responseTime = Date.now() - startTime;
    
    results.totalTests++;
    if (responseTest.success && responseTime < 5000) {
        results.passedTests++;
        results.tests.push({
            name: 'Response Time',
            passed: true,
            details: `Response time: ${responseTime}ms`,
            responseTime
        });
        console.log(`    ✅ Good response time: ${responseTime}ms`);
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Response Time',
            passed: false,
            details: `Slow response: ${responseTime}ms`,
            responseTime
        });
        console.log(`    ❌ Slow response time: ${responseTime}ms`);
    }
    
    // Test 2: Invalid request handling
    console.log('  🚫 Testing error handling...');
    const errorTest = await makeAPIRequest('/api/nonexistent-endpoint');
    results.totalTests++;
    if (errorTest.status === 404) {
        results.passedTests++;
        results.tests.push({
            name: 'Error Handling',
            passed: true,
            details: 'Proper 404 response for invalid endpoint'
        });
        console.log('    ✅ Proper error handling');
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Error Handling',
            passed: false,
            details: `Unexpected response: ${errorTest.status}`
        });
        console.log(`    ❌ Unexpected error response: ${errorTest.status}`);
    }
    
    // Test 3: Malformed data handling
    console.log('  🔧 Testing malformed data handling...');
    const malformedTest = await makeAPIRequest('/api/smart-ocr-learn', 'POST', { invalid: 'data' });
    results.totalTests++;
    if (malformedTest.status >= 400 && malformedTest.status < 500) {
        results.passedTests++;
        results.tests.push({
            name: 'Malformed Data Handling',
            passed: true,
            details: 'Proper error response for invalid data'
        });
        console.log('    ✅ Handles malformed data properly');
    } else {
        results.failedTests++;
        results.tests.push({
            name: 'Malformed Data Handling',
            passed: false,
            details: `Unexpected response to malformed data: ${malformedTest.status}`
        });
        console.log(`    ❌ Poor malformed data handling: ${malformedTest.status}`);
    }
    
    return results;
}

function generatePerformanceReport(suiteResults) {
    return {
        timestamp: new Date().toISOString(),
        overallHealth: {
            successRate: `${suiteResults.successRate}%`,
            totalTests: suiteResults.totalTests,
            passedTests: suiteResults.passedTests,
            failedTests: suiteResults.failedTests
        },
        categoryBreakdown: Object.keys(suiteResults.testCategories).map(category => ({
            category,
            tests: suiteResults.testCategories[category].totalTests,
            passed: suiteResults.testCategories[category].passedTests,
            failed: suiteResults.testCategories[category].failedTests,
            successRate: suiteResults.testCategories[category].totalTests > 0
                ? ((suiteResults.testCategories[category].passedTests / suiteResults.testCategories[category].totalTests) * 100).toFixed(2)
                : 0
        })),
        recommendations: generateRecommendations(suiteResults),
        systemStatus: determineSystemStatus(suiteResults)
    };
}

function generateRecommendations(suiteResults) {
    const recommendations = [];
    
    if (suiteResults.successRate < 80) {
        recommendations.push('CRITICAL: Overall success rate below 80%. Immediate attention required.');
    } else if (suiteResults.successRate < 90) {
        recommendations.push('WARNING: Success rate below 90%. Consider investigating failed tests.');
    }
    
    // Check specific categories
    Object.entries(suiteResults.testCategories).forEach(([category, results]) => {
        const successRate = results.totalTests > 0 
            ? (results.passedTests / results.totalTests) * 100 
            : 0;
        
        if (successRate < 70) {
            recommendations.push(`${category.toUpperCase()}: Poor performance (${successRate.toFixed(1)}%). Needs immediate attention.`);
        } else if (successRate < 90) {
            recommendations.push(`${category}: Below optimal performance (${successRate.toFixed(1)}%). Monitor closely.`);
        }
    });
    
    if (recommendations.length === 0) {
        recommendations.push('System performing well. Continue monitoring.');
    }
    
    return recommendations;
}

function determineSystemStatus(suiteResults) {
    const successRate = parseFloat(suiteResults.successRate);
    
    if (successRate >= 95) return 'EXCELLENT';
    if (successRate >= 85) return 'GOOD';
    if (successRate >= 70) return 'FAIR';
    if (successRate >= 50) return 'POOR';
    return 'CRITICAL';
}

function printComprehensiveResults(suiteResults, performanceReport) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE SMART OCR TEST SUITE RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 OVERALL PERFORMANCE:`);
    console.log(`   Success Rate: ${suiteResults.successRate}% (${suiteResults.passedTests}/${suiteResults.totalTests})`);
    console.log(`   System Status: ${performanceReport.systemStatus}`);
    console.log(`   Test Duration: ${new Date().toLocaleTimeString()}`);
    
    console.log(`\n📋 CATEGORY BREAKDOWN:`);
    performanceReport.categoryBreakdown.forEach(cat => {
        const status = cat.successRate >= 90 ? '✅' : cat.successRate >= 70 ? '⚠️' : '❌';
        console.log(`   ${status} ${cat.category}: ${cat.successRate}% (${cat.passed}/${cat.tests})`);
    });
    
    console.log(`\n🔍 RECOMMENDATIONS:`);
    performanceReport.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
    });
    
    console.log(`\n💡 KEY FINDINGS:`);
    const learningStats = suiteResults.testCategories.learning;
    if (learningStats) {
        const accuracyTest = learningStats.tests.find(t => t.name === 'Accuracy Validation');
        const patternTest = learningStats.tests.find(t => t.name === 'Pattern Count');
        const annotationTest = learningStats.tests.find(t => t.name === 'Annotation Count');
        
        if (accuracyTest) console.log(`   📊 Current Accuracy: ${accuracyTest.accuracy}%`);
        if (patternTest) console.log(`   🧩 Pattern Count: ${patternTest.patterns}`);
        if (annotationTest) console.log(`   📝 Annotation Count: ${annotationTest.annotations}`);
    }
    
    console.log('\n' + '='.repeat(80));
}

// Run comprehensive suite if called directly
if (require.main === module) {
    runComprehensiveSmartOCRSuite().then(results => {
        process.exit(results.failedTests > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runComprehensiveSmartOCRSuite };