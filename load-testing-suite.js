const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { performance } = require('perf_hooks');
const cluster = require('cluster');
const os = require('os');

// Configuration
const BASE_URL = 'https://pdf-fzzi.onrender.com';
const TEST_PDF_PATH = path.join(__dirname, 'Messos_Anlagestiftung_Full_Report.pdf');
const RESULTS_DIR = path.join(__dirname, 'test-results');
const MAX_WORKERS = Math.min(4, os.cpus().length); // Limit concurrent workers

// Test configuration
const LOAD_TESTS = {
    light: { concurrent: 2, duration: 30000, requests: 10 },
    medium: { concurrent: 4, duration: 60000, requests: 20 },
    heavy: { concurrent: 6, duration: 90000, requests: 30 }
};

// Ensure results directory exists
fs.mkdirSync(RESULTS_DIR, { recursive: true });

// Load test results
const loadTestResults = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    testConfiguration: LOAD_TESTS,
    results: {},
    summary: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
        requestsPerSecond: 0,
        errorRate: 0
    }
};

// Worker process for concurrent requests
if (cluster.isWorker) {
    process.on('message', async (config) => {
        const { testType, workerIndex, requestsPerWorker } = config;
        const results = [];
        
        console.log(`Worker ${workerIndex}: Starting ${requestsPerWorker} requests`);
        
        for (let i = 0; i < requestsPerWorker; i++) {
            const requestStart = performance.now();
            
            try {
                let response;
                
                if (testType === 'health') {
                    response = await axios.get(`${BASE_URL}/health`, { timeout: 30000 });
                } else if (testType === 'capabilities') {
                    response = await axios.get(`${BASE_URL}/api/system-capabilities`, { timeout: 30000 });
                } else if (testType === 'pdf-upload' && fs.existsSync(TEST_PDF_PATH)) {
                    const formData = new FormData();
                    formData.append('pdf', fs.createReadStream(TEST_PDF_PATH));
                    
                    response = await axios.post(
                        `${BASE_URL}/api/ultra-accurate-extract`,
                        formData,
                        {
                            headers: formData.getHeaders(),
                            timeout: 120000,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity
                        }
                    );
                }
                
                const responseTime = performance.now() - requestStart;
                
                results.push({
                    success: true,
                    responseTime,
                    statusCode: response.status,
                    requestIndex: i,
                    workerIndex
                });
                
                // Add delay between requests to avoid overwhelming
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                const responseTime = performance.now() - requestStart;
                
                results.push({
                    success: false,
                    responseTime,
                    error: error.message,
                    statusCode: error.response?.status || 0,
                    requestIndex: i,
                    workerIndex
                });
                
                // Longer delay on error
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        process.send({ workerIndex, results });
        process.exit(0);
    });
    
    return;
}

// Main process functions
function logLoadTest(testName, results, duration) {
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = results.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    const requestsPerSecond = totalRequests / (duration / 1000);
    const errorRate = (failedRequests / totalRequests) * 100;
    
    const summary = {
        testName,
        duration,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        maxResponseTime,
        minResponseTime,
        requestsPerSecond,
        errorRate,
        results
    };
    
    loadTestResults.results[testName] = summary;
    
    // Update global summary
    loadTestResults.summary.totalRequests += totalRequests;
    loadTestResults.summary.successfulRequests += successfulRequests;
    loadTestResults.summary.failedRequests += failedRequests;
    
    console.log(`\n📊 ${testName} Results:`);
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Successful: ${successfulRequests} (${((successfulRequests/totalRequests)*100).toFixed(2)}%)`);
    console.log(`   Failed: ${failedRequests} (${errorRate.toFixed(2)}%)`);
    console.log(`   Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`   Min Response Time: ${minResponseTime.toFixed(2)}ms`);
    console.log(`   Max Response Time: ${maxResponseTime.toFixed(2)}ms`);
    console.log(`   Requests/Second: ${requestsPerSecond.toFixed(2)}`);
    
    return summary;
}

async function runConcurrentTest(testName, testType, concurrent, totalRequests, maxDuration) {
    console.log(`\n🚀 Starting ${testName}`);
    console.log(`   Concurrent Workers: ${concurrent}`);
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Max Duration: ${maxDuration}ms`);
    
    const startTime = performance.now();
    const requestsPerWorker = Math.ceil(totalRequests / concurrent);
    const workers = [];
    const allResults = [];
    
    return new Promise((resolve, reject) => {
        let completedWorkers = 0;
        const timeout = setTimeout(() => {
            console.log(`⚠️  ${testName} timed out after ${maxDuration}ms`);
            workers.forEach(worker => worker.kill());
            resolve([]);
        }, maxDuration);
        
        // Create workers
        for (let i = 0; i < concurrent; i++) {
            const worker = cluster.fork();
            workers.push(worker);
            
            worker.on('message', (data) => {
                allResults.push(...data.results);
                completedWorkers++;
                
                console.log(`   Worker ${data.workerIndex} completed (${completedWorkers}/${concurrent})`);
                
                if (completedWorkers === concurrent) {
                    clearTimeout(timeout);
                    const duration = performance.now() - startTime;
                    const summary = logLoadTest(testName, allResults, duration);
                    resolve(summary);
                }
            });
            
            worker.on('error', (error) => {
                console.error(`Worker ${i} error:`, error);
                completedWorkers++;
                if (completedWorkers === concurrent) {
                    clearTimeout(timeout);
                    const duration = performance.now() - startTime;
                    const summary = logLoadTest(testName, allResults, duration);
                    resolve(summary);
                }
            });
            
            // Send work to worker
            worker.send({
                testType,
                workerIndex: i,
                requestsPerWorker: i < concurrent - 1 ? requestsPerWorker : totalRequests - (requestsPerWorker * i)
            });
        }
    });
}

async function testHealthEndpointLoad() {
    const config = LOAD_TESTS.light;
    return await runConcurrentTest(
        'Health Endpoint Load Test',
        'health',
        config.concurrent,
        config.requests,
        config.duration
    );
}

async function testCapabilitiesEndpointLoad() {
    const config = LOAD_TESTS.light;
    return await runConcurrentTest(
        'Capabilities Endpoint Load Test',
        'capabilities',
        config.concurrent,
        config.requests,
        config.duration
    );
}

async function testPDFProcessingLoad() {
    if (!fs.existsSync(TEST_PDF_PATH)) {
        console.log(`⚠️  Skipping PDF processing load test - test PDF not found`);
        return null;
    }
    
    const config = LOAD_TESTS.medium; // Use medium load for PDF processing
    return await runConcurrentTest(
        'PDF Processing Load Test',
        'pdf-upload',
        config.concurrent,
        Math.min(config.requests, 8), // Limit PDF requests to avoid overload
        config.duration * 2 // Double timeout for PDF processing
    );
}

async function testSystemStabilityUnderLoad() {
    console.log('\n🔄 Testing System Stability Under Load');
    
    // Gradually increase load
    const phases = [
        { name: 'Phase 1: Light Load', concurrent: 2, requests: 5 },
        { name: 'Phase 2: Medium Load', concurrent: 3, requests: 8 },
        { name: 'Phase 3: Heavy Load', concurrent: 4, requests: 10 }
    ];
    
    const stabilityResults = [];
    
    for (const phase of phases) {
        console.log(`\n⚡ ${phase.name}`);
        
        const phaseResults = await runConcurrentTest(
            phase.name,
            'health',
            phase.concurrent,
            phase.requests,
            60000 // 1 minute timeout per phase
        );
        
        stabilityResults.push(phaseResults);
        
        // Check if system is still stable
        const errorRate = (phaseResults.failedRequests / phaseResults.totalRequests) * 100;
        if (errorRate > 50) {
            console.log(`⚠️  High error rate (${errorRate.toFixed(2)}%) - stopping stability test`);
            break;
        }
        
        // Brief pause between phases
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return stabilityResults;
}

async function testLargePDFHandling() {
    if (!fs.existsSync(TEST_PDF_PATH)) {
        console.log(`⚠️  Skipping large PDF test - test PDF not found`);
        return null;
    }
    
    console.log('\n📄 Testing Large PDF Handling');
    
    // Test single large PDF with extended timeout
    const startTime = performance.now();
    
    try {
        const formData = new FormData();
        formData.append('pdf', fs.createReadStream(TEST_PDF_PATH));
        
        const response = await axios.post(
            `${BASE_URL}/api/ultra-accurate-extract`,
            formData,
            {
                headers: formData.getHeaders(),
                timeout: 300000, // 5 minutes
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            }
        );
        
        const responseTime = performance.now() - startTime;
        
        const result = {
            testName: 'Large PDF Handling Test',
            success: true,
            responseTime,
            statusCode: response.status,
            dataSize: JSON.stringify(response.data).length,
            extractedSecurities: response.data.securities?.length || 0
        };
        
        console.log(`   ✅ Large PDF processed successfully`);
        console.log(`   Response Time: ${responseTime.toFixed(2)}ms`);
        console.log(`   Extracted Securities: ${result.extractedSecurities}`);
        console.log(`   Response Size: ${result.dataSize} bytes`);
        
        return result;
    } catch (error) {
        const responseTime = performance.now() - startTime;
        
        const result = {
            testName: 'Large PDF Handling Test',
            success: false,
            responseTime,
            error: error.message,
            statusCode: error.response?.status || 0
        };
        
        console.log(`   ❌ Large PDF processing failed: ${error.message}`);
        return result;
    }
}

async function analyzeSystemPerformance() {
    console.log('\n📈 Analyzing System Performance');
    
    // Calculate overall metrics
    const allResults = Object.values(loadTestResults.results);
    const totalRequests = allResults.reduce((sum, test) => sum + test.totalRequests, 0);
    const totalSuccessful = allResults.reduce((sum, test) => sum + test.successfulRequests, 0);
    const totalFailed = allResults.reduce((sum, test) => sum + test.failedRequests, 0);
    
    const allResponseTimes = [];
    allResults.forEach(test => {
        test.results.forEach(result => {
            if (result.success) {
                allResponseTimes.push(result.responseTime);
            }
        });
    });
    
    const averageResponseTime = allResponseTimes.length > 0 
        ? allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length 
        : 0;
    
    const maxResponseTime = allResponseTimes.length > 0 ? Math.max(...allResponseTimes) : 0;
    const minResponseTime = allResponseTimes.length > 0 ? Math.min(...allResponseTimes) : 0;
    
    // Calculate percentiles
    const sortedTimes = allResponseTimes.sort((a, b) => a - b);
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    
    const performanceAnalysis = {
        totalRequests,
        successRate: (totalSuccessful / totalRequests) * 100,
        errorRate: (totalFailed / totalRequests) * 100,
        averageResponseTime,
        minResponseTime,
        maxResponseTime,
        p95ResponseTime: p95,
        p99ResponseTime: p99,
        systemStability: totalFailed < totalRequests * 0.1 ? 'Good' : 'Poor'
    };
    
    loadTestResults.performanceAnalysis = performanceAnalysis;
    
    console.log(`   Total Requests: ${totalRequests}`);
    console.log(`   Success Rate: ${performanceAnalysis.successRate.toFixed(2)}%`);
    console.log(`   Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`   95th Percentile: ${p95.toFixed(2)}ms`);
    console.log(`   99th Percentile: ${p99.toFixed(2)}ms`);
    console.log(`   System Stability: ${performanceAnalysis.systemStability}`);
    
    return performanceAnalysis;
}

async function generateLoadTestReport() {
    const reportPath = path.join(RESULTS_DIR, `load-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(loadTestResults, null, 2));
    
    // Generate summary report
    const summaryPath = path.join(RESULTS_DIR, `load-test-summary-${Date.now()}.md`);
    const summary = `# Load Test Report
    
## Test Configuration
- Target URL: ${BASE_URL}
- Test Date: ${loadTestResults.timestamp}
- Max Workers: ${MAX_WORKERS}

## Performance Summary
- Total Requests: ${loadTestResults.performanceAnalysis?.totalRequests || 'N/A'}
- Success Rate: ${loadTestResults.performanceAnalysis?.successRate?.toFixed(2) || 'N/A'}%
- Average Response Time: ${loadTestResults.performanceAnalysis?.averageResponseTime?.toFixed(2) || 'N/A'}ms
- System Stability: ${loadTestResults.performanceAnalysis?.systemStability || 'N/A'}

## Test Results
${Object.values(loadTestResults.results).map(test => 
    `### ${test.testName}
- Requests: ${test.totalRequests}
- Success Rate: ${((test.successfulRequests/test.totalRequests)*100).toFixed(2)}%
- Avg Response Time: ${test.averageResponseTime.toFixed(2)}ms
- Requests/Second: ${test.requestsPerSecond.toFixed(2)}`
).join('\n\n')}

## Recommendations
${loadTestResults.performanceAnalysis?.errorRate > 10 
    ? '⚠️ High error rate detected - investigate system capacity'
    : '✅ System performing within acceptable parameters'
}
`;
    
    fs.writeFileSync(summaryPath, summary);
    
    console.log('\n' + '='.repeat(60));
    console.log('LOAD TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Detailed report: ${reportPath}`);
    console.log(`Summary report: ${summaryPath}`);
    console.log('='.repeat(60));
}

// Main test runner
async function runLoadTests() {
    console.log('Starting Load Testing Suite');
    console.log(`Target: ${BASE_URL}`);
    console.log(`Max Workers: ${MAX_WORKERS}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('='.repeat(60));
    
    try {
        // Run all load tests
        await testHealthEndpointLoad();
        await testCapabilitiesEndpointLoad();
        await testPDFProcessingLoad();
        
        // Test system stability
        const stabilityResults = await testSystemStabilityUnderLoad();
        loadTestResults.stabilityResults = stabilityResults;
        
        // Test large PDF handling
        const largePDFResult = await testLargePDFHandling();
        if (largePDFResult) {
            loadTestResults.largePDFResult = largePDFResult;
        }
        
        // Analyze performance
        await analyzeSystemPerformance();
        
        // Generate report
        await generateLoadTestReport();
        
        // Exit with appropriate code
        const errorRate = loadTestResults.performanceAnalysis?.errorRate || 0;
        process.exit(errorRate > 25 ? 1 : 0);
        
    } catch (error) {
        console.error('Fatal error running load tests:', error);
        process.exit(1);
    }
}

// Run load tests
runLoadTests();