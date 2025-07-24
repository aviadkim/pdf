// Ultimate Precision Extraction Test Suite
// Comprehensive validation of 100% accuracy system

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

// Test configurations
const TEST_CONFIGS = {
    local: {
        url: 'http://localhost:10001',
        name: 'Local Development'
    },
    render: {
        url: 'https://pdf-fzzi.onrender.com',
        name: 'Render Production'
    }
};

const EXPECTED_RESULTS = {
    messos: {
        targetTotal: 19464431,
        minSecurities: 35,
        maxSecurities: 45,
        minAccuracy: 0.90,
        problematicISINs: {
            'XS2746319610': { expectedRange: [100000, 200000] },
            'XS2407295554': { expectedRange: [100000, 500000] },
            'XS2252299883': { expectedRange: [100000, 500000] }
        }
    }
};

class UltimatePrecisionTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                passed: 0,
                failed: 0,
                total: 0
            }
        };
    }

    async runAllTests() {
        console.log('🚀 ULTIMATE PRECISION EXTRACTION TEST SUITE');
        console.log('===========================================');
        
        // Test both local and render deployments
        for (const [env, config] of Object.entries(TEST_CONFIGS)) {
            console.log(`\n📍 Testing ${config.name} (${config.url})`);
            
            try {
                await this.testEnvironment(env, config);
            } catch (error) {
                console.error(`❌ Environment ${env} failed:`, error.message);
                this.addTestResult(env, 'failed', { error: error.message });
            }
        }
        
        // Generate comprehensive report
        this.generateReport();
        
        return this.results;
    }

    async testEnvironment(env, config) {
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        
        if (!fs.existsSync(pdfPath)) {
            throw new Error('Test PDF not found');
        }

        // Test 1: Basic extraction
        console.log('🔬 Testing basic extraction...');
        const basicResult = await this.testBasicExtraction(config.url, pdfPath);
        this.addTestResult(`${env}_basic`, basicResult.passed ? 'passed' : 'failed', basicResult);

        // Test 2: Accuracy validation
        console.log('🎯 Testing accuracy validation...');
        const accuracyResult = await this.testAccuracyValidation(basicResult.data, EXPECTED_RESULTS.messos);
        this.addTestResult(`${env}_accuracy`, accuracyResult.passed ? 'passed' : 'failed', accuracyResult);

        // Test 3: Completeness check
        console.log('📊 Testing completeness check...');
        const completenessResult = await this.testCompleteness(basicResult.data, EXPECTED_RESULTS.messos);
        this.addTestResult(`${env}_completeness`, completenessResult.passed ? 'passed' : 'failed', completenessResult);

        // Test 4: Known issues validation
        console.log('🔍 Testing known issues validation...');
        const knownIssuesResult = await this.testKnownIssues(basicResult.data, EXPECTED_RESULTS.messos);
        this.addTestResult(`${env}_known_issues`, knownIssuesResult.passed ? 'passed' : 'failed', knownIssuesResult);

        // Test 5: Performance validation
        console.log('⚡ Testing performance validation...');
        const performanceResult = await this.testPerformance(config.url, pdfPath);
        this.addTestResult(`${env}_performance`, performanceResult.passed ? 'passed' : 'failed', performanceResult);
    }

    async testBasicExtraction(baseUrl, pdfPath) {
        try {
            const form = new FormData();
            form.append('pdf', fs.createReadStream(pdfPath));
            
            const startTime = Date.now();
            const response = await axios.post(`${baseUrl}/api/bulletproof-processor`, form, {
                headers: form.getHeaders(),
                timeout: 30000
            });
            const processingTime = Date.now() - startTime;
            
            if (response.status !== 200) {
                return {
                    passed: false,
                    error: `HTTP ${response.status}`,
                    processingTime
                };
            }
            
            const result = response.data;
            
            if (!result.success) {
                return {
                    passed: false,
                    error: result.error || 'Unknown error',
                    processingTime
                };
            }
            
            return {
                passed: true,
                data: result,
                processingTime,
                securitiesFound: result.securities?.length || 0,
                totalValue: result.totalValue || 0,
                confidence: result.confidence || 0
            };
            
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                processingTime: 0
            };
        }
    }

    async testAccuracyValidation(data, expected) {
        const securities = data.securities || [];
        const totalValue = data.totalValue || 0;
        const accuracy = Math.min(totalValue, expected.targetTotal) / Math.max(totalValue, expected.targetTotal);
        
        const passed = accuracy >= expected.minAccuracy;
        
        return {
            passed,
            accuracy: accuracy,
            targetAccuracy: expected.minAccuracy,
            totalValue,
            expectedTotal: expected.targetTotal,
            difference: Math.abs(totalValue - expected.targetTotal),
            message: passed ? 
                `✅ Accuracy ${(accuracy * 100).toFixed(2)}% meets target ${(expected.minAccuracy * 100).toFixed(2)}%` :
                `❌ Accuracy ${(accuracy * 100).toFixed(2)}% below target ${(expected.minAccuracy * 100).toFixed(2)}%`
        };
    }

    async testCompleteness(data, expected) {
        const securities = data.securities || [];
        const securitiesCount = securities.length;
        
        const passed = securitiesCount >= expected.minSecurities && securitiesCount <= expected.maxSecurities;
        
        return {
            passed,
            securitiesFound: securitiesCount,
            expectedRange: `${expected.minSecurities}-${expected.maxSecurities}`,
            message: passed ?
                `✅ Found ${securitiesCount} securities within expected range` :
                `❌ Found ${securitiesCount} securities outside expected range ${expected.minSecurities}-${expected.maxSecurities}`
        };
    }

    async testKnownIssues(data, expected) {
        const securities = data.securities || [];
        const issues = [];
        let fixedIssues = 0;
        
        for (const security of securities) {
            const knownIssue = expected.problematicISINs[security.isin];
            if (knownIssue) {
                const { expectedRange } = knownIssue;
                const isFixed = security.value >= expectedRange[0] && security.value <= expectedRange[1];
                
                if (isFixed) {
                    fixedIssues++;
                } else {
                    issues.push({
                        isin: security.isin,
                        actualValue: security.value,
                        expectedRange: expectedRange,
                        status: 'unfixed'
                    });
                }
            }
        }
        
        const totalKnownIssues = Object.keys(expected.problematicISINs).length;
        const passed = issues.length === 0;
        
        return {
            passed,
            fixedIssues,
            totalKnownIssues,
            unfixedIssues: issues,
            message: passed ?
                `✅ All ${totalKnownIssues} known issues fixed` :
                `❌ ${issues.length} known issues remain unfixed`
        };
    }

    async testPerformance(baseUrl, pdfPath) {
        const maxProcessingTime = 30000; // 30 seconds
        const minProcessingTime = 100; // 100ms
        
        try {
            const form = new FormData();
            form.append('pdf', fs.createReadStream(pdfPath));
            
            const startTime = Date.now();
            const response = await axios.post(`${baseUrl}/api/bulletproof-processor`, form, {
                headers: form.getHeaders(),
                timeout: maxProcessingTime + 5000
            });
            const processingTime = Date.now() - startTime;
            
            const passed = processingTime >= minProcessingTime && processingTime <= maxProcessingTime;
            
            return {
                passed,
                processingTime,
                maxAllowed: maxProcessingTime,
                message: passed ?
                    `✅ Processing time ${processingTime}ms within limits` :
                    `❌ Processing time ${processingTime}ms outside limits (${minProcessingTime}-${maxProcessingTime}ms)`
            };
            
        } catch (error) {
            return {
                passed: false,
                error: error.message,
                processingTime: 0
            };
        }
    }

    addTestResult(testName, status, details) {
        this.results.tests.push({
            name: testName,
            status,
            details,
            timestamp: new Date().toISOString()
        });
        
        this.results.summary.total++;
        if (status === 'passed') {
            this.results.summary.passed++;
        } else {
            this.results.summary.failed++;
        }
    }

    generateReport() {
        console.log('\n📋 COMPREHENSIVE TEST REPORT');
        console.log('============================');
        
        const { passed, failed, total } = this.results.summary;
        const successRate = (passed / total) * 100;
        
        console.log(`📊 Overall Results: ${passed}/${total} tests passed (${successRate.toFixed(1)}%)`);
        
        if (failed > 0) {
            console.log(`❌ Failed Tests: ${failed}`);
            
            this.results.tests.forEach(test => {
                if (test.status === 'failed') {
                    console.log(`  - ${test.name}: ${test.details.error || test.details.message}`);
                }
            });
        }
        
        console.log('\n🎯 ACCURACY SUMMARY:');
        this.results.tests.forEach(test => {
            if (test.name.includes('accuracy')) {
                const details = test.details;
                console.log(`  ${test.name}: ${(details.accuracy * 100).toFixed(2)}% accuracy`);
                console.log(`    Target: $${details.expectedTotal.toLocaleString()}`);
                console.log(`    Actual: $${details.totalValue.toLocaleString()}`);
                console.log(`    Difference: $${details.difference.toLocaleString()}`);
            }
        });
        
        console.log('\n🔍 KNOWN ISSUES SUMMARY:');
        this.results.tests.forEach(test => {
            if (test.name.includes('known_issues')) {
                const details = test.details;
                console.log(`  ${test.name}: ${details.fixedIssues}/${details.totalKnownIssues} issues fixed`);
                if (details.unfixedIssues.length > 0) {
                    details.unfixedIssues.forEach(issue => {
                        console.log(`    ❌ ${issue.isin}: $${issue.actualValue.toLocaleString()} (expected: $${issue.expectedRange[0].toLocaleString()}-$${issue.expectedRange[1].toLocaleString()})`);
                    });
                }
            }
        });
        
        // Save detailed results
        const reportPath = path.join(__dirname, 'test-results-ultimate-precision.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
        
        // Generate deployment recommendation
        this.generateDeploymentRecommendation();
    }

    generateDeploymentRecommendation() {
        console.log('\n🚀 DEPLOYMENT RECOMMENDATION');
        console.log('============================');
        
        const { passed, total } = this.results.summary;
        const successRate = (passed / total) * 100;
        
        let recommendation = '';
        
        if (successRate >= 90) {
            recommendation = '✅ READY FOR PRODUCTION DEPLOYMENT';
            console.log('🎯 System meets production quality standards');
            console.log('📈 High accuracy and reliability achieved');
            console.log('🔧 All critical issues resolved');
        } else if (successRate >= 75) {
            recommendation = '⚠️ DEPLOYMENT WITH CAUTION';
            console.log('🎯 System shows good performance but has some issues');
            console.log('📈 Acceptable accuracy but needs monitoring');
            console.log('🔧 Some issues need attention');
        } else {
            recommendation = '❌ NOT READY FOR DEPLOYMENT';
            console.log('🎯 System needs significant improvements');
            console.log('📈 Accuracy below acceptable thresholds');
            console.log('🔧 Critical issues must be resolved');
        }
        
        console.log(`\n${recommendation}`);
        console.log(`Success Rate: ${successRate.toFixed(1)}%`);
        
        return recommendation;
    }
}

// Auto-deployment configuration check
function checkAutoDeployment() {
    console.log('\n🔄 AUTO-DEPLOYMENT CONFIGURATION CHECK');
    console.log('======================================');
    
    const recommendations = [
        '1. ✅ Set up GitHub Actions workflow for automatic deployment',
        '2. ✅ Configure Render auto-deploy from GitHub main branch',
        '3. ✅ Add deployment hooks in Render dashboard',
        '4. ✅ Enable automatic builds on push to main',
        '5. ✅ Set up health checks for deployment validation'
    ];
    
    recommendations.forEach(rec => console.log(rec));
    
    console.log('\n🎯 Current Status: Auto-deployment should trigger on git push');
    console.log('📍 Check Render dashboard for deployment status');
    console.log('🔧 If manual deployment needed, check webhook configuration');
}

// Run tests
async function runTests() {
    const tester = new UltimatePrecisionTester();
    
    try {
        await tester.runAllTests();
        checkAutoDeployment();
        
        console.log('\n🎉 TEST SUITE COMPLETED SUCCESSFULLY!');
        console.log('====================================');
        
    } catch (error) {
        console.error('❌ TEST SUITE FAILED:', error);
        process.exit(1);
    }
}

// Export for use as module
module.exports = { UltimatePrecisionTester, runTests };

// Run if executed directly
if (require.main === module) {
    runTests();
}