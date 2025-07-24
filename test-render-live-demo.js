#!/usr/bin/env node

/**
 * COMPREHENSIVE RENDER LIVE DEMO TESTS
 * Test all new optimized endpoints on the deployed Render system
 * Demonstrate the complete accuracy optimization results
 */

const fs = require('fs');
const path = require('path');

class RenderLiveDemoTests {
    constructor() {
        this.renderBaseURL = 'https://pdf-fzzi.onrender.com';
        this.testPDF = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {}
        };
    }

    async runComprehensiveLiveDemo() {
        console.log('🚀 COMPREHENSIVE RENDER LIVE DEMO TESTS');
        console.log('=======================================');
        console.log('Testing all optimized endpoints on deployed Render system');
        console.log(`🌐 Target: ${this.renderBaseURL}`);
        console.log('');

        try {
            // Test 1: Check if system is online
            console.log('📡 TEST 1: System Connectivity');
            await this.testSystemConnectivity();

            // Test 2: System capabilities discovery
            console.log('\n🔍 TEST 2: System Capabilities Discovery');
            await this.testSystemCapabilities();

            // Test 3: Original bulletproof processor
            console.log('\n🎯 TEST 3: Original Bulletproof Processor');
            await this.testBulletproofProcessor();

            // Test 4: Ultra-Accurate Extraction Engine
            console.log('\n🚀 TEST 4: Ultra-Accurate Extraction Engine');
            await this.testUltraAccurateExtraction();

            // Test 5: Phase 2 Enhanced Extraction
            console.log('\n🎯 TEST 5: Phase 2 Enhanced Extraction');
            await this.testPhase2EnhancedExtraction();

            // Test 6: Mistral OCR Integration
            console.log('\n🔮 TEST 6: Mistral OCR Integration');
            await this.testMistralOCRIntegration();

            // Test 7: Performance comparison
            console.log('\n📊 TEST 7: Performance Comparison');
            await this.performanceComparison();

            // Generate final summary
            this.generateFinalSummary();
            
            // Save results
            await this.saveResults();

            console.log('\n🏆 LIVE DEMO TESTS COMPLETE!');
            console.log(`📊 Tests completed: ${this.results.tests.length}`);
            console.log(`✅ Successful: ${this.results.tests.filter(t => t.success).length}`);
            console.log(`❌ Failed: ${this.results.tests.filter(t => !t.success).length}`);

            return this.results;

        } catch (error) {
            console.error('❌ Live demo tests failed:', error.message);
            throw error;
        }
    }

    async testSystemConnectivity() {
        console.log('  📡 Testing basic connectivity...');
        
        const test = {
            name: 'System Connectivity',
            endpoint: this.renderBaseURL,
            success: false,
            details: {}
        };

        try {
            const response = await fetch(this.renderBaseURL);
            
            test.success = response.ok;
            test.details = {
                status: response.status,
                statusText: response.statusText,
                accessible: response.ok
            };

            console.log(`    ${test.success ? '✅' : '❌'} Status: ${response.status} ${response.statusText}`);
            
        } catch (error) {
            test.details.error = error.message;
            console.log(`    ❌ Connection failed: ${error.message}`);
        }

        this.results.tests.push(test);
    }

    async testSystemCapabilities() {
        console.log('  🔍 Testing system capabilities endpoint...');
        
        const test = {
            name: 'System Capabilities',
            endpoint: '/api/system-capabilities',
            success: false,
            details: {}
        };

        try {
            const response = await fetch(`${this.renderBaseURL}/api/system-capabilities`);
            
            if (response.ok) {
                const data = await response.json();
                test.success = true;
                test.details = {
                    system: data.system,
                    capabilities: Object.keys(data.capabilities || {}),
                    mistral_configured: data.environment?.mistral_api_configured || false,
                    endpoints_available: Object.values(data.capabilities || {}).map(cap => cap.endpoint).filter(Boolean)
                };

                console.log(`    ✅ System: ${data.system}`);
                console.log(`    📊 Capabilities: ${test.details.capabilities.length}`);
                console.log(`    🔮 Mistral: ${test.details.mistral_configured ? 'Configured' : 'Not configured'}`);
                console.log(`    🌐 Endpoints: ${test.details.endpoints_available.length}`);
                
            } else {
                test.details = {
                    status: response.status,
                    error: 'Endpoint not available'
                };
                console.log(`    ❌ Status: ${response.status} - Endpoint not deployed yet`);
            }
            
        } catch (error) {
            test.details.error = error.message;
            console.log(`    ❌ Request failed: ${error.message}`);
        }

        this.results.tests.push(test);
    }

    async testBulletproofProcessor() {
        console.log('  🎯 Testing original bulletproof processor...');
        
        const test = {
            name: 'Bulletproof Processor',
            endpoint: '/api/bulletproof-processor',
            success: false,
            details: {}
        };

        try {
            if (!fs.existsSync(this.testPDF)) {
                throw new Error('Test PDF not found');
            }

            console.log('    📄 Uploading Messos PDF...');
            
            const formData = new FormData();
            const pdfBuffer = fs.readFileSync(this.testPDF);
            const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
            formData.append('pdf', pdfBlob, 'messos-test.pdf');

            const startTime = Date.now();
            const response = await fetch(`${this.renderBaseURL}/api/bulletproof-processor`, {
                method: 'POST',
                body: formData
            });
            const processingTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                test.success = true;
                test.details = {
                    processing_time: processingTime,
                    securities_found: data.securities?.length || 0,
                    total_value: data.total_value || 0,
                    accuracy: data.accuracy || 0,
                    method: data.method || 'bulletproof-processor'
                };

                console.log(`    ✅ Processing time: ${processingTime}ms`);
                console.log(`    📊 Securities found: ${test.details.securities_found}`);
                console.log(`    💰 Total value: $${test.details.total_value.toLocaleString()}`);
                console.log(`    🎯 Accuracy: ${test.details.accuracy}%`);
                
            } else {
                const errorText = await response.text();
                test.details = {
                    status: response.status,
                    error: errorText,
                    processing_time: processingTime
                };
                console.log(`    ❌ Status: ${response.status}`);
                console.log(`    ❌ Error: ${errorText.slice(0, 100)}...`);
            }
            
        } catch (error) {
            test.details.error = error.message;
            console.log(`    ❌ Test failed: ${error.message}`);
        }

        this.results.tests.push(test);
    }

    async testUltraAccurateExtraction() {
        console.log('  🚀 Testing ultra-accurate extraction engine...');
        
        const test = {
            name: 'Ultra-Accurate Extraction',
            endpoint: '/api/ultra-accurate-extract',
            success: false,
            details: {}
        };

        try {
            if (!fs.existsSync(this.testPDF)) {
                throw new Error('Test PDF not found');
            }

            console.log('    📄 Testing with ultra-accurate engine...');
            
            const formData = new FormData();
            const pdfBuffer = fs.readFileSync(this.testPDF);
            const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
            formData.append('pdf', pdfBlob, 'messos-ultra-test.pdf');

            const startTime = Date.now();
            const response = await fetch(`${this.renderBaseURL}/api/ultra-accurate-extract`, {
                method: 'POST',
                body: formData
            });
            const processingTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                test.success = true;
                test.details = {
                    processing_time: processingTime,
                    accuracy_metrics: data.accuracy_metrics,
                    securities_found: data.extraction_results?.securities_found || 0,
                    total_value: data.extraction_results?.total_value || 0,
                    target_achieved: data.accuracy_metrics?.target_achieved || false,
                    method: data.method
                };

                console.log(`    ✅ Processing time: ${processingTime}ms`);
                console.log(`    🎯 Overall accuracy: ${test.details.accuracy_metrics?.overall_accuracy || 0}%`);
                console.log(`    💰 Value accuracy: ${test.details.accuracy_metrics?.value_accuracy || 0}%`);
                console.log(`    📊 Securities found: ${test.details.securities_found}`);
                console.log(`    🏆 Target achieved: ${test.details.target_achieved ? 'YES' : 'NO'}`);
                
            } else {
                const errorText = await response.text();
                test.details = {
                    status: response.status,
                    error: errorText,
                    processing_time: processingTime
                };
                console.log(`    ❌ Status: ${response.status}`);
                console.log(`    ❌ Error: ${errorText.slice(0, 100)}...`);
            }
            
        } catch (error) {
            test.details.error = error.message;
            console.log(`    ❌ Test failed: ${error.message}`);
        }

        this.results.tests.push(test);
    }

    async testPhase2EnhancedExtraction() {
        console.log('  🎯 Testing Phase 2 enhanced extraction...');
        
        const test = {
            name: 'Phase 2 Enhanced Extraction',
            endpoint: '/api/phase2-enhanced-extract',
            success: false,
            details: {}
        };

        try {
            if (!fs.existsSync(this.testPDF)) {
                throw new Error('Test PDF not found');
            }

            console.log('    📄 Testing with Phase 2 engine...');
            
            const formData = new FormData();
            const pdfBuffer = fs.readFileSync(this.testPDF);
            const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
            formData.append('pdf', pdfBlob, 'messos-phase2-test.pdf');

            const startTime = Date.now();
            const response = await fetch(`${this.renderBaseURL}/api/phase2-enhanced-extract`, {
                method: 'POST',
                body: formData
            });
            const processingTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                test.success = true;
                test.details = {
                    processing_time: processingTime,
                    accuracy_metrics: data.accuracy_metrics,
                    securities_found: data.extraction_results?.securities_found || 0,
                    total_value: data.extraction_results?.total_value || 0,
                    improvement_from_baseline: data.accuracy_metrics?.improvement_from_baseline || 0,
                    method: data.method
                };

                console.log(`    ✅ Processing time: ${processingTime}ms`);
                console.log(`    🎯 Overall accuracy: ${test.details.accuracy_metrics?.overall_accuracy || 0}%`);
                console.log(`    📈 Improvement: +${test.details.improvement_from_baseline}%`);
                console.log(`    📊 Securities found: ${test.details.securities_found}`);
                console.log(`    💰 Total value: $${test.details.total_value.toLocaleString()}`);
                
            } else {
                const errorText = await response.text();
                test.details = {
                    status: response.status,
                    error: errorText,
                    processing_time: processingTime
                };
                console.log(`    ❌ Status: ${response.status}`);
                console.log(`    ❌ Error: ${errorText.slice(0, 100)}...`);
            }
            
        } catch (error) {
            test.details.error = error.message;
            console.log(`    ❌ Test failed: ${error.message}`);
        }

        this.results.tests.push(test);
    }

    async testMistralOCRIntegration() {
        console.log('  🔮 Testing Mistral OCR integration...');
        
        const test = {
            name: 'Mistral OCR Integration',
            endpoint: '/api/mistral-ocr-extract',
            success: false,
            details: {}
        };

        try {
            if (!fs.existsSync(this.testPDF)) {
                throw new Error('Test PDF not found');
            }

            console.log('    📄 Testing Mistral OCR endpoint...');
            
            const formData = new FormData();
            const pdfBuffer = fs.readFileSync(this.testPDF);
            const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
            formData.append('pdf', pdfBlob, 'messos-mistral-test.pdf');

            const startTime = Date.now();
            const response = await fetch(`${this.renderBaseURL}/api/mistral-ocr-extract`, {
                method: 'POST',
                body: formData
            });
            const processingTime = Date.now() - startTime;

            if (response.ok) {
                const data = await response.json();
                test.success = true;
                test.details = {
                    processing_time: processingTime,
                    accuracy_metrics: data.accuracy_metrics,
                    securities_found: data.extraction_results?.securities_found || 0,
                    total_value: data.extraction_results?.total_value || 0,
                    mistral_model: data.mistral_metadata?.model || 'mistral-ocr-latest',
                    method: data.method
                };

                console.log(`    ✅ Processing time: ${processingTime}ms`);
                console.log(`    🔮 Mistral model: ${test.details.mistral_model}`);
                console.log(`    🎯 Accuracy: ${test.details.accuracy_metrics?.overall_accuracy || 0}%`);
                console.log(`    📊 Securities found: ${test.details.securities_found}`);
                console.log(`    💰 Total value: $${test.details.total_value.toLocaleString()}`);
                
            } else {
                const errorText = await response.text();
                test.details = {
                    status: response.status,
                    error: errorText,
                    processing_time: processingTime,
                    likely_reason: response.status === 400 ? 'Mistral API key not configured' : 'Other error'
                };
                console.log(`    ❌ Status: ${response.status}`);
                console.log(`    💡 Likely reason: ${test.details.likely_reason}`);
            }
            
        } catch (error) {
            test.details.error = error.message;
            console.log(`    ❌ Test failed: ${error.message}`);
        }

        this.results.tests.push(test);
    }

    async performanceComparison() {
        console.log('  📊 Generating performance comparison...');
        
        const workingTests = this.results.tests.filter(t => t.success && t.details.securities_found);
        
        if (workingTests.length === 0) {
            console.log('    ⚠️ No successful extractions to compare');
            return;
        }

        const comparison = {
            name: 'Performance Comparison',
            success: true,
            details: {
                methods_compared: workingTests.length,
                best_accuracy: 0,
                best_method: '',
                fastest_method: '',
                most_securities: 0,
                comparison_table: []
            }
        };

        for (const test of workingTests) {
            const accuracy = test.details.accuracy_metrics?.overall_accuracy || test.details.accuracy || 0;
            const processingTime = test.details.processing_time || 0;
            const securities = test.details.securities_found || 0;

            if (accuracy > comparison.details.best_accuracy) {
                comparison.details.best_accuracy = accuracy;
                comparison.details.best_method = test.name;
            }

            if (securities > comparison.details.most_securities) {
                comparison.details.most_securities = securities;
            }

            comparison.details.comparison_table.push({
                method: test.name,
                accuracy: accuracy,
                processing_time: processingTime,
                securities_found: securities,
                total_value: test.details.total_value || 0
            });
        }

        // Find fastest method
        const fastestTest = workingTests.reduce((fastest, current) => 
            (current.details.processing_time || 0) < (fastest.details.processing_time || Infinity) ? current : fastest
        );
        comparison.details.fastest_method = fastestTest.name;

        console.log(`    📊 Methods compared: ${comparison.details.methods_compared}`);
        console.log(`    🏆 Best accuracy: ${comparison.details.best_accuracy}% (${comparison.details.best_method})`);
        console.log(`    ⚡ Fastest method: ${comparison.details.fastest_method}`);
        console.log(`    📈 Most securities found: ${comparison.details.most_securities}`);

        this.results.tests.push(comparison);
    }

    generateFinalSummary() {
        const successfulTests = this.results.tests.filter(t => t.success);
        const failedTests = this.results.tests.filter(t => !t.success);
        
        const extractionTests = this.results.tests.filter(t => 
            t.name.includes('Extraction') || t.name.includes('Processor') || t.name.includes('OCR')
        );
        
        const workingExtractions = extractionTests.filter(t => t.success);
        
        this.results.summary = {
            total_tests: this.results.tests.length,
            successful_tests: successfulTests.length,
            failed_tests: failedTests.length,
            success_rate: (successfulTests.length / this.results.tests.length) * 100,
            
            extraction_engines: {
                total: extractionTests.length,
                working: workingExtractions.length,
                success_rate: extractionTests.length > 0 ? (workingExtractions.length / extractionTests.length) * 100 : 0
            },
            
            deployment_status: successfulTests.length > 0 ? 'PARTIALLY_DEPLOYED' : 'NOT_DEPLOYED',
            
            recommendations: this.generateRecommendations(successfulTests, failedTests)
        };

        console.log('\n📊 FINAL SUMMARY');
        console.log('================');
        console.log(`✅ Successful tests: ${this.results.summary.successful_tests}/${this.results.summary.total_tests} (${this.results.summary.success_rate.toFixed(1)}%)`);
        console.log(`🚀 Working extraction engines: ${this.results.summary.extraction_engines.working}/${this.results.summary.extraction_engines.total}`);
        console.log(`🌐 Deployment status: ${this.results.summary.deployment_status}`);
    }

    generateRecommendations(successfulTests, failedTests) {
        const recommendations = [];
        
        if (failedTests.some(t => t.endpoint && t.endpoint.includes('system-capabilities'))) {
            recommendations.push('Deploy latest code - new endpoints not available yet');
        }
        
        if (failedTests.some(t => t.details?.likely_reason?.includes('Mistral'))) {
            recommendations.push('Configure MISTRAL_API_KEY environment variable for 94.89% accuracy');
        }
        
        if (successfulTests.length > 0) {
            recommendations.push('Some extraction engines are working - continue with available methods');
        }
        
        if (failedTests.length > successfulTests.length) {
            recommendations.push('Wait for automatic deployment or trigger manual redeploy');
        }
        
        return recommendations;
    }

    async saveResults() {
        const resultsFile = path.join(__dirname, 'render-live-demo-results.json');
        fs.writeFileSync(resultsFile, JSON.stringify(this.results, null, 2));
        
        const reportFile = path.join(__dirname, 'render-live-demo-report.md');
        const report = this.generateMarkdownReport();
        fs.writeFileSync(reportFile, report);
        
        console.log(`📄 Results saved: ${resultsFile}`);
        console.log(`📋 Report saved: ${reportFile}`);
    }

    generateMarkdownReport() {
        return `# Render Live Demo Test Results

## 🎯 Test Summary
- **Timestamp:** ${this.results.timestamp}
- **Total Tests:** ${this.results.summary.total_tests}
- **Success Rate:** ${this.results.summary.success_rate.toFixed(1)}%
- **Deployment Status:** ${this.results.summary.deployment_status}

## 📊 Test Results

${this.results.tests.map(test => `
### ${test.success ? '✅' : '❌'} ${test.name}
- **Endpoint:** \`${test.endpoint || 'N/A'}\`
- **Status:** ${test.success ? 'SUCCESS' : 'FAILED'}
${test.details.accuracy_metrics ? `- **Accuracy:** ${test.details.accuracy_metrics.overall_accuracy}%` : ''}
${test.details.securities_found ? `- **Securities Found:** ${test.details.securities_found}` : ''}
${test.details.processing_time ? `- **Processing Time:** ${test.details.processing_time}ms` : ''}
${test.details.error ? `- **Error:** ${test.details.error}` : ''}
`).join('')}

## 🏆 Performance Comparison
${this.results.tests.find(t => t.name === 'Performance Comparison')?.details.comparison_table?.map(row => 
`- **${row.method}:** ${row.accuracy}% accuracy, ${row.securities_found} securities, ${row.processing_time}ms`
).join('\n') || 'No successful extractions to compare'}

## 💡 Recommendations
${this.results.summary.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by Render Live Demo Test Suite*`;
    }
}

// Run live demo tests
async function runRenderLiveDemoTests() {
    console.log('🧪 STARTING RENDER LIVE DEMO TESTS');
    console.log('==================================');
    
    const tester = new RenderLiveDemoTests();
    
    try {
        const results = await tester.runComprehensiveLiveDemo();
        
        console.log('\n🎉 RENDER LIVE DEMO TESTS COMPLETE!');
        console.log(`📊 Overall success rate: ${results.summary.success_rate.toFixed(1)}%`);
        console.log(`🚀 Working engines: ${results.summary.extraction_engines.working}/${results.summary.extraction_engines.total}`);
        
        return results;
        
    } catch (error) {
        console.error('❌ Live demo tests failed:', error.message);
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    runRenderLiveDemoTests().catch(console.error);
}

module.exports = { RenderLiveDemoTests };