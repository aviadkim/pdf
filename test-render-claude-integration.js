/**
 * Test Render Deployment Claude Vision Integration
 * Tests if ANTHROPIC_API_KEY works for 99% accuracy
 */

const https = require('https');
const fs = require('fs');

class RenderClaudeIntegrationTester {
    constructor() {
        this.renderUrl = 'https://pdf-production-5dis.onrender.com';
        this.testResults = {
            deployment: null,
            claudeApiStatus: null,
            pageByPageAvailable: null,
            enhancedEndpointReady: null,
            accuracyTest: null
        };
    }

    // Make HTTP request with better error handling
    makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, {
                timeout: 30000,
                ...options
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data, raw: true });
                    }
                });
            });

            req.on('error', (err) => {
                reject(new Error(`Request failed: ${err.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            req.end();
        });
    }

    // Test deployment status
    async testDeploymentStatus() {
        console.log('🔍 Testing Render deployment status...');
        
        try {
            const result = await this.makeRequest(`${this.renderUrl}/health`);
            
            if (result.status === 200) {
                console.log('✅ Deployment is live and healthy');
                this.testResults.deployment = { status: 'healthy', ...result.data };
                return true;
            } else {
                console.log(`❌ Deployment issue: HTTP ${result.status}`);
                this.testResults.deployment = { status: 'unhealthy', code: result.status };
                return false;
            }
        } catch (error) {
            console.log(`❌ Deployment failed: ${error.message}`);
            this.testResults.deployment = { status: 'failed', error: error.message };
            return false;
        }
    }

    // Test Claude API key status
    async testClaudeApiStatus() {
        console.log('🔍 Testing Claude API key configuration...');
        
        try {
            const result = await this.makeRequest(`${this.renderUrl}/api/claude-test`);
            
            if (result.status === 200 && result.data) {
                const hasKey = result.data.success;
                console.log(hasKey ? 
                    '✅ Claude API key is configured and working' : 
                    '⚠️  Claude API key not configured'
                );
                
                this.testResults.claudeApiStatus = result.data;
                return hasKey;
            } else {
                console.log('❌ Claude API test endpoint failed');
                this.testResults.claudeApiStatus = { error: 'endpoint_failed' };
                return false;
            }
        } catch (error) {
            console.log(`❌ Claude API test failed: ${error.message}`);
            this.testResults.claudeApiStatus = { error: error.message };
            return false;
        }
    }

    // Test diagnostic endpoint for detailed info
    async testDiagnosticInfo() {
        console.log('🔍 Getting diagnostic information...');
        
        try {
            const result = await this.makeRequest(`${this.renderUrl}/api/diagnostic`);
            
            if (result.status === 200 && result.data) {
                const diagnostic = result.data;
                
                console.log(`📊 System Status:`);
                console.log(`   - Version: ${diagnostic.version || 'unknown'}`);
                console.log(`   - Accuracy: ${diagnostic.accuracy || 'unknown'}`);
                console.log(`   - Claude Vision Available: ${diagnostic.claudeVisionAvailable ? '✅' : '❌'}`);
                console.log(`   - Page-by-Page Available: ${diagnostic.pageByPageAvailable ? '✅' : '❌'}`);
                
                this.testResults.pageByPageAvailable = diagnostic.pageByPageAvailable;
                this.testResults.enhancedEndpointReady = diagnostic.endpoints?.['/api/99-percent-enhanced'];
                
                return diagnostic;
            } else {
                console.log('❌ Diagnostic endpoint failed');
                return null;
            }
        } catch (error) {
            console.log(`❌ Diagnostic test failed: ${error.message}`);
            return null;
        }
    }

    // Test if we can upload a PDF and get 99% accuracy
    async testAccuracyWithMessosPDF() {
        console.log('🔍 Testing 99% accuracy with Messos PDF...');
        
        // Check if we have the test PDF
        const pdfPath = './2. Messos  - 31.03.2025.pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('⚠️  Messos PDF not found, skipping accuracy test');
            this.testResults.accuracyTest = { status: 'skipped', reason: 'pdf_not_found' };
            return false;
        }

        try {
            // Test the enhanced endpoint that uses Claude if available
            const FormData = require('form-data');
            const form = new FormData();
            form.append('pdf', fs.createReadStream(pdfPath));

            const result = await new Promise((resolve, reject) => {
                const req = https.request(`${this.renderUrl}/api/99-percent-enhanced`, {
                    method: 'POST',
                    headers: form.getHeaders(),
                    timeout: 60000
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            resolve({ status: res.statusCode, data: JSON.parse(data) });
                        } catch (e) {
                            resolve({ status: res.statusCode, data: data, raw: true });
                        }
                    });
                });

                req.on('error', reject);
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Upload timeout'));
                });

                form.pipe(req);
            });

            if (result.status === 200 && result.data.success) {
                const accuracy = parseFloat(result.data.accuracy);
                const method = result.data.metadata?.method || 'unknown';
                const fallback = result.data.metadata?.fallback;
                
                console.log(`📊 Accuracy Test Results:`);
                console.log(`   - Accuracy: ${accuracy}%`);
                console.log(`   - Method: ${method}`);
                console.log(`   - Fallback: ${fallback ? 'Yes (no Claude key)' : 'No (Claude Vision used)'}`);
                console.log(`   - Securities Found: ${result.data.securities?.length || 0}`);
                console.log(`   - Total Value: CHF ${result.data.totalValue?.toLocaleString() || 0}`);
                console.log(`   - Expected: CHF 19,464,431`);
                
                this.testResults.accuracyTest = {
                    accuracy: accuracy,
                    method: method,
                    fallback: fallback,
                    securitiesFound: result.data.securities?.length || 0,
                    totalValue: result.data.totalValue || 0,
                    expected: 19464431
                };

                return accuracy >= 99;
            } else {
                console.log(`❌ Accuracy test failed: HTTP ${result.status}`);
                this.testResults.accuracyTest = { status: 'failed', code: result.status };
                return false;
            }
        } catch (error) {
            console.log(`❌ Accuracy test error: ${error.message}`);
            this.testResults.accuracyTest = { status: 'error', error: error.message };
            return false;
        }
    }

    // Generate summary report
    generateReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📋 RENDER CLAUDE INTEGRATION TEST REPORT');
        console.log('='.repeat(80));
        
        const { deployment, claudeApiStatus, pageByPageAvailable, enhancedEndpointReady, accuracyTest } = this.testResults;
        
        console.log(`🌍 Deployment Status: ${deployment?.status === 'healthy' ? '✅ Healthy' : '❌ Issues'}`);
        console.log(`🔑 Claude API Key: ${claudeApiStatus?.success ? '✅ Configured' : '❌ Missing'}`);
        console.log(`📄 Page-by-Page Processor: ${pageByPageAvailable ? '✅ Available' : '❌ Not Available'}`);
        console.log(`🎯 99% Enhanced Endpoint: ${enhancedEndpointReady ? '✅ Ready' : '❌ Not Ready'}`);
        
        if (accuracyTest && accuracyTest.accuracy !== undefined) {
            const accuracy = accuracyTest.accuracy;
            const reached99 = accuracy >= 99;
            
            console.log(`📊 Accuracy Test: ${reached99 ? '✅' : '⚠️'} ${accuracy}%`);
            console.log(`🔄 Method Used: ${accuracyTest.method}`);
            console.log(`💰 Cost: ${accuracyTest.fallback ? '$0.00 (text)' : '~$0.11 (Claude Vision)'}`);
        } else {
            console.log(`📊 Accuracy Test: ⚠️  Not completed`);
        }
        
        console.log('\n🎯 NEXT STEPS:');
        
        if (!claudeApiStatus?.success) {
            console.log('1. ❗ ADD ANTHROPIC_API_KEY to Render environment variables');
            console.log('2. 🔄 Redeploy service to pick up the API key');
            console.log('3. 🧪 Test again to achieve 99% accuracy with Claude Vision');
        } else if (accuracyTest?.accuracy >= 99) {
            console.log('1. ✅ 99% accuracy achieved with Claude Vision!');
            console.log('2. 💰 Cost: ~$0.11 per PDF processing');
            console.log('3. 🚀 Ready for production use');
        } else {
            console.log('1. 🔍 Investigate why accuracy is not reaching 99%');
            console.log('2. 📊 Check page-by-page processor logs');
            console.log('3. 🛠️  Debug Claude Vision API responses');
        }
        
        console.log('='.repeat(80));
        
        return this.testResults;
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 TESTING RENDER CLAUDE VISION INTEGRATION FOR 99% ACCURACY');
        console.log('='.repeat(80));
        
        try {
            // Test deployment
            const deploymentOk = await this.testDeploymentStatus();
            if (!deploymentOk) {
                console.log('❌ Deployment issues detected, stopping tests');
                return this.generateReport();
            }

            // Test Claude API
            await this.testClaudeApiStatus();
            
            // Get diagnostic info
            await this.testDiagnosticInfo();
            
            // Test accuracy
            await this.testAccuracyWithMessosPDF();
            
            return this.generateReport();
            
        } catch (error) {
            console.log(`❌ Test suite failed: ${error.message}`);
            return this.generateReport();
        }
    }
}

// Run the tests
async function main() {
    const tester = new RenderClaudeIntegrationTester();
    const results = await tester.runAllTests();
    
    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `render-claude-test-${timestamp}.json`;
    
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    console.log(`\n📁 Results saved to: ${filename}`);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RenderClaudeIntegrationTester;