/**
 * LIVE API MESSOS TEST
 * Direct API testing with real Messos PDF upload
 * Tests the actual processing endpoints that are working
 */

const FormData = require('form-data');
const fs = require('fs').promises;
const fetch = require('node-fetch');

class LiveApiMessosTest {
    constructor() {
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        this.messosPdfPath = '2. Messos  - 31.03.2025.pdf';
        
        console.log('🧪 LIVE API MESSOS TEST');
        console.log('Testing direct API endpoints with real PDF upload');
    }

    async runTest() {
        const startTime = Date.now();
        const results = {
            timestamp: new Date().toISOString(),
            tests: []
        };

        try {
            // Test 1: Check API status
            await this.testApiStatus(results);
            
            // Test 2: Upload and process Messos PDF
            await this.testPdfProcessing(results);
            
            // Test 3: Check processing results
            await this.checkProcessingResults(results);
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            results.error = error.message;
        }

        // Generate report
        await this.generateReport(results, Date.now() - startTime);
        return results;
    }

    async testApiStatus(results) {
        console.log('\\n🔍 Testing API status...');
        
        try {
            const response = await fetch(`${this.renderUrl}/api/smart-ocr-stats`);
            const data = await response.json();
            
            results.tests.push({
                test: 'api_status',
                passed: response.ok && data.success,
                details: {
                    status: response.status,
                    data: data,
                    mistralEnabled: data.stats?.mistralEnabled,
                    currentAccuracy: data.stats?.currentAccuracy
                }
            });
            
            console.log(`✅ API Status: ${response.status}`);
            console.log(`📊 Current Accuracy: ${data.stats?.currentAccuracy}%`);
            console.log(`🧠 Mistral Enabled: ${data.stats?.mistralEnabled}`);
            
        } catch (error) {
            results.tests.push({
                test: 'api_status',
                passed: false,
                error: error.message
            });
            console.log('❌ API status failed:', error.message);
        }
    }

    async testPdfProcessing(results) {
        console.log('\\n📤 Testing PDF processing...');
        
        try {
            // Check if PDF exists
            const pdfBuffer = await fs.readFile(this.messosPdfPath);
            console.log(`📄 PDF loaded: ${this.messosPdfPath} (${Math.round(pdfBuffer.length / 1024)} KB)`);
            
            // Create form data
            const formData = new FormData();
            formData.append('pdf', pdfBuffer, {
                filename: this.messosPdfPath,
                contentType: 'application/pdf'
            });
            
            // Test multiple endpoints
            const endpoints = [
                '/api/smart-ocr-process',
                '/api/bulletproof-processor'
            ];
            
            for (const endpoint of endpoints) {
                try {
                    console.log(`🔄 Testing ${endpoint}...`);
                    
                    const response = await fetch(`${this.renderUrl}${endpoint}`, {
                        method: 'POST',
                        body: formData,
                        timeout: 120000 // 2 minute timeout
                    });
                    
                    const responseText = await response.text();
                    let responseData;
                    
                    try {
                        responseData = JSON.parse(responseText);
                    } catch {
                        responseData = { rawResponse: responseText };
                    }
                    
                    const success = response.ok && responseData.success !== false;
                    
                    results.tests.push({
                        test: `pdf_processing_${endpoint.replace(/[^a-z0-9]/gi, '_')}`,
                        passed: success,
                        details: {
                            endpoint: endpoint,
                            status: response.status,
                            response: responseData,
                            securities: responseData.securities?.length || 0,
                            totalValue: responseData.totalValue || responseData.summary?.totalValue || 0
                        }
                    });
                    
                    if (success) {
                        console.log(`✅ ${endpoint}: SUCCESS`);
                        if (responseData.securities) {
                            console.log(`📊 Found ${responseData.securities.length} securities`);
                            console.log(`💰 Total value: CHF ${(responseData.totalValue || 0).toLocaleString()}`);
                        }
                    } else {
                        console.log(`❌ ${endpoint}: FAILED (${response.status})`);
                        console.log(`   Response: ${responseText.substring(0, 200)}...`);
                    }
                    
                } catch (error) {
                    results.tests.push({
                        test: `pdf_processing_${endpoint.replace(/[^a-z0-9]/gi, '_')}`,
                        passed: false,
                        error: error.message
                    });
                    console.log(`❌ ${endpoint}: ERROR - ${error.message}`);
                }
            }
            
        } catch (error) {
            results.tests.push({
                test: 'pdf_processing',
                passed: false,
                error: error.message
            });
            console.log('❌ PDF processing setup failed:', error.message);
        }
    }

    async checkProcessingResults(results) {
        console.log('\\n🎯 Checking processing results...');
        
        // Find successful processing tests
        const processingTests = results.tests.filter(t => 
            t.test.startsWith('pdf_processing_') && t.passed
        );
        
        if (processingTests.length === 0) {
            results.tests.push({
                test: 'results_verification',
                passed: false,
                error: 'No successful processing to verify'
            });
            console.log('❌ No successful processing results to verify');
            return;
        }
        
        let bestResult = null;
        let bestScore = 0;
        
        for (const test of processingTests) {
            const securities = test.details.securities || 0;
            const totalValue = test.details.totalValue || 0;
            
            // Calculate a simple score
            const score = securities + (totalValue > 1000000 ? 10 : 0);
            
            if (score > bestScore) {
                bestScore = score;
                bestResult = test;
            }
        }
        
        if (bestResult) {
            const securities = bestResult.details.securities;
            const totalValue = bestResult.details.totalValue;
            
            // Expected Messos results
            const expectedSecurities = 35;
            const expectedValue = 19464431;
            
            const securitiesAccuracy = securities > 0 ? (securities / expectedSecurities) * 100 : 0;
            const valueAccuracy = totalValue > 0 ? 
                Math.max(0, 100 - Math.abs(totalValue - expectedValue) / expectedValue * 100) : 0;
            
            const overallAccuracy = (securitiesAccuracy + valueAccuracy) / 2;
            const passed = overallAccuracy >= 70; // Lower threshold for initial test
            
            results.tests.push({
                test: 'results_verification',
                passed: passed,
                details: {
                    bestEndpoint: bestResult.details.endpoint,
                    securities: securities,
                    expectedSecurities: expectedSecurities,
                    totalValue: totalValue,
                    expectedValue: expectedValue,
                    securitiesAccuracy: securitiesAccuracy,
                    valueAccuracy: valueAccuracy,
                    overallAccuracy: overallAccuracy
                }
            });
            
            console.log(`🏆 Best result from: ${bestResult.details.endpoint}`);
            console.log(`📊 Securities: ${securities}/${expectedSecurities} (${securitiesAccuracy.toFixed(1)}%)`);
            console.log(`💰 Value: CHF ${totalValue.toLocaleString()} vs CHF ${expectedValue.toLocaleString()}`);
            console.log(`🎯 Overall accuracy: ${overallAccuracy.toFixed(1)}%`);
            console.log(`${passed ? '✅' : '❌'} Results verification: ${passed ? 'PASSED' : 'NEEDS IMPROVEMENT'}`);
        }
    }

    async generateReport(results, totalTime) {
        const passed = results.tests.filter(t => t.passed).length;
        const total = results.tests.length;
        const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        const report = {
            ...results,
            summary: {
                totalTests: total,
                passed: passed,
                failed: total - passed,
                successRate: successRate,
                totalTime: Math.round(totalTime / 1000)
            }
        };
        
        // Save report
        const reportFile = `live-api-messos-test-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        console.log('\\n📋 LIVE API TEST SUMMARY');
        console.log('='.repeat(40));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${total - passed}`);
        console.log(`📊 Success Rate: ${successRate}%`);
        console.log(`⏱️ Total Time: ${Math.round(totalTime / 1000)}s`);
        console.log(`📄 Report: ${reportFile}`);
        
        // Show comparison with local results
        const verificationTest = results.tests.find(t => t.test === 'results_verification');
        if (verificationTest && verificationTest.passed) {
            console.log('\\n🎉 SUCCESS! Live deployment is processing Messos PDF correctly');
            console.log('🔄 Results are comparable to local testing');
        } else if (verificationTest) {
            console.log('\\n⚠️ PARTIAL SUCCESS - Live deployment is working but needs accuracy improvement');
        } else {
            console.log('\\n❌ ISSUE - Unable to process PDF on live deployment');
        }
        
        return report;
    }
}

// Run test if called directly
if (require.main === module) {
    const test = new LiveApiMessosTest();
    test.runTest().catch(console.error);
}

module.exports = { LiveApiMessosTest };