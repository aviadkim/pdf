// Comprehensive Test of Render Deployment
// Tests home page, API endpoints, and compares processing methods

const https = require('https');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'https://pdf-fzzi.onrender.com';
const PDF_PATH = '2. Messos  - 31.03.2025.pdf';

class RenderDeploymentTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {}
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Render Deployment Tests...\n');
        
        try {
            // Test 1: Home Page Interface
            await this.testHomePage();
            
            // Test 2: Bulletproof Processor (Standard)
            await this.testBulletproofProcessor();
            
            // Test 3: Complete Processor (Multi-Agent)
            await this.testCompleteProcessor();
            
            // Test 4: Compare Results
            await this.compareResults();
            
            // Generate final report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.results.tests.push({
                name: 'Test Suite',
                status: 'failed',
                error: error.message
            });
        }
    }

    async testHomePage() {
        console.log('📄 Testing Home Page Interface...');
        
        try {
            const response = await this.makeRequest('GET', '/');
            const html = response.body;
            
            const hasMultiAgent = html.includes('Multi-Agent Processing');
            const hasStandardProcessing = html.includes('Standard Processing');
            const hasCompleteProcessor = html.includes('/api/complete-processor');
            const hasBulletproofProcessor = html.includes('/api/bulletproof-processor');
            
            const result = {
                name: 'Home Page Interface',
                status: hasMultiAgent && hasStandardProcessing && hasCompleteProcessor && hasBulletproofProcessor ? 'passed' : 'failed',
                details: {
                    hasMultiAgent,
                    hasStandardProcessing,
                    hasCompleteProcessor,
                    hasBulletproofProcessor,
                    responseCode: response.statusCode,
                    contentLength: html.length
                }
            };
            
            this.results.tests.push(result);
            
            if (result.status === 'passed') {
                console.log('✅ Home page shows multi-agent interface');
            } else {
                console.log('❌ Home page missing expected elements');
            }
            
        } catch (error) {
            console.log('❌ Home page test failed:', error.message);
            this.results.tests.push({
                name: 'Home Page Interface',
                status: 'failed',
                error: error.message
            });
        }
    }

    async testBulletproofProcessor() {
        console.log('🔧 Testing Bulletproof Processor (Standard)...');
        
        try {
            const response = await this.uploadPDF('/api/bulletproof-processor', {
                mode: 'full',
                mcpEnabled: 'true'
            });
            
            const result = {
                name: 'Bulletproof Processor',
                status: response.success ? 'passed' : 'failed',
                details: {
                    securitiesFound: response.securities?.length || 0,
                    totalValue: response.totalValue || 0,
                    confidence: response.confidence || 0,
                    accuracy: response.confidence ? (response.confidence * 100).toFixed(2) + '%' : 'N/A',
                    processingMethods: response.processingMethods || [],
                    message: response.message
                }
            };
            
            this.results.tests.push(result);
            this.results.standardResults = response;
            
            if (result.status === 'passed') {
                console.log(`✅ Standard processing: ${result.details.securitiesFound} securities, ${result.details.accuracy} accuracy`);
            } else {
                console.log(`❌ Standard processing failed: ${response.error}`);
            }
            
        } catch (error) {
            console.log('❌ Bulletproof processor test failed:', error.message);
            this.results.tests.push({
                name: 'Bulletproof Processor',
                status: 'failed',
                error: error.message
            });
        }
    }

    async testCompleteProcessor() {
        console.log('🤖 Testing Complete Processor (Multi-Agent)...');
        
        try {
            const response = await this.uploadPDF('/api/complete-processor', {
                enableLLM: 'false', // Don't require API key for basic test
                provider: 'openrouter'
            });
            
            const result = {
                name: 'Complete Processor',
                status: response.success ? 'passed' : 'failed',
                details: {
                    securitiesFound: response.securities?.length || 0,
                    totalValue: response.totalValue || 0,
                    expectedTotal: response.expectedTotal || 0,
                    accuracy: response.accuracy ? (response.accuracy * 100).toFixed(2) + '%' : 'N/A',
                    confidence: response.confidence ? (response.confidence * 100).toFixed(2) + '%' : 'N/A',
                    processingMethods: response.processingMethods || [],
                    documentType: response.metadata?.documentType,
                    message: response.message
                }
            };
            
            this.results.tests.push(result);
            this.results.multiAgentResults = response;
            
            if (result.status === 'passed') {
                console.log(`✅ Multi-agent processing: ${result.details.securitiesFound} securities, ${result.details.accuracy} accuracy`);
            } else {
                console.log(`❌ Multi-agent processing failed: ${response.error}`);
            }
            
        } catch (error) {
            console.log('❌ Complete processor test failed:', error.message);
            this.results.tests.push({
                name: 'Complete Processor',
                status: 'failed',
                error: error.message
            });
        }
    }

    async compareResults() {
        console.log('📊 Comparing Processing Methods...');
        
        if (!this.results.standardResults || !this.results.multiAgentResults) {
            console.log('❌ Cannot compare - missing results from one or both processors');
            return;
        }
        
        const standard = this.results.standardResults;
        const multiAgent = this.results.multiAgentResults;
        
        const comparison = {
            name: 'Processing Comparison',
            status: 'completed',
            details: {
                standardSecurities: standard.securities?.length || 0,
                multiAgentSecurities: multiAgent.securities?.length || 0,
                standardTotal: standard.totalValue || 0,
                multiAgentTotal: multiAgent.totalValue || 0,
                standardAccuracy: standard.confidence || 0,
                multiAgentAccuracy: multiAgent.accuracy || 0,
                improvement: {
                    securitiesFound: (multiAgent.securities?.length || 0) - (standard.securities?.length || 0),
                    totalValue: (multiAgent.totalValue || 0) - (standard.totalValue || 0),
                    accuracy: (multiAgent.accuracy || 0) - (standard.confidence || 0)
                }
            }
        };
        
        this.results.tests.push(comparison);
        
        console.log('📈 Comparison Results:');
        console.log(`  Standard: ${comparison.details.standardSecurities} securities, $${comparison.details.standardTotal.toLocaleString()}`);
        console.log(`  Multi-Agent: ${comparison.details.multiAgentSecurities} securities, $${comparison.details.multiAgentTotal.toLocaleString()}`);
        console.log(`  Improvement: ${comparison.details.improvement.securitiesFound} securities, $${comparison.details.improvement.totalValue.toLocaleString()}`);
        
        // Check if we found all 40 securities
        if (comparison.details.multiAgentSecurities >= 40) {
            console.log('✅ Multi-agent system found all expected securities!');
        } else {
            console.log(`⚠️ Multi-agent system found ${comparison.details.multiAgentSecurities}/40 expected securities`);
        }
    }

    async makeRequest(method, path, data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'pdf-fzzi.onrender.com',
                port: 443,
                path: path,
                method: method,
                headers: {
                    'User-Agent': 'RenderDeploymentTester/1.0'
                }
            };
            
            if (data && method === 'POST') {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }
            
            const req = https.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = {
                            statusCode: res.statusCode,
                            headers: res.headers,
                            body: body
                        };
                        
                        // Try to parse JSON response
                        if (res.headers['content-type']?.includes('application/json')) {
                            response.json = JSON.parse(body);
                        }
                        
                        resolve(response);
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            if (data && method === 'POST') {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }

    async uploadPDF(endpoint, additionalData = {}) {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(PDF_PATH)) {
                reject(new Error(`PDF file not found: ${PDF_PATH}`));
                return;
            }
            
            const form = new FormData();
            form.append('pdf', fs.createReadStream(PDF_PATH));
            
            // Add additional form data
            Object.entries(additionalData).forEach(([key, value]) => {
                form.append(key, value);
            });
            
            const options = {
                hostname: 'pdf-fzzi.onrender.com',
                port: 443,
                path: endpoint,
                method: 'POST',
                headers: {
                    ...form.getHeaders(),
                    'User-Agent': 'RenderDeploymentTester/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${body}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            form.pipe(req);
        });
    }

    generateReport() {
        console.log('\n📋 FINAL DEPLOYMENT TEST REPORT');
        console.log('=====================================');
        
        const passed = this.results.tests.filter(t => t.status === 'passed').length;
        const failed = this.results.tests.filter(t => t.status === 'failed').length;
        const completed = this.results.tests.filter(t => t.status === 'completed').length;
        
        console.log(`✅ Tests Passed: ${passed}`);
        console.log(`❌ Tests Failed: ${failed}`);
        console.log(`📊 Tests Completed: ${completed}`);
        
        this.results.summary = {
            totalTests: this.results.tests.length,
            passed,
            failed,
            completed,
            overallStatus: failed === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS'
        };
        
        console.log(`\n🎯 Overall Status: ${this.results.summary.overallStatus}`);
        
        // Detailed results
        console.log('\n📊 DETAILED RESULTS:');
        this.results.tests.forEach((test, index) => {
            console.log(`\n${index + 1}. ${test.name}: ${test.status.toUpperCase()}`);
            if (test.details) {
                Object.entries(test.details).forEach(([key, value]) => {
                    console.log(`   ${key}: ${JSON.stringify(value)}`);
                });
            }
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
        });
        
        // Save results to file
        fs.writeFileSync('render-deployment-test-results.json', JSON.stringify(this.results, null, 2));
        console.log('\n💾 Full results saved to render-deployment-test-results.json');
    }
}

// Run the tests
async function main() {
    const tester = new RenderDeploymentTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RenderDeploymentTester;