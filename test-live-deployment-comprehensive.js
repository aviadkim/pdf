/**
 * Comprehensive Live Deployment Test Suite
 * Tests the new Render deployment with both API keys
 */

const fs = require('fs').promises;
const https = require('https');

class LiveDeploymentTester {
    constructor() {
        this.baseUrl = 'https://pdf-production-5dis.onrender.com';
        this.messosPath = '2. Messos  - 31.03.2025.pdf';
        
        // Track results
        this.results = {
            deployment: {},
            endpoints: {},
            pdfTests: {}
        };
    }
    
    async runComprehensiveTests() {
        console.log('🚀 COMPREHENSIVE LIVE DEPLOYMENT TESTS');
        console.log('=====================================');
        console.log(`🌐 Testing: ${this.baseUrl}`);
        console.log('📄 PDF: 2. Messos  - 31.03.2025.pdf');
        console.log('🎯 Target: Test all endpoints with real PDF');
        console.log('=====================================');
        
        try {
            // Test 1: Basic connectivity
            await this.testBasicConnectivity();
            
            // Test 2: API endpoints without PDF
            await this.testAPIEndpoints();
            
            // Test 3: PDF processing endpoints
            await this.testPDFProcessing();
            
            // Test 4: Performance and accuracy
            await this.testPerformanceAndAccuracy();
            
            // Generate final report
            await this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }
    
    async testBasicConnectivity() {
        console.log('\\n🔗 TESTING BASIC CONNECTIVITY');
        console.log('-'.repeat(40));
        
        try {
            const startTime = Date.now();
            const response = await this.makeRequest('GET', '/');
            const responseTime = Date.now() - startTime;
            
            console.log(`✅ Homepage: ${response.statusCode} (${responseTime}ms)`);
            
            this.results.deployment = {
                status: 'online',
                responseTime: responseTime,
                statusCode: response.statusCode,
                headers: response.headers
            };
            
        } catch (error) {
            console.log(`❌ Connectivity failed: ${error.message}`);
            this.results.deployment = {
                status: 'offline',
                error: error.message
            };
        }
    }
    
    async testAPIEndpoints() {
        console.log('\\n🔌 TESTING API ENDPOINTS');
        console.log('-'.repeat(40));
        
        const endpoints = [
            { path: '/api/openai-test', method: 'GET', name: 'OpenAI Connection' },
            { path: '/api/claude-test', method: 'GET', name: 'Claude Connection' },
            { path: '/api/system-capabilities', method: 'GET', name: 'System Info' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await this.makeRequest(endpoint.method, endpoint.path);
                const responseTime = Date.now() - startTime;
                
                let data = '';
                response.on('data', chunk => data += chunk);
                
                await new Promise(resolve => {
                    response.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            
                            if (response.statusCode === 200 && result.success !== false) {
                                console.log(`✅ ${endpoint.name}: Working (${responseTime}ms)`);
                                this.results.endpoints[endpoint.path] = {
                                    status: 'working',
                                    responseTime: responseTime,
                                    data: result
                                };
                            } else {
                                console.log(`⚠️ ${endpoint.name}: ${response.statusCode} - ${result.error || 'Unknown error'}`);
                                this.results.endpoints[endpoint.path] = {
                                    status: 'error',
                                    statusCode: response.statusCode,
                                    error: result.error
                                };
                            }
                        } catch (parseError) {
                            console.log(`❌ ${endpoint.name}: Invalid JSON response`);
                            this.results.endpoints[endpoint.path] = {
                                status: 'invalid_response',
                                error: 'Invalid JSON'
                            };
                        }
                        resolve();
                    });
                });
                
            } catch (error) {
                console.log(`❌ ${endpoint.name}: ${error.message}`);
                this.results.endpoints[endpoint.path] = {
                    status: 'failed',
                    error: error.message
                };
            }
        }
    }
    
    async testPDFProcessing() {
        console.log('\\n📄 TESTING PDF PROCESSING ENDPOINTS');
        console.log('-'.repeat(40));
        
        // Check if PDF exists
        try {
            await fs.access(this.messosPath);
            console.log('✅ Messos PDF found');
        } catch (error) {
            console.log('❌ Messos PDF not found - skipping PDF tests');
            return;
        }
        
        const pdfEndpoints = [
            { path: '/api/bulletproof-processor', name: 'Bulletproof (86% accuracy)' },
            { path: '/api/openai-extract', name: 'OpenAI GPT-4 (38% accuracy)' },
            { path: '/api/claude-vision-extract', name: 'Claude Vision (99% accuracy)' },
            { path: '/api/pdf-extract', name: 'Main PDF Extract' }
        ];
        
        const pdfBuffer = await fs.readFile(this.messosPath);
        console.log(`📂 PDF loaded: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
        
        for (const endpoint of pdfEndpoints) {
            console.log(`\\n🧪 Testing ${endpoint.name}...`);
            
            try {
                const startTime = Date.now();
                const result = await this.makeMultipartRequest('POST', endpoint.path, pdfBuffer);
                const responseTime = Date.now() - startTime;
                
                if (result.success) {
                    console.log(`✅ ${endpoint.name}: ${result.securities?.length || 0} securities`);
                    console.log(`   💰 Total: $${result.totalValue?.toLocaleString() || '0'}`);
                    console.log(`   🎯 Accuracy: ${result.accuracy || 'N/A'}%`);
                    console.log(`   ⏱️ Time: ${(responseTime/1000).toFixed(1)}s`);
                    
                    this.results.pdfTests[endpoint.path] = {
                        status: 'success',
                        securities: result.securities?.length || 0,
                        totalValue: result.totalValue || 0,
                        accuracy: result.accuracy || 0,
                        responseTime: responseTime,
                        method: result.metadata?.extractionMethod || 'unknown'
                    };
                } else {
                    console.log(`❌ ${endpoint.name}: ${result.error || 'Processing failed'}`);
                    this.results.pdfTests[endpoint.path] = {
                        status: 'failed',
                        error: result.error,
                        responseTime: responseTime
                    };
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint.name}: ${error.message}`);
                this.results.pdfTests[endpoint.path] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
    }
    
    async testPerformanceAndAccuracy() {
        console.log('\\n📊 PERFORMANCE & ACCURACY ANALYSIS');
        console.log('-'.repeat(40));
        
        const workingEndpoints = Object.entries(this.results.pdfTests)
            .filter(([_, result]) => result.status === 'success')
            .sort((a, b) => b[1].accuracy - a[1].accuracy);
        
        if (workingEndpoints.length === 0) {
            console.log('❌ No PDF endpoints working - cannot analyze performance');
            return;
        }
        
        console.log('🏆 RANKING BY ACCURACY:');
        workingEndpoints.forEach(([endpoint, result], index) => {
            const name = endpoint.replace('/api/', '').replace('-', ' ').toUpperCase();
            console.log(`${index + 1}. ${name}: ${result.accuracy}% (${result.securities} securities, ${(result.responseTime/1000).toFixed(1)}s)`);
        });
        
        // Find best endpoint
        const [bestEndpoint, bestResult] = workingEndpoints[0];
        console.log(`\\n🥇 BEST PERFORMING: ${bestEndpoint}`);
        console.log(`   🎯 Accuracy: ${bestResult.accuracy}%`);
        console.log(`   🔍 Securities: ${bestResult.securities}`);
        console.log(`   💰 Total Value: $${bestResult.totalValue.toLocaleString()}`);
        console.log(`   ⚡ Speed: ${(bestResult.responseTime/1000).toFixed(1)}s`);
        
        this.results.bestEndpoint = {
            endpoint: bestEndpoint,
            ...bestResult
        };
    }
    
    async generateFinalReport() {
        console.log('\\n📋 FINAL DEPLOYMENT REPORT');
        console.log('='.repeat(50));
        
        // Deployment status
        const deploymentStatus = this.results.deployment.status === 'online' ? '✅ ONLINE' : '❌ OFFLINE';
        console.log(`🌐 Deployment Status: ${deploymentStatus}`);
        console.log(`⚡ Response Time: ${this.results.deployment.responseTime || 'N/A'}ms`);
        
        // API endpoints summary
        const workingAPIs = Object.values(this.results.endpoints).filter(r => r.status === 'working').length;
        const totalAPIs = Object.keys(this.results.endpoints).length;
        console.log(`🔌 API Endpoints: ${workingAPIs}/${totalAPIs} working`);
        
        // PDF processing summary
        const workingPDF = Object.values(this.results.pdfTests).filter(r => r.status === 'success').length;
        const totalPDF = Object.keys(this.results.pdfTests).length;
        console.log(`📄 PDF Processors: ${workingPDF}/${totalPDF} working`);
        
        // Best accuracy
        if (this.results.bestEndpoint) {
            console.log(`🏆 Best Accuracy: ${this.results.bestEndpoint.accuracy}% (${this.results.bestEndpoint.endpoint})`);
        }
        
        // Recommendations
        console.log('\\n💡 RECOMMENDATIONS:');
        if (this.results.endpoints['/api/claude-test']?.status !== 'working') {
            console.log('⚠️ Claude Vision API not deployed - missing 99% accuracy endpoint');
        }
        if (workingPDF === 0) {
            console.log('❌ No PDF processors working - check deployment');
        }
        if (this.results.bestEndpoint?.accuracy < 90) {
            console.log('📈 Accuracy below 90% - consider using Claude Vision API');
        }
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `live-deployment-test-${timestamp}.json`;
        
        try {
            await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
            console.log(`\\n💾 Results saved: ${filename}`);
        } catch (error) {
            console.log(`⚠️ Could not save results: ${error.message}`);
        }
        
        console.log('\\n🎯 Test completed!');
    }
    
    makeRequest(method, path) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + path);
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: method,
                headers: {
                    'User-Agent': 'LiveDeploymentTester/1.0'
                }
            };
            
            const req = https.request(options, resolve);
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            req.end();
        });
    }
    
    async makeMultipartRequest(method, path, pdfBuffer) {
        return new Promise((resolve, reject) => {
            const boundary = '----WebKitFormBoundary' + Math.random().toString(36);
            const url = new URL(this.baseUrl + path);
            
            // Create multipart form data
            let formData = '';
            formData += `--${boundary}\\r\\n`;
            formData += `Content-Disposition: form-data; name="pdf"; filename="messos.pdf"\\r\\n`;
            formData += `Content-Type: application/pdf\\r\\n`;
            formData += '\\r\\n';
            
            const header = Buffer.from(formData, 'utf8');
            const footer = Buffer.from(`\\r\\n--${boundary}--\\r\\n`, 'utf8');
            const body = Buffer.concat([header, pdfBuffer, footer]);
            
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: method,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': body.length,
                    'User-Agent': 'LiveDeploymentTester/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                let responseBody = '';
                res.on('data', chunk => responseBody += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(responseBody);
                        resolve(result);
                    } catch (error) {
                        resolve({
                            success: false,
                            error: 'Invalid JSON response',
                            rawResponse: responseBody.substring(0, 200)
                        });
                    }
                });
            });
            
            req.on('error', reject);
            req.setTimeout(60000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.write(body);
            req.end();
        });
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new LiveDeploymentTester();
    tester.runComprehensiveTests().catch(error => {
        console.error('❌ Test suite failed:', error.message);
        process.exit(1);
    });
}

module.exports = { LiveDeploymentTester };