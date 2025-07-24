/**
 * Comprehensive Test Suite for Enhanced Hybrid Learning System
 * Tests local functionality, accuracy, and learning capabilities
 */

const { EnhancedHybridLearningSystem } = require('./enhanced-hybrid-learning-system.js');
const fs = require('fs').promises;
const path = require('path');

// Mock PDF text data for testing (based on Messos format)
const MOCK_PDF_TEXT = `
PORTFOLIO OVERVIEW
==================

Securities Holdings - As of 2025-07-22

ISIN: CH0012005267     UBS Group AG                                 850,000
ISIN: XS2746319610     Government Bond Series 2024                 140,000  
ISIN: CH1234567890     Credit Suisse Holdings                     1,200,000
ISIN: XS9876543210     European Investment Bond                     650,000
ISIN: DE0007236101     Siemens AG                                   890,000
ISIN: CH0038863350     Nestlé SA                                  2,100,000
ISIN: US0378331005     Apple Inc.                                 1,450,000
ISIN: NL0000235190     Airbus SE                                    780,000
ISIN: CH0244767585     ABB Ltd                                      920,000
ISIN: XS2407295554     Corporate Bond 2026                         320,000
ISIN: FR0000120578     Sanofi                                       540,000
ISIN: XS2252299883     Infrastructure Bond                          480,000
ISIN: GB0002374006     Diageo plc                                   675,000
ISIN: CH0126881561     Zurich Insurance Group AG                   1,100,000
ISIN: XS1234567890     Municipal Bond 2025                          395,000
ISIN: CH0012221716     ABB Ltd Preferred                            760,000
ISIN: US5949181045     Microsoft Corporation                      1,890,000
ISIN: CH0038389992     BB Biotech AG                                620,000
ISIN: XS8765432109     Green Energy Bond                            410,000
ISIN: DE0008469008     Allianz SE                                   980,000
ISIN: CH0023405456     Swisscom AG                                  850,000
ISIN: US00206R1023     AT&T Inc.                                    560,000
ISIN: XS5432167890     Development Finance Bond                     350,000
ISIN: CH0038389354     Lonza Group AG                               740,000
ISIN: NL0011794037     ASML Holding NV                            1,320,000

Portfolio Total: 19'464'431

END OF DOCUMENT
`;

class HybridLearningTester {
    constructor() {
        this.hybridSystem = new EnhancedHybridLearningSystem();
        this.testResults = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            accuracy: 0,
            cost: 0,
            processingTime: 0
        };
    }
    
    /**
     * Run comprehensive test suite
     */
    async runAllTests() {
        console.log('🧪 Starting Enhanced Hybrid Learning System Tests');
        console.log('='.repeat(60));
        
        try {
            // Test 1: Basic system initialization
            await this.testSystemInitialization();
            
            // Test 2: Base extraction functionality
            await this.testBaseExtraction();
            
            // Test 3: Confidence scoring
            await this.testConfidenceScoring();
            
            // Test 4: AI enhancement trigger
            await this.testAIEnhancement();
            
            // Test 5: Learning pattern application
            await this.testLearningPatterns();
            
            // Test 6: Human annotation processing
            await this.testHumanAnnotations();
            
            // Test 7: Cost calculation accuracy
            await this.testCostCalculation();
            
            // Test 8: End-to-end extraction
            await this.testEndToEndExtraction();
            
            // Test 9: Performance benchmarks
            await this.testPerformanceBenchmarks();
            
            // Test 10: Error handling
            await this.testErrorHandling();
            
            // Display final results
            this.displayTestResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 1: System initialization
     */
    async testSystemInitialization() {
        console.log('\n📋 Test 1: System Initialization');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            // Check if system initialized properly
            const stats = this.hybridSystem.getUsageStats();
            
            this.assert(stats !== undefined, 'Usage stats should be available');
            this.assert(stats.baseExtractions === 0, 'Base extractions should start at 0');
            this.assert(stats.aiEnhancements === 0, 'AI enhancements should start at 0');
            this.assert(stats.totalCost === 0, 'Total cost should start at 0');
            
            console.log('✅ System initialization: PASSED');
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ System initialization: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 2: Base extraction functionality
     */
    async testBaseExtraction() {
        console.log('\n📋 Test 2: Base Extraction');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            const baseResult = this.hybridSystem.performBaseExtraction(MOCK_PDF_TEXT);
            
            this.assert(baseResult.securities.length > 0, 'Should extract securities');
            this.assert(baseResult.totalValue > 0, 'Should calculate total value');
            this.assert(baseResult.count === baseResult.securities.length, 'Count should match securities length');
            
            // Check for known securities in mock data
            const hasUBS = baseResult.securities.some(s => s.isin === 'CH0012005267');
            const hasApple = baseResult.securities.some(s => s.isin === 'US0378331005');
            
            this.assert(hasUBS, 'Should find UBS security');
            this.assert(hasApple, 'Should find Apple security');
            
            console.log(`✅ Base extraction: PASSED (${baseResult.count} securities, $${baseResult.totalValue.toLocaleString()})`);
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ Base extraction: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 3: Confidence scoring
     */
    async testConfidenceScoring() {
        console.log('\n📋 Test 3: Confidence Scoring');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            const baseResult = this.hybridSystem.performBaseExtraction(MOCK_PDF_TEXT);
            const confidence = this.hybridSystem.calculateConfidenceScore(baseResult, MOCK_PDF_TEXT);
            
            this.assert(confidence >= 60, 'Confidence should be at least 60%');
            this.assert(confidence <= 95, 'Confidence should not exceed 95% for base extraction');
            this.assert(typeof confidence === 'number', 'Confidence should be a number');
            
            console.log(`✅ Confidence scoring: PASSED (${confidence.toFixed(2)}%)`);
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ Confidence scoring: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 4: AI enhancement trigger logic
     */
    async testAIEnhancement() {
        console.log('\n📋 Test 4: AI Enhancement Logic');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            // Test complex pattern detection
            const hasComplexPatterns = this.hybridSystem.hasComplexPatterns(MOCK_PDF_TEXT);
            this.assert(typeof hasComplexPatterns === 'boolean', 'Should return boolean for complex patterns');
            
            // Test portfolio total extraction
            const portfolioTotal = this.hybridSystem.extractPortfolioTotal(MOCK_PDF_TEXT);
            this.assert(portfolioTotal === 19464431, 'Should extract correct portfolio total');
            
            console.log(`✅ AI enhancement logic: PASSED (Portfolio total: $${portfolioTotal?.toLocaleString()})`);
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ AI enhancement logic: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 5: Learning pattern application
     */
    async testLearningPatterns() {
        console.log('\n📋 Test 5: Learning Patterns');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            // Test pattern matching
            const mockPattern = {
                documentSignature: 'Portfolio Total',
                description: 'Test pattern',
                confidence: 1.0
            };
            
            const matches = this.hybridSystem.patternMatches(MOCK_PDF_TEXT, mockPattern);
            this.assert(typeof matches === 'boolean', 'Pattern matching should return boolean');
            
            // Test learning pattern application
            const learnedResult = await this.hybridSystem.applyLearningPatterns(MOCK_PDF_TEXT, 'test_doc');
            this.assert(learnedResult.hasOwnProperty('applied'), 'Should have applied property');
            this.assert(learnedResult.hasOwnProperty('patterns'), 'Should have patterns property');
            
            console.log(`✅ Learning patterns: PASSED (Applied: ${learnedResult.applied})`);
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ Learning patterns: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 6: Human annotation processing
     */
    async testHumanAnnotations() {
        console.log('\n📋 Test 6: Human Annotations');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            // Mock annotation data
            const mockAnnotation = {
                documentId: 'test_doc_123',
                extractedSecuritiesCount: 25,
                totalValue: 19500000,
                securities: [
                    {
                        isin: 'CH0012005267',
                        name: 'UBS Group AG',
                        extractedValue: 850000,
                        correctedValue: 900000,
                        correctedName: null,
                        notes: 'Value was slightly underestimated'
                    }
                ],
                missingSecurities: [
                    {
                        isin: 'CH9999999999',
                        name: 'Test Security',
                        marketValue: 500000
                    }
                ],
                overallAccuracy: 95,
                reviewerNotes: 'Overall good extraction quality'
            };
            
            // Test annotation processing
            const result = await this.hybridSystem.processHumanAnnotations(mockAnnotation);
            
            this.assert(result.hasOwnProperty('success'), 'Should have success property');
            this.assert(result.hasOwnProperty('patternsLearned'), 'Should have patternsLearned property');
            
            console.log(`✅ Human annotations: PASSED (Patterns learned: ${result.patternsLearned || 0})`);
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ Human annotations: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 7: Cost calculation accuracy
     */
    async testCostCalculation() {
        console.log('\n📋 Test 7: Cost Calculation');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            const textLength = MOCK_PDF_TEXT.length;
            const cost = this.hybridSystem.calculateCost(textLength);
            
            this.assert(cost > 0, 'Cost should be positive');
            this.assert(cost < 0.1, 'Cost should be reasonable for test document');
            this.assert(typeof cost === 'number', 'Cost should be a number');
            
            console.log(`✅ Cost calculation: PASSED ($${cost.toFixed(6)} for ${textLength} characters)`);
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ Cost calculation: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 8: End-to-end extraction
     */
    async testEndToEndExtraction() {
        console.log('\n📋 Test 8: End-to-End Extraction');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            const startTime = Date.now();
            
            // Run full extraction with learning
            const result = await this.hybridSystem.extractWithLearning(MOCK_PDF_TEXT, 'test_doc_e2e');
            
            const processingTime = Date.now() - startTime;
            
            // Validate result structure
            this.assert(result.hasOwnProperty('securities'), 'Should have securities array');
            this.assert(result.hasOwnProperty('accuracy'), 'Should have accuracy score');
            this.assert(result.hasOwnProperty('method'), 'Should have extraction method');
            this.assert(result.hasOwnProperty('cost'), 'Should have cost calculation');
            this.assert(result.hasOwnProperty('processingTime'), 'Should have processing time');
            
            // Validate accuracy
            this.assert(result.accuracy >= 85, 'Accuracy should be at least 85%');
            this.assert(result.securities.length >= 20, 'Should extract most securities');
            
            this.testResults.accuracy = result.accuracy;
            this.testResults.cost += result.cost;
            this.testResults.processingTime = processingTime;
            
            console.log(`✅ End-to-end extraction: PASSED`);
            console.log(`   - Securities: ${result.securities.length}`);
            console.log(`   - Accuracy: ${result.accuracy.toFixed(2)}%`);
            console.log(`   - Method: ${result.method}`);
            console.log(`   - Cost: $${result.cost.toFixed(6)}`);
            console.log(`   - Time: ${result.processingTime}ms`);
            
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ End-to-end extraction: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 9: Performance benchmarks
     */
    async testPerformanceBenchmarks() {
        console.log('\n📋 Test 9: Performance Benchmarks');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            const runs = 3;
            const times = [];
            
            for (let i = 0; i < runs; i++) {
                const startTime = Date.now();
                await this.hybridSystem.extractWithLearning(MOCK_PDF_TEXT, `bench_${i}`);
                times.push(Date.now() - startTime);
            }
            
            const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
            
            // Performance assertions
            this.assert(avgTime < 5000, 'Average processing time should be under 5 seconds');
            this.assert(times.every(time => time > 0), 'All processing times should be positive');
            
            console.log(`✅ Performance benchmarks: PASSED`);
            console.log(`   - Average time: ${avgTime.toFixed(0)}ms`);
            console.log(`   - Min time: ${Math.min(...times)}ms`);
            console.log(`   - Max time: ${Math.max(...times)}ms`);
            
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ Performance benchmarks: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Test 10: Error handling
     */
    async testErrorHandling() {
        console.log('\n📋 Test 10: Error Handling');
        console.log('-'.repeat(40));
        
        try {
            this.testResults.totalTests++;
            
            // Test with empty text
            const emptyResult = await this.hybridSystem.extractWithLearning('', 'empty_test');
            this.assert(emptyResult.hasOwnProperty('securities'), 'Should handle empty text gracefully');
            
            // Test with malformed text
            const malformedResult = await this.hybridSystem.extractWithLearning('RANDOM NONSENSE TEXT', 'malformed_test');
            this.assert(malformedResult.hasOwnProperty('securities'), 'Should handle malformed text gracefully');
            
            // Test with invalid annotation data
            const invalidAnnotation = { invalid: 'data' };
            const annotationResult = await this.hybridSystem.processHumanAnnotations(invalidAnnotation);
            this.assert(annotationResult !== undefined, 'Should handle invalid annotations gracefully');
            
            console.log(`✅ Error handling: PASSED`);
            this.testResults.passed++;
            
        } catch (error) {
            console.log(`❌ Error handling: FAILED - ${error.message}`);
            this.testResults.failed++;
        }
    }
    
    /**
     * Display comprehensive test results
     */
    displayTestResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏆 ENHANCED HYBRID LEARNING SYSTEM TEST RESULTS');
        console.log('='.repeat(60));
        
        const successRate = (this.testResults.passed / this.testResults.totalTests * 100).toFixed(1);
        
        console.log(`📊 Tests Run: ${this.testResults.totalTests}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📈 Success Rate: ${successRate}%`);
        console.log(`🎯 Extraction Accuracy: ${this.testResults.accuracy.toFixed(2)}%`);
        console.log(`💰 Total Cost: $${this.testResults.cost.toFixed(6)}`);
        console.log(`⏱️  Processing Time: ${this.testResults.processingTime}ms`);
        
        // Overall assessment
        if (this.testResults.failed === 0) {
            console.log('\n🚀 ALL TESTS PASSED! System is ready for deployment.');
        } else if (successRate >= 80) {
            console.log('\n⚠️  Most tests passed. Minor issues may need attention.');
        } else {
            console.log('\n❌ Multiple test failures. System needs debugging before deployment.');
        }
        
        // Generate test report
        this.generateTestReport();
    }
    
    /**
     * Generate detailed test report
     */
    async generateTestReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                systemVersion: '2.0',
                testSuite: 'Enhanced Hybrid Learning System',
                results: this.testResults,
                recommendations: this.generateRecommendations(),
                nextSteps: [
                    'Deploy to Docker environment',
                    'Test with live Render deployment',
                    'Validate with real PDF documents',
                    'Monitor accuracy improvements over time'
                ]
            };
            
            await fs.writeFile(
                path.join(__dirname, 'test-report-hybrid-learning.json'),
                JSON.stringify(report, null, 2)
            );
            
            console.log('\n📝 Test report saved to: test-report-hybrid-learning.json');
            
        } catch (error) {
            console.error('⚠️ Failed to save test report:', error.message);
        }
    }
    
    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.testResults.accuracy < 90) {
            recommendations.push('Consider tuning AI enhancement thresholds');
        }
        
        if (this.testResults.processingTime > 3000) {
            recommendations.push('Optimize processing speed for better user experience');
        }
        
        if (this.testResults.cost > 0.01) {
            recommendations.push('Review cost optimization strategies');
        }
        
        if (this.testResults.failed > 0) {
            recommendations.push('Address failed test cases before production deployment');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System performing excellently - ready for production');
        }
        
        return recommendations;
    }
    
    /**
     * Simple assertion helper
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new HybridLearningTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = { HybridLearningTester };