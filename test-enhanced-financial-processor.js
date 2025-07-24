#!/usr/bin/env node

/**
 * COMPREHENSIVE TEST SUITE FOR ENHANCED FINANCIAL PROCESSOR
 * 
 * Tests the complete enhanced financial document processing system with:
 * - Universal Financial Parser
 * - Document Type Detection
 * - Specialized Parsers
 * - Learning System Integration
 * - Messos PDF Validation
 */

const { EnhancedFinancialProcessor } = require('./enhanced-financial-processor');
const fs = require('fs').promises;
const path = require('path');

class EnhancedFinancialProcessorTest {
    constructor() {
        this.processor = new EnhancedFinancialProcessor();
        this.messosPdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        this.testResults = {
            tests: [],
            summary: {},
            messos: {},
            performance: {}
        };
    }

    async runComprehensiveTests() {
        console.log('🧪 ENHANCED FINANCIAL PROCESSOR COMPREHENSIVE TESTING');
        console.log('====================================================');
        console.log(`📅 Test started: ${new Date().toLocaleString()}`);
        console.log('');

        const startTime = Date.now();

        try {
            // Test 1: Messos PDF Processing
            await this.testMessosPDFProcessing();

            // Test 2: Document Type Detection
            await this.testDocumentTypeDetection();

            // Test 3: Learning System Integration
            await this.testLearningSystemIntegration();

            // Test 4: Annotation Processing
            await this.testAnnotationProcessing();

            // Test 5: Validation System
            await this.testValidationSystem();

            // Test 6: Performance Benchmarks
            await this.testPerformanceBenchmarks();

            // Generate comprehensive report
            const totalTime = Date.now() - startTime;
            await this.generateTestReport(totalTime);

            console.log('\n🎉 COMPREHENSIVE TESTING COMPLETED!');
            console.log('===================================');
            console.log(`⏱️  Total test time: ${totalTime}ms`);
            console.log(`✅ Tests passed: ${this.testResults.tests.filter(t => t.passed).length}`);
            console.log(`❌ Tests failed: ${this.testResults.tests.filter(t => !t.passed).length}`);
            console.log(`📊 Overall success rate: ${this.calculateSuccessRate()}%`);

            return this.testResults;

        } catch (error) {
            console.error('❌ Comprehensive testing failed:', error.message);
            console.error(error.stack);
            throw error;
        }
    }

    async testMessosPDFProcessing() {
        console.log('1️⃣ TESTING MESSOS PDF PROCESSING');
        console.log('=================================');

        try {
            // Check if Messos PDF exists
            const pdfExists = await fs.access(this.messosPdfPath).then(() => true).catch(() => false);
            if (!pdfExists) {
                throw new Error('Messos PDF not found');
            }

            console.log(`📄 Processing: ${this.messosPdfPath}`);

            // Process the Messos PDF
            const startTime = Date.now();
            const result = await this.processor.processFinancialDocument(this.messosPdfPath);
            const processingTime = Date.now() - startTime;

            // Validate results
            const validation = this.validateMessosResults(result);

            this.testResults.messos = {
                success: result.success,
                processingTime,
                validation,
                result
            };

            // Record test results
            this.addTestResult('Messos PDF Processing', result.success, {
                processingTime,
                documentType: result.detection?.documentType,
                confidence: result.analysis?.confidence,
                securitiesFound: result.financialData?.securities?.length,
                validation
            });

            console.log(`✅ Messos PDF processed successfully`);
            console.log(`📋 Document type: ${result.detection?.documentType}`);
            console.log(`📊 Confidence: ${result.analysis?.confidence}%`);
            console.log(`💰 Securities found: ${result.financialData?.securities?.length}`);
            console.log(`⏱️  Processing time: ${processingTime}ms`);

            // Display sample securities
            if (result.financialData?.securities?.length > 0) {
                console.log('\n🔍 Sample Securities:');
                result.financialData.securities.slice(0, 5).forEach((security, index) => {
                    console.log(`   ${index + 1}. ${security.isin}`);
                    console.log(`      Name: ${security.name || security.fullName || 'Not extracted'}`);
                    console.log(`      Value: ${security.value || security.marketValue || 'Not extracted'}`);
                    console.log(`      Type: ${security.type || security.securityType || 'Not classified'}`);
                });
            }

            // Display portfolio summary
            if (result.financialData?.portfolio) {
                console.log('\n💼 Portfolio Summary:');
                console.log(`   Total Value: ${result.financialData.portfolio.totalValue || 'Not extracted'}`);
                console.log(`   Valuation Date: ${result.financialData.portfolio.valuationDate || 'Not extracted'}`);
                console.log(`   Base Currency: ${result.financialData.portfolio.currency || 'Not extracted'}`);
                
                if (result.financialData.portfolio.allocations) {
                    console.log('   Asset Allocations:');
                    Object.entries(result.financialData.portfolio.allocations).forEach(([type, allocation]) => {
                        console.log(`     ${type}: ${allocation.value || allocation} (${allocation.percentage || 'N/A'}%)`);
                    });
                }
            }

        } catch (error) {
            console.error('❌ Messos PDF processing test failed:', error.message);
            this.addTestResult('Messos PDF Processing', false, { error: error.message });
        }
    }

    validateMessosResults(result) {
        const validation = {
            scores: {},
            issues: [],
            recommendations: []
        };

        // Validate document type detection
        if (result.detection?.documentType === 'messos-corner-banca') {
            validation.scores.documentType = 100;
        } else {
            validation.scores.documentType = 0;
            validation.issues.push('Document type not correctly identified as messos-corner-banca');
        }

        // Validate securities extraction
        const securities = result.financialData?.securities || [];
        if (securities.length >= 35) { // Expecting around 40 securities
            validation.scores.securitiesCount = 100;
        } else if (securities.length >= 20) {
            validation.scores.securitiesCount = 75;
        } else {
            validation.scores.securitiesCount = 50;
            validation.issues.push(`Only ${securities.length} securities found, expected ~40`);
        }

        // Validate security names
        const securitiesWithNames = securities.filter(s => s.name || s.fullName).length;
        const nameScore = securities.length > 0 ? (securitiesWithNames / securities.length) * 100 : 0;
        validation.scores.securityNames = Math.round(nameScore);
        
        if (nameScore < 50) {
            validation.issues.push(`Only ${securitiesWithNames}/${securities.length} securities have names extracted`);
        }

        // Validate security values
        const securitiesWithValues = securities.filter(s => s.value || s.marketValue).length;
        const valueScore = securities.length > 0 ? (securitiesWithValues / securities.length) * 100 : 0;
        validation.scores.securityValues = Math.round(valueScore);
        
        if (valueScore < 50) {
            validation.issues.push(`Only ${securitiesWithValues}/${securities.length} securities have values extracted`);
        }

        // Validate portfolio data
        const portfolio = result.financialData?.portfolio || {};
        let portfolioScore = 0;
        if (portfolio.totalValue) portfolioScore += 40;
        if (portfolio.valuationDate) portfolioScore += 20;
        if (portfolio.currency) portfolioScore += 20;
        if (Object.keys(portfolio.allocations || {}).length > 0) portfolioScore += 20;
        
        validation.scores.portfolioData = portfolioScore;
        
        if (portfolioScore < 60) {
            validation.issues.push('Portfolio data extraction incomplete');
        }

        // Calculate overall score
        const scores = Object.values(validation.scores);
        validation.overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        // Generate recommendations
        if (validation.overallScore < 80) {
            validation.recommendations.push('Consider using annotation tools to improve extraction accuracy');
        }
        
        if (validation.scores.securityNames < 70) {
            validation.recommendations.push('Mark security names in the document for better name extraction');
        }
        
        if (validation.scores.securityValues < 70) {
            validation.recommendations.push('Annotate security values to improve value extraction patterns');
        }

        return validation;
    }

    async testDocumentTypeDetection() {
        console.log('\n2️⃣ TESTING DOCUMENT TYPE DETECTION');
        console.log('===================================');

        try {
            // Test with sample text snippets
            const testCases = [
                {
                    name: 'Messos/Cornèr Banca',
                    text: 'Cornèr Banca SA MESSOS ENTERPRISES LTD. Valuation as of 31.03.2025 Swift CBLUCH2280A',
                    expected: 'messos-corner-banca'
                },
                {
                    name: 'UBS Portfolio',
                    text: 'UBS Switzerland AG Portfolio Report Investment Advisory UBSWCHZH',
                    expected: 'ubs-portfolio'
                },
                {
                    name: 'Generic Portfolio',
                    text: 'Portfolio Asset Allocation Performance Holdings Investment Summary',
                    expected: 'generic-portfolio'
                }
            ];

            let passed = 0;
            for (const testCase of testCases) {
                const detection = this.processor.documentDetector.detectDocumentType(testCase.text);
                const success = detection.type === testCase.expected;
                
                console.log(`   ${testCase.name}: ${success ? '✅' : '❌'} (detected: ${detection.type}, confidence: ${(detection.confidence * 100).toFixed(1)}%)`);
                
                if (success) passed++;
            }

            const successRate = (passed / testCases.length) * 100;
            this.addTestResult('Document Type Detection', successRate >= 80, {
                passed,
                total: testCases.length,
                successRate
            });

        } catch (error) {
            console.error('❌ Document type detection test failed:', error.message);
            this.addTestResult('Document Type Detection', false, { error: error.message });
        }
    }

    async testLearningSystemIntegration() {
        console.log('\n3️⃣ TESTING LEARNING SYSTEM INTEGRATION');
        console.log('=======================================');

        try {
            // Test learning system initialization
            const learningStats = await this.processor.learningSystem.getLearningStats();
            console.log(`📚 Learning system initialized: ${learningStats.totalAnnotations} annotations stored`);

            // Test pattern retrieval
            const patterns = await this.processor.learningSystem.getLearnedPatterns('messos-corner-banca');
            console.log(`🎯 Learned patterns available: ${Object.keys(patterns).length} pattern types`);

            this.addTestResult('Learning System Integration', true, {
                annotationsStored: learningStats.totalAnnotations,
                patternsAvailable: Object.keys(patterns).length,
                averageConfidence: learningStats.averageConfidence
            });

        } catch (error) {
            console.error('❌ Learning system integration test failed:', error.message);
            this.addTestResult('Learning System Integration', false, { error: error.message });
        }
    }

    async testAnnotationProcessing() {
        console.log('\n4️⃣ TESTING ANNOTATION PROCESSING');
        console.log('=================================');

        try {
            // Test annotation processing with sample data
            const sampleAnnotation = {
                type: 'security_name_correction',
                documentType: 'messos-corner-banca',
                originalText: 'ISIN: XS2530201644 TORONTO DOMINION BANK',
                correctedData: {
                    securityName: 'TORONTO DOMINION BANK NOTES 23-23.02.27 REG-S VRN'
                },
                confidence: 1.0,
                userFeedback: 'Corrected security name extraction'
            };

            const annotationResult = await this.processor.processAnnotation(sampleAnnotation);
            
            console.log(`📝 Annotation processed: ${annotationResult.success ? '✅' : '❌'}`);
            if (annotationResult.success) {
                console.log(`   Annotation ID: ${annotationResult.annotationId}`);
                console.log(`   Improvements generated: ${annotationResult.improvements}`);
            }

            this.addTestResult('Annotation Processing', annotationResult.success, annotationResult);

        } catch (error) {
            console.error('❌ Annotation processing test failed:', error.message);
            this.addTestResult('Annotation Processing', false, { error: error.message });
        }
    }

    async testValidationSystem() {
        console.log('\n5️⃣ TESTING VALIDATION SYSTEM');
        console.log('=============================');

        try {
            // Create mock original result and user validation
            const mockOriginalResult = {
                detection: { documentType: 'messos-corner-banca' },
                extraction: { text: 'Sample text' },
                financialData: {
                    securities: [
                        { isin: 'XS2530201644', name: 'TORONTO DOMINION', value: '199080' }
                    ],
                    portfolio: { totalValue: '19464431' },
                    performance: { ytd: '1.52%' }
                }
            };

            const mockUserValidation = {
                securities: [
                    { isin: 'XS2530201644', name: 'TORONTO DOMINION BANK NOTES 23-23.02.27', value: '199080' }
                ],
                portfolio: { totalValue: '19464431' },
                performance: { ytd: '1.52%' },
                confidence: 0.9,
                feedback: 'Corrected security name'
            };

            const validationResult = await this.processor.validateExtraction(mockOriginalResult, mockUserValidation);
            
            console.log(`✅ Validation processed: ${validationResult.success ? '✅' : '❌'}`);
            if (validationResult.success) {
                console.log(`   Corrections found: ${validationResult.corrections}`);
                console.log(`   Learning result: ${validationResult.learningResult.success ? 'Success' : 'Failed'}`);
            }

            this.addTestResult('Validation System', validationResult.success, validationResult);

        } catch (error) {
            console.error('❌ Validation system test failed:', error.message);
            this.addTestResult('Validation System', false, { error: error.message });
        }
    }

    async testPerformanceBenchmarks() {
        console.log('\n6️⃣ TESTING PERFORMANCE BENCHMARKS');
        console.log('==================================');

        try {
            const performanceTests = [];

            // Test processing speed with Messos PDF (if available)
            const pdfExists = await fs.access(this.messosPdfPath).then(() => true).catch(() => false);
            if (pdfExists) {
                const startTime = Date.now();
                const result = await this.processor.processFinancialDocument(this.messosPdfPath);
                const processingTime = Date.now() - startTime;

                performanceTests.push({
                    test: 'Messos PDF Processing Speed',
                    time: processingTime,
                    success: result.success,
                    benchmark: processingTime < 10000 // Should complete in under 10 seconds
                });

                console.log(`⚡ Messos PDF processing: ${processingTime}ms (${processingTime < 10000 ? '✅' : '❌'})`);
            }

            // Test memory usage
            const memoryUsage = process.memoryUsage();
            performanceTests.push({
                test: 'Memory Usage',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                benchmark: memoryUsage.heapUsed < 500 * 1024 * 1024 // Under 500MB
            });

            console.log(`💾 Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB heap used`);

            this.testResults.performance = performanceTests;

            const allBenchmarksPassed = performanceTests.every(test => test.benchmark);
            this.addTestResult('Performance Benchmarks', allBenchmarksPassed, { tests: performanceTests });

        } catch (error) {
            console.error('❌ Performance benchmarks test failed:', error.message);
            this.addTestResult('Performance Benchmarks', false, { error: error.message });
        }
    }

    addTestResult(testName, passed, details = {}) {
        this.testResults.tests.push({
            name: testName,
            passed,
            timestamp: new Date().toISOString(),
            details
        });
    }

    calculateSuccessRate() {
        const total = this.testResults.tests.length;
        const passed = this.testResults.tests.filter(t => t.passed).length;
        return total > 0 ? Math.round((passed / total) * 100) : 0;
    }

    async generateTestReport(totalTime) {
        const report = {
            summary: {
                totalTests: this.testResults.tests.length,
                passed: this.testResults.tests.filter(t => t.passed).length,
                failed: this.testResults.tests.filter(t => !t.passed).length,
                successRate: this.calculateSuccessRate(),
                totalTime
            },
            tests: this.testResults.tests,
            messos: this.testResults.messos,
            performance: this.testResults.performance,
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };

        // Save test report
        const reportPath = `enhanced-financial-processor-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

        console.log(`\n📊 Test report saved: ${reportPath}`);
        this.testResults.summary = report.summary;

        return report;
    }
}

async function main() {
    const tester = new EnhancedFinancialProcessorTest();
    await tester.runComprehensiveTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { EnhancedFinancialProcessorTest };
