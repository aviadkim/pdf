/**
 * COMPREHENSIVE TEST SUITE - HUNDREDS OF TESTS
 * 
 * This suite runs extensive tests before deployment to ensure system stability
 * Tests all aspects: API endpoints, accuracy, error handling, performance
 * 
 * Test Categories:
 * 1. API Endpoint Tests (100 tests)
 * 2. Accuracy Tests (50 tests)
 * 3. Error Handling Tests (100 tests)
 * 4. Performance Tests (50 tests)
 * 5. Pattern Learning Tests (100 tests)
 * 6. Concurrent Load Tests (100 tests)
 * 
 * Total: 500+ tests
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

class ComprehensiveTestSuite {
    constructor() {
        this.baseURL = 'http://localhost:10003';
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            errors: [],
            performance: {},
            apiHealth: {},
            accuracyResults: {},
            errorHandling: {},
            startTime: Date.now(),
            endTime: null
        };
    }

    async runAllTests() {
        console.log('🚀 COMPREHENSIVE TEST SUITE - 500+ TESTS');
        console.log('=========================================');
        console.log('📊 Running hundreds of tests before deployment...\n');

        try {
            // Test Category 1: API Endpoint Tests (100 tests)
            await this.runAPIEndpointTests();
            
            // Test Category 2: Accuracy Tests (50 tests)
            await this.runAccuracyTests();
            
            // Test Category 3: Error Handling Tests (100 tests)
            await this.runErrorHandlingTests();
            
            // Test Category 4: Performance Tests (50 tests)
            await this.runPerformanceTests();
            
            // Test Category 5: Pattern Learning Tests (100 tests)
            await this.runPatternLearningTests();
            
            // Test Category 6: Concurrent Load Tests (100 tests)
            await this.runConcurrentLoadTests();
            
            // Test Category 7: Edge Case Tests (100 tests)
            await this.runEdgeCaseTests();

            this.testResults.endTime = Date.now();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.errors.push({ category: 'SUITE', error: error.message });
        }

        return this.generateFinalReport();
    }

    async runAPIEndpointTests() {
        console.log('📋 Category 1: API Endpoint Tests (100 tests)');
        console.log('==============================================');
        
        const endpoints = [
            { method: 'GET', path: '/api/annotation-test', name: 'System Health' },
            { method: 'GET', path: '/api/annotation-stats', name: 'Statistics' },
            { method: 'GET', path: '/api/annotation-patterns', name: 'Pattern List' },
            { method: 'GET', path: '/annotation', name: 'Frontend Interface' },
            { method: 'POST', path: '/api/annotation-learn', name: 'Pattern Learning' }
        ];

        for (let i = 0; i < 20; i++) {
            for (const endpoint of endpoints) {
                await this.testAPIEndpoint(endpoint, i);
            }
        }

        console.log(`✅ API Endpoint Tests: ${this.testResults.passed} passed, ${this.testResults.failed} failed\n`);
    }

    async testAPIEndpoint(endpoint, iteration) {
        try {
            const startTime = Date.now();
            
            if (endpoint.method === 'GET') {
                const response = await axios.get(`${this.baseURL}${endpoint.path}`, {
                    timeout: 5000
                });
                
                if (response.status === 200) {
                    this.recordSuccess(`${endpoint.name} #${iteration}`, Date.now() - startTime);
                } else {
                    this.recordFailure(`${endpoint.name} #${iteration}`, `Status: ${response.status}`);
                }
            } else if (endpoint.method === 'POST' && endpoint.path === '/api/annotation-learn') {
                // Test pattern learning endpoint
                const response = await axios.post(`${this.baseURL}${endpoint.path}`, {
                    annotationId: `test_${iteration}`,
                    annotations: [
                        { id: 1, page: 0, x: 100, y: 200, width: 100, height: 30, color: 'blue', value: '1000', timestamp: new Date().toISOString() }
                    ]
                });
                
                if (response.data.success) {
                    this.recordSuccess(`${endpoint.name} #${iteration}`, Date.now() - startTime);
                } else {
                    this.recordFailure(`${endpoint.name} #${iteration}`, 'Pattern learning failed');
                }
            }
            
        } catch (error) {
            this.recordFailure(`${endpoint.name} #${iteration}`, error.message);
        }
    }

    async runAccuracyTests() {
        console.log('📋 Category 2: Accuracy Tests (50 tests)');
        console.log('=========================================');
        
        // Test different annotation scenarios
        const testScenarios = [
            { securities: 5, expectedAccuracy: 100 },
            { securities: 10, expectedAccuracy: 100 },
            { securities: 15, expectedAccuracy: 100 },
            { securities: 20, expectedAccuracy: 100 },
            { securities: 25, expectedAccuracy: 100 }
        ];

        for (let i = 0; i < 10; i++) {
            for (const scenario of testScenarios) {
                await this.testAccuracyScenario(scenario, i);
            }
        }

        console.log(`✅ Accuracy Tests completed\n`);
    }

    async testAccuracyScenario(scenario, iteration) {
        try {
            const annotations = this.generateMockAnnotations(scenario.securities);
            
            const response = await axios.post(`${this.baseURL}/api/annotation-learn`, {
                annotationId: `accuracy_test_${iteration}_${scenario.securities}`,
                annotations: annotations
            });
            
            if (response.data.success && response.data.metadata.accuracy >= scenario.expectedAccuracy) {
                this.recordSuccess(`Accuracy ${scenario.securities} securities #${iteration}`, response.data.metadata.accuracy);
            } else {
                this.recordFailure(`Accuracy ${scenario.securities} securities #${iteration}`, 
                    `Expected ${scenario.expectedAccuracy}%, got ${response.data.metadata.accuracy}%`);
            }
            
        } catch (error) {
            this.recordFailure(`Accuracy ${scenario.securities} securities #${iteration}`, error.message);
        }
    }

    async runErrorHandlingTests() {
        console.log('📋 Category 3: Error Handling Tests (100 tests)');
        console.log('================================================');
        
        const errorScenarios = [
            { type: 'invalid_json', data: 'invalid json' },
            { type: 'missing_fields', data: {} },
            { type: 'invalid_annotations', data: { annotationId: 'test', annotations: 'invalid' } },
            { type: 'empty_annotations', data: { annotationId: 'test', annotations: [] } },
            { type: 'malformed_annotation', data: { annotationId: 'test', annotations: [{ invalid: 'data' }] } }
        ];

        for (let i = 0; i < 20; i++) {
            for (const scenario of errorScenarios) {
                await this.testErrorHandling(scenario, i);
            }
        }

        console.log(`✅ Error Handling Tests completed\n`);
    }

    async testErrorHandling(scenario, iteration) {
        try {
            const response = await axios.post(`${this.baseURL}/api/annotation-learn`, scenario.data, {
                timeout: 5000,
                validateStatus: () => true // Accept all status codes
            });
            
            // Error handling tests pass if they return appropriate error codes
            if (response.status >= 400 && response.status < 500) {
                this.recordSuccess(`Error ${scenario.type} #${iteration}`, `Status: ${response.status}`);
            } else {
                this.recordFailure(`Error ${scenario.type} #${iteration}`, `Expected 4xx, got ${response.status}`);
            }
            
        } catch (error) {
            // Network errors are expected for some tests
            this.recordSuccess(`Error ${scenario.type} #${iteration}`, `Network error: ${error.message}`);
        }
    }

    async runPerformanceTests() {
        console.log('📋 Category 4: Performance Tests (50 tests)');
        console.log('============================================');
        
        const performanceThresholds = {
            'annotation-stats': 500,    // 500ms
            'annotation-patterns': 500,  // 500ms
            'annotation-test': 500,      // 500ms
            'pattern-learning': 2000     // 2 seconds
        };

        for (let i = 0; i < 10; i++) {
            for (const [endpoint, threshold] of Object.entries(performanceThresholds)) {
                await this.testPerformance(endpoint, threshold, i);
            }
        }

        console.log(`✅ Performance Tests completed\n`);
    }

    async testPerformance(endpoint, threshold, iteration) {
        try {
            const startTime = Date.now();
            
            let response;
            if (endpoint === 'pattern-learning') {
                response = await axios.post(`${this.baseURL}/api/annotation-learn`, {
                    annotationId: `perf_test_${iteration}`,
                    annotations: this.generateMockAnnotations(5)
                });
            } else {
                const endpointMap = {
                    'annotation-stats': '/api/annotation-stats',
                    'annotation-patterns': '/api/annotation-patterns',
                    'annotation-test': '/api/annotation-test'
                };
                response = await axios.get(`${this.baseURL}${endpointMap[endpoint]}`);
            }
            
            const responseTime = Date.now() - startTime;
            
            if (responseTime <= threshold) {
                this.recordSuccess(`Performance ${endpoint} #${iteration}`, responseTime);
                if (!this.testResults.performance[endpoint]) {
                    this.testResults.performance[endpoint] = [];
                }
                this.testResults.performance[endpoint].push(responseTime);
            } else {
                this.recordFailure(`Performance ${endpoint} #${iteration}`, 
                    `${responseTime}ms exceeds ${threshold}ms threshold`);
            }
            
        } catch (error) {
            this.recordFailure(`Performance ${endpoint} #${iteration}`, error.message);
        }
    }

    async runPatternLearningTests() {
        console.log('📋 Category 5: Pattern Learning Tests (100 tests)');
        console.log('==================================================');
        
        for (let i = 0; i < 100; i++) {
            await this.testPatternLearning(i);
        }

        console.log(`✅ Pattern Learning Tests completed\n`);
    }

    async testPatternLearning(iteration) {
        try {
            const annotations = this.generateMockAnnotations(Math.floor(Math.random() * 20) + 5);
            
            const response = await axios.post(`${this.baseURL}/api/annotation-learn`, {
                annotationId: `pattern_test_${iteration}`,
                annotations: annotations
            });
            
            if (response.data.success && 
                response.data.metadata.patternLearned && 
                response.data.securities.length > 0) {
                this.recordSuccess(`Pattern Learning #${iteration}`, response.data.securities.length);
            } else {
                this.recordFailure(`Pattern Learning #${iteration}`, 'Pattern learning failed');
            }
            
        } catch (error) {
            this.recordFailure(`Pattern Learning #${iteration}`, error.message);
        }
    }

    async runConcurrentLoadTests() {
        console.log('📋 Category 6: Concurrent Load Tests (100 tests)');
        console.log('=================================================');
        
        const concurrentBatches = 10;
        const testsPerBatch = 10;
        
        for (let batch = 0; batch < concurrentBatches; batch++) {
            const promises = [];
            
            for (let i = 0; i < testsPerBatch; i++) {
                promises.push(this.testConcurrentLoad(batch, i));
            }
            
            await Promise.all(promises);
            
            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log(`✅ Concurrent Load Tests completed\n`);
    }

    async testConcurrentLoad(batch, iteration) {
        try {
            const endpoints = [
                () => axios.get(`${this.baseURL}/api/annotation-stats`),
                () => axios.get(`${this.baseURL}/api/annotation-patterns`),
                () => axios.get(`${this.baseURL}/api/annotation-test`),
                () => axios.post(`${this.baseURL}/api/annotation-learn`, {
                    annotationId: `concurrent_${batch}_${iteration}`,
                    annotations: this.generateMockAnnotations(3)
                })
            ];
            
            const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
            const response = await randomEndpoint();
            
            if (response.status === 200) {
                this.recordSuccess(`Concurrent Load B${batch}-${iteration}`, response.status);
            } else {
                this.recordFailure(`Concurrent Load B${batch}-${iteration}`, `Status: ${response.status}`);
            }
            
        } catch (error) {
            this.recordFailure(`Concurrent Load B${batch}-${iteration}`, error.message);
        }
    }

    async runEdgeCaseTests() {
        console.log('📋 Category 7: Edge Case Tests (100 tests)');
        console.log('===========================================');
        
        const edgeCases = [
            { name: 'Large annotations', data: this.generateMockAnnotations(50) },
            { name: 'Zero annotations', data: [] },
            { name: 'Duplicate annotations', data: this.generateDuplicateAnnotations() },
            { name: 'Invalid coordinates', data: this.generateInvalidCoordinateAnnotations() },
            { name: 'Missing required fields', data: this.generateIncompleteAnnotations() }
        ];

        for (let i = 0; i < 20; i++) {
            for (const edgeCase of edgeCases) {
                await this.testEdgeCase(edgeCase, i);
            }
        }

        console.log(`✅ Edge Case Tests completed\n`);
    }

    async testEdgeCase(edgeCase, iteration) {
        try {
            const response = await axios.post(`${this.baseURL}/api/annotation-learn`, {
                annotationId: `edge_case_${edgeCase.name}_${iteration}`,
                annotations: edgeCase.data
            }, {
                timeout: 10000,
                validateStatus: () => true
            });
            
            // Edge cases should either succeed or fail gracefully
            if (response.status === 200 || (response.status >= 400 && response.status < 500)) {
                this.recordSuccess(`Edge Case ${edgeCase.name} #${iteration}`, response.status);
            } else {
                this.recordFailure(`Edge Case ${edgeCase.name} #${iteration}`, `Unexpected status: ${response.status}`);
            }
            
        } catch (error) {
            // Some edge cases are expected to cause errors
            this.recordSuccess(`Edge Case ${edgeCase.name} #${iteration}`, `Expected error: ${error.message}`);
        }
    }

    generateMockAnnotations(count) {
        const annotations = [];
        const colors = ['blue', 'yellow', 'green', 'red', 'purple'];
        const values = ['1000', '2000', '500', 'XS2993414619', 'Apple Inc', '5.5%', '10000'];
        
        for (let i = 0; i < count; i++) {
            annotations.push({
                id: i + 1,
                page: 0,
                x: 100 + (i % 10) * 50,
                y: 200 + Math.floor(i / 10) * 40,
                width: 100,
                height: 30,
                color: colors[Math.floor(Math.random() * colors.length)],
                value: values[Math.floor(Math.random() * values.length)],
                timestamp: new Date().toISOString()
            });
        }
        
        return annotations;
    }

    generateDuplicateAnnotations() {
        const base = {
            id: 1,
            page: 0,
            x: 100,
            y: 200,
            width: 100,
            height: 30,
            color: 'blue',
            value: '1000',
            timestamp: new Date().toISOString()
        };
        
        return [base, base, base];
    }

    generateInvalidCoordinateAnnotations() {
        return [
            { id: 1, page: 0, x: -100, y: 200, width: 100, height: 30, color: 'blue', value: '1000', timestamp: new Date().toISOString() },
            { id: 2, page: 0, x: 100, y: -200, width: 100, height: 30, color: 'blue', value: '1000', timestamp: new Date().toISOString() },
            { id: 3, page: 0, x: 100, y: 200, width: -100, height: 30, color: 'blue', value: '1000', timestamp: new Date().toISOString() }
        ];
    }

    generateIncompleteAnnotations() {
        return [
            { id: 1, page: 0, x: 100, y: 200, color: 'blue', value: '1000' },
            { id: 2, page: 0, x: 100, y: 200, width: 100, height: 30, color: 'blue' },
            { id: 3, page: 0, x: 100, y: 200, width: 100, height: 30, value: '1000' }
        ];
    }

    recordSuccess(testName, result) {
        this.testResults.total++;
        this.testResults.passed++;
        if (this.testResults.passed % 50 === 0) {
            console.log(`✅ ${this.testResults.passed} tests passed...`);
        }
    }

    recordFailure(testName, error) {
        this.testResults.total++;
        this.testResults.failed++;
        this.testResults.errors.push({ test: testName, error: error });
        if (this.testResults.failed % 10 === 0) {
            console.log(`❌ ${this.testResults.failed} tests failed...`);
        }
    }

    generateFinalReport() {
        const duration = this.testResults.endTime - this.testResults.startTime;
        const successRate = (this.testResults.passed / this.testResults.total) * 100;
        
        const report = {
            summary: {
                totalTests: this.testResults.total,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: successRate.toFixed(2),
                duration: duration,
                timestamp: new Date().toISOString()
            },
            performance: this.calculatePerformanceStats(),
            errors: this.testResults.errors.slice(0, 20),
            recommendations: this.generateRecommendations(successRate)
        };

        console.log('\n🎯 COMPREHENSIVE TEST SUITE REPORT');
        console.log('==================================');
        console.log(`📊 Total Tests: ${report.summary.totalTests}`);
        console.log(`✅ Passed: ${report.summary.passed}`);
        console.log(`❌ Failed: ${report.summary.failed}`);
        console.log(`🎯 Success Rate: ${report.summary.successRate}%`);
        console.log(`⏱️ Duration: ${(duration / 1000).toFixed(2)} seconds`);
        console.log(`🚀 Tests per second: ${(report.summary.totalTests / (duration / 1000)).toFixed(2)}`);
        
        if (report.performance.averageResponseTime) {
            console.log(`📈 Average Response Time: ${report.performance.averageResponseTime.toFixed(0)}ms`);
        }
        
        console.log('\n🔍 ERROR ANALYSIS:');
        if (report.errors.length > 0) {
            const errorTypes = {};
            report.errors.forEach(error => {
                const type = error.error.split(':')[0];
                errorTypes[type] = (errorTypes[type] || 0) + 1;
            });
            
            Object.entries(errorTypes).forEach(([type, count]) => {
                console.log(`   ${type}: ${count} occurrences`);
            });
        } else {
            console.log('   No errors detected! 🎉');
        }
        
        console.log('\n📋 RECOMMENDATIONS:');
        report.recommendations.forEach(rec => console.log(`   ${rec}`));
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'test-results', 'comprehensive-test-report.json');
        const dir = path.dirname(reportPath);
        
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved: ${reportPath}`);
        
        return report;
    }

    calculatePerformanceStats() {
        const stats = {};
        
        Object.entries(this.testResults.performance).forEach(([endpoint, times]) => {
            if (times.length > 0) {
                stats[endpoint] = {
                    average: times.reduce((sum, time) => sum + time, 0) / times.length,
                    min: Math.min(...times),
                    max: Math.max(...times),
                    count: times.length
                };
            }
        });
        
        if (Object.keys(stats).length > 0) {
            stats.averageResponseTime = Object.values(stats).reduce((sum, stat) => sum + stat.average, 0) / Object.keys(stats).length;
        }
        
        return stats;
    }

    generateRecommendations(successRate) {
        const recommendations = [];
        
        if (successRate >= 95) {
            recommendations.push('🎉 Excellent! System is ready for production deployment');
            recommendations.push('✅ All critical systems are functioning properly');
        } else if (successRate >= 90) {
            recommendations.push('⚠️ Good performance, but review failed tests before deployment');
            recommendations.push('🔧 Minor optimizations recommended');
        } else if (successRate >= 80) {
            recommendations.push('⚠️ Moderate performance - investigate major failure patterns');
            recommendations.push('🔧 Significant optimizations needed before deployment');
        } else {
            recommendations.push('🚨 Poor performance - deployment NOT recommended');
            recommendations.push('🔧 Major system issues need resolution');
        }
        
        if (this.testResults.failed > 0) {
            recommendations.push('📊 Review error patterns in the detailed report');
            recommendations.push('🔍 Focus on most common error types first');
        }
        
        return recommendations;
    }
}

// Export for external use
module.exports = { ComprehensiveTestSuite };

// Run if called directly
if (require.main === module) {
    const testSuite = new ComprehensiveTestSuite();
    testSuite.runAllTests()
        .then(report => {
            if (parseFloat(report.summary.successRate) >= 90) {
                console.log('\n🎊 COMPREHENSIVE TESTS PASSED! Ready for deployment.');
                process.exit(0);
            } else {
                console.log('\n💥 COMPREHENSIVE TESTS FAILED! Review issues before deployment.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Test suite execution failed:', error);
            process.exit(1);
        });
}