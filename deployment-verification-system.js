/**
 * DEPLOYMENT VERIFICATION SYSTEM
 * Tests production deployment matches local exactly
 * Compares Render vs Local vs Docker environments
 */

const fs = require('fs').promises;
const fetch = require('node-fetch');
const FormData = require('form-data');

class DeploymentVerificationSystem {
    constructor() {
        this.environments = {
            local: 'http://localhost:10002',
            render: 'https://pdf-fzzi.onrender.com',
            docker: 'http://localhost:10003'
        };
        
        this.testPDF = '2. Messos  - 31.03.2025.pdf';
        this.results = {};
        
        console.log('🔍 DEPLOYMENT VERIFICATION SYSTEM');
        console.log('Ensuring all environments work identically');
    }

    async verifyAllEnvironments() {
        console.log('🌍 VERIFYING ALL DEPLOYMENT ENVIRONMENTS');
        console.log('='.repeat(50));
        
        try {
            // Test each environment
            for (const [name, url] of Object.entries(this.environments)) {
                console.log(`\n🧪 Testing ${name.toUpperCase()} environment: ${url}`);
                this.results[name] = await this.testEnvironment(name, url);
            }
            
            // Compare results
            const comparison = this.compareEnvironments();
            
            // Generate deployment report
            const report = await this.generateDeploymentReport(comparison);
            
            console.log('\n📊 DEPLOYMENT VERIFICATION COMPLETE');
            return report;
            
        } catch (error) {
            console.error('❌ Deployment verification failed:', error);
            throw error;
        }
    }

    async testEnvironment(envName, baseUrl) {
        const results = {
            environment: envName,
            url: baseUrl,
            timestamp: new Date().toISOString(),
            tests: {},
            overall: { passed: 0, failed: 0 }
        };
        
        // Test 1: Basic connectivity
        try {
            console.log(`  📡 Testing connectivity...`);
            const response = await fetch(baseUrl, { timeout: 10000 });
            results.tests.connectivity = {
                passed: response.ok,
                status: response.status,
                details: response.ok ? 'Server responding' : `HTTP ${response.status}`
            };
            this.updateOverall(results, response.ok);
        } catch (error) {
            results.tests.connectivity = {
                passed: false,
                error: error.message,
                details: 'Server not reachable'
            };
            this.updateOverall(results, false);
        }
        
        // Test 2: Perfect extraction endpoint
        try {
            console.log(`  🎯 Testing perfect extraction...`);
            
            if (await this.fileExists(this.testPDF)) {
                const pdfBuffer = await fs.readFile(this.testPDF);
                
                const formData = new FormData();
                formData.append('pdf', pdfBuffer, this.testPDF);
                
                const response = await fetch(`${baseUrl}/api/perfect-extraction`, {
                    method: 'POST',
                    body: formData,
                    timeout: 60000 // 60 second timeout
                });
                
                if (response.ok) {
                    const data = await response.json();
                    results.tests.perfectExtraction = {
                        passed: data.success !== false,
                        securities: data.securities?.length || 0,
                        totalValue: data.summary?.totalValue || 0,
                        accuracy: data.summary?.accuracy || 0,
                        processingTime: data.summary?.processingTime || 0,
                        details: `Found ${data.securities?.length || 0} securities`
                    };
                    this.updateOverall(results, data.success !== false);
                } else {
                    const errorText = await response.text();
                    results.tests.perfectExtraction = {
                        passed: false,
                        status: response.status,
                        error: errorText,
                        details: `API error: ${response.status}`
                    };
                    this.updateOverall(results, false);
                }
            } else {
                results.tests.perfectExtraction = {
                    passed: false,
                    details: 'Test PDF not found - skipping extraction test'
                };
                this.updateOverall(results, false);
            }
        } catch (error) {
            results.tests.perfectExtraction = {
                passed: false,
                error: error.message,
                details: 'Extraction test failed'
            };
            this.updateOverall(results, false);
        }
        
        // Test 3: 100% accuracy system
        try {
            console.log(`  🎓 Testing accuracy system...`);
            const response = await fetch(`${baseUrl}/api/submit-training`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: 'test_123',
                    bankFormat: 'test_bank',
                    trainingData: [{ isin: 'XS1234567890', name: 'Test', value: 100000 }]
                }),
                timeout: 10000
            });
            
            results.tests.accuracySystem = {
                passed: response.status !== 404,
                status: response.status,
                details: response.status === 404 ? 'Endpoint missing' : 'Endpoint exists'
            };
            this.updateOverall(results, response.status !== 404);
        } catch (error) {
            results.tests.accuracySystem = {
                passed: false,
                error: error.message,
                details: 'Accuracy system test failed'
            };
            this.updateOverall(results, false);
        }
        
        // Test 4: Export endpoints
        const exportEndpoints = ['/api/export/json', '/api/export/csv', '/perfect-results'];
        for (const endpoint of exportEndpoints) {
            try {
                console.log(`  📁 Testing ${endpoint}...`);
                const response = await fetch(`${baseUrl}${endpoint}`, { timeout: 5000 });
                const testName = `export_${endpoint.split('/').pop()}`;
                
                results.tests[testName] = {
                    passed: response.status !== 404,
                    status: response.status,
                    details: response.status === 404 ? 'Endpoint missing' : 'Endpoint exists'
                };
                this.updateOverall(results, response.status !== 404);
            } catch (error) {
                const testName = `export_${endpoint.split('/').pop()}`;
                results.tests[testName] = {
                    passed: false,
                    error: error.message,
                    details: 'Export endpoint test failed'
                };
                this.updateOverall(results, false);
            }
        }
        
        // Test 5: Environment variables (for local/docker)
        if (envName !== 'render') {
            const hasApiKey = !!process.env.MISTRAL_API_KEY;
            results.tests.environmentVars = {
                passed: hasApiKey,
                details: `MISTRAL_API_KEY ${hasApiKey ? 'present' : 'missing'}`
            };
            this.updateOverall(results, hasApiKey);
        }
        
        console.log(`  📊 ${envName} results: ${results.overall.passed}✅ ${results.overall.failed}❌`);
        return results;
    }

    compareEnvironments() {
        console.log('\n🔍 COMPARING ENVIRONMENTS');
        console.log('-'.repeat(30));
        
        const comparison = {
            identical: true,
            differences: [],
            summary: {}
        };
        
        // Compare connectivity
        const connectivityResults = Object.values(this.results).map(r => r.tests.connectivity?.passed);
        if (!this.allSame(connectivityResults)) {
            comparison.identical = false;
            comparison.differences.push('Connectivity differs between environments');
        }
        
        // Compare extraction results
        const extractionResults = Object.values(this.results)
            .map(r => r.tests.perfectExtraction?.securities)
            .filter(s => s !== undefined);
            
        if (extractionResults.length > 1 && !this.allSame(extractionResults)) {
            comparison.identical = false;
            comparison.differences.push('Extraction results differ between environments');
            
            // Detail the differences
            Object.entries(this.results).forEach(([env, result]) => {
                if (result.tests.perfectExtraction?.securities !== undefined) {
                    comparison.summary[env] = {
                        securities: result.tests.perfectExtraction.securities,
                        totalValue: result.tests.perfectExtraction.totalValue,
                        accuracy: result.tests.perfectExtraction.accuracy
                    };
                }
            });
        }
        
        // Compare endpoint availability
        const endpoints = ['export_json', 'export_csv', 'export_perfect-results'];
        endpoints.forEach(endpoint => {
            const endpointResults = Object.values(this.results).map(r => r.tests[endpoint]?.passed);
            if (!this.allSame(endpointResults)) {
                comparison.identical = false;
                comparison.differences.push(`${endpoint} availability differs`);
            }
        });
        
        return comparison;
    }

    allSame(array) {
        return array.length <= 1 || array.every(val => val === array[0]);
    }

    async generateDeploymentReport(comparison) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                environmentsTested: Object.keys(this.results).length,
                allIdentical: comparison.identical,
                differences: comparison.differences.length
            },
            environments: this.results,
            comparison: comparison,
            recommendations: this.generateRecommendations(comparison),
            deploymentReadiness: this.assessDeploymentReadiness()
        };
        
        // Save report
        const reportFile = `deployment-verification-${Date.now()}.json`;
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        // Display results
        console.log('\n📋 DEPLOYMENT VERIFICATION RESULTS');
        console.log('='.repeat(40));
        
        Object.entries(this.results).forEach(([env, result]) => {
            const status = result.overall.passed > result.overall.failed ? '✅' : '❌';
            console.log(`${status} ${env.toUpperCase()}: ${result.overall.passed}/${result.overall.passed + result.overall.failed} tests passed`);
        });
        
        console.log(`\n🔍 Environments identical: ${comparison.identical ? '✅ YES' : '❌ NO'}`);
        if (!comparison.identical) {
            console.log('⚠️ Differences found:');
            comparison.differences.forEach(diff => console.log(`  - ${diff}`));
        }
        
        console.log(`\n📄 Report saved: ${reportFile}`);
        
        if (this.assessDeploymentReadiness().ready) {
            console.log('\n🚀 READY FOR PRODUCTION DEPLOYMENT!');
        } else {
            console.log('\n⚠️ FIX ISSUES BEFORE DEPLOYMENT');
        }
        
        return report;
    }

    generateRecommendations(comparison) {
        const recommendations = [];
        
        if (!comparison.identical) {
            recommendations.push('Fix environment differences before deploying');
        }
        
        // Check if Render is working
        const renderResult = this.results.render;
        if (renderResult && renderResult.overall.failed > renderResult.overall.passed) {
            recommendations.push('Fix Render deployment issues');
            if (renderResult.tests.connectivity?.passed === false) {
                recommendations.push('Render server is not responding - check deployment status');
            }
            if (renderResult.tests.perfectExtraction?.passed === false) {
                recommendations.push('Perfect extraction not working on Render - check API configuration');
            }
        }
        
        // Check local environment
        const localResult = this.results.local;
        if (localResult && localResult.overall.failed > 0) {
            recommendations.push('Fix local development environment issues');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('All environments ready for production');
        }
        
        return recommendations;
    }

    assessDeploymentReadiness() {
        let readiness = {
            ready: false,
            score: 0,
            criticalIssues: [],
            minorIssues: []
        };
        
        const totalEnvironments = Object.keys(this.results).length;
        let workingEnvironments = 0;
        
        Object.entries(this.results).forEach(([env, result]) => {
            if (result.overall.passed > result.overall.failed) {
                workingEnvironments++;
                readiness.score += 1;
            }
            
            // Critical issues
            if (!result.tests.connectivity?.passed) {
                readiness.criticalIssues.push(`${env} not responding`);
            }
            
            // Minor issues
            if (result.tests.perfectExtraction?.passed === false) {
                readiness.minorIssues.push(`${env} extraction not working`);
            }
        });
        
        readiness.score = Math.round((workingEnvironments / totalEnvironments) * 100);
        readiness.ready = readiness.score >= 80 && readiness.criticalIssues.length === 0;
        
        return readiness;
    }

    updateOverall(results, passed) {
        if (passed) {
            results.overall.passed++;
        } else {
            results.overall.failed++;
        }
    }

    async fileExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new DeploymentVerificationSystem();
    verifier.verifyAllEnvironments().catch(console.error);
}

module.exports = { DeploymentVerificationSystem };