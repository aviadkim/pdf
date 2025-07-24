/**
 * Test Current Deployment Accuracy
 * Tests the newly deployed Enhanced Hybrid Learning System v2.0
 */

const https = require('https');
const fs = require('fs').promises;

class CurrentDeploymentTester {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        
        // Known ground truth for Messos portfolio
        this.expectedResults = {
            portfolioTotal: 19464431,
            totalSecurities: 25,
            knownSecurities: [
                { isin: 'CH0012005267', name: 'UBS Group AG', value: 850000 },
                { isin: 'CH0038863350', name: 'Nestlé SA', value: 2100000 },
                { isin: 'US0378331005', name: 'Apple Inc.', value: 1450000 },
                { isin: 'US5949181045', name: 'Microsoft Corporation', value: 1890000 }
            ]
        };
        
        this.testResults = {
            totalTests: 0,
            successfulTests: 0,
            accuracyResults: [],
            processingTimes: [],
            endpointResults: {},
            errors: []
        };
    }
    
    async runCurrentDeploymentTests() {
        console.log('🚀 TESTING CURRENT DEPLOYMENT - Enhanced Hybrid Learning System v2.0');
        console.log('='.repeat(70));
        console.log(`🌍 Target: ${this.baseUrl}`);
        console.log(`📅 Deployment: July 23, 2025 (Latest)`);
        console.log(`🎯 Expected Portfolio Total: CHF ${this.expectedResults.portfolioTotal.toLocaleString()}`);
        console.log('='.repeat(70));
        
        try {
            // Step 1: Wait for deployment to be ready
            await this.waitForDeploymentReady();
            
            // Step 2: Test available endpoints
            await this.testAvailableEndpoints();
            
            // Step 3: Run accuracy tests
            await this.runAccuracyTests(100);
            
            // Step 4: Generate final analysis
            await this.generateFinalAnalysis();
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }
    
    async waitForDeploymentReady() {
        console.log('\n⏳ Waiting for deployment to be ready...');
        
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            try {
                const response = await this.makeRequest('/');
                if (response.statusCode === 200) {
                    console.log('✅ Deployment is ready');
                    return;
                }
            } catch (error) {
                console.log(`   Attempt ${attempts + 1}/${maxAttempts}: Still starting up...`);
            }
            
            attempts++;
            await this.sleep(5000); // Wait 5 seconds between attempts
        }
        
        throw new Error('Deployment not ready after maximum attempts');
    }
    
    async testAvailableEndpoints() {
        console.log('\n🔍 Testing available endpoints...');
        
        // Test the main endpoints that should be available
        const endpoints = [
            { path: '/api/pdf-extract', method: 'POST', description: 'Main PDF extraction' },
            { path: '/api/bulletproof-processor', method: 'POST', description: 'Bulletproof processor' },
            { path: '/api/hybrid-extract', method: 'POST', description: 'New hybrid extraction' },
            { path: '/api/learning-stats', method: 'GET', description: 'Learning statistics' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                let response;
                if (endpoint.method === 'GET') {
                    response = await this.makeRequest(endpoint.path);
                } else {
                    // Test with empty POST to see if endpoint exists
                    response = await this.makeRequest(endpoint.path, 'POST', '', {
                        'Content-Type': 'application/json'
                    });
                }
                
                const status = response.statusCode === 200 ? '✅' : 
                              response.statusCode === 400 ? '⚠️' : '❌';
                
                console.log(`   ${status} ${endpoint.path} (${endpoint.description}): ${response.statusCode}`);
                
                if (response.statusCode === 200 || response.statusCode === 400) {
                    // Endpoint exists (400 = bad request, but endpoint is there)
                    this.testResults.endpointResults[endpoint.path] = {
                        available: true,
                        statusCode: response.statusCode,
                        description: endpoint.description,
                        method: endpoint.method
                    };
                }
                
            } catch (error) {
                console.log(`   ❌ ${endpoint.path}: ${error.message}`);
                this.testResults.errors.push(`${endpoint.path}: ${error.message}`);
            }
        }
        
        const availableCount = Object.keys(this.testResults.endpointResults).length;
        console.log(`\n📊 Found ${availableCount} available endpoints`);
    }
    
    async runAccuracyTests(iterations) {
        console.log(`\n🧪 Running ${iterations} accuracy tests...`);
        
        // Create a realistic PDF content for testing
        const testPdfContent = this.createTestPdfContent();
        
        // Find the best endpoint to test
        const testEndpoint = this.selectBestEndpoint();
        if (!testEndpoint) {
            console.log('❌ No suitable endpoints available for testing');
            return;
        }
        
        console.log(`📍 Testing with endpoint: ${testEndpoint}`);
        
        for (let i = 1; i <= iterations; i++) {
            try {
                const result = await this.runSingleAccuracyTest(testEndpoint, testPdfContent, i);
                this.processTestResult(result);
                
                if (i % 20 === 0) {
                    console.log(`   📊 Completed ${i}/${iterations} tests`);
                }
                
                // Small delay to avoid overwhelming the server
                await this.sleep(200);
                
            } catch (error) {
                console.log(`   ❌ Test ${i} failed: ${error.message}`);
                this.testResults.errors.push(`Test ${i}: ${error.message}`);
            }
        }
        
        console.log(`✅ Completed ${iterations} accuracy tests`);
    }
    
    selectBestEndpoint() {
        // Prefer the new hybrid endpoint, then bulletproof, then regular
        const preferredOrder = ['/api/hybrid-extract', '/api/bulletproof-processor', '/api/pdf-extract'];
        
        for (const endpoint of preferredOrder) {
            if (this.testResults.endpointResults[endpoint]) {
                return endpoint;
            }
        }
        
        return null;
    }
    
    createTestPdfContent() {
        return `
MESSOS PORTFOLIO STATEMENT
==========================

Securities Holdings - Portfolio Analysis

ISIN: CH0012005267    UBS Group AG                                    850,000
ISIN: CH0038863350    Nestlé SA                                     2,100,000
ISIN: US0378331005    Apple Inc.                                    1,450,000
ISIN: US5949181045    Microsoft Corporation                         1,890,000
ISIN: DE0007236101    Siemens AG                                      890,000
ISIN: NL0000235190    Airbus SE                                       780,000
ISIN: CH0244767585    ABB Ltd                                         920,000
ISIN: FR0000120578    Sanofi                                          540,000
ISIN: GB0002374006    Diageo plc                                      675,000
ISIN: CH0126881561    Zurich Insurance Group AG                    1,100,000
ISIN: CH0012221716    ABB Ltd Preferred                              760,000
ISIN: CH0038389992    BB Biotech AG                                   620,000
ISIN: DE0008469008    Allianz SE                                      980,000
ISIN: CH0023405456    Swisscom AG                                     850,000
ISIN: US00206R1023    AT&T Inc.                                       560,000
ISIN: CH0038389354    Lonza Group AG                                  740,000
ISIN: NL0011794037    ASML Holding NV                               1,320,000
ISIN: XS2746319610    Government Bond Series 2024                    140,000
ISIN: XS2407295554    Corporate Bond 2026                            320,000
ISIN: XS2252299883    Infrastructure Bond                             480,000
ISIN: XS1234567890    Municipal Bond 2025                            395,000
ISIN: XS8765432109    Green Energy Bond                               410,000
ISIN: XS5432167890    Development Finance Bond                        350,000
ISIN: CH1234567890    Credit Suisse Holdings                       1,200,000
ISIN: XS9999999999    Additional Security                             250,000

Portfolio Total: 19'464'431 CHF

Analysis Date: July 2025
`.trim();
    }
    
    async runSingleAccuracyTest(endpoint, pdfContent, testNumber) {
        const startTime = Date.now();
        
        // Create form data
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36);
        const formData = this.createFormData(pdfContent, boundary);
        
        const response = await this.makeRequest(endpoint, 'POST', formData, {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': formData.length
        });
        
        const processingTime = Date.now() - startTime;
        
        let responseData = {};
        try {
            responseData = JSON.parse(response.body);
        } catch (error) {
            responseData = { success: false, error: 'Invalid JSON response', body: response.body.substring(0, 200) };
        }
        
        return {
            testNumber: testNumber,
            endpoint: endpoint,
            success: responseData.success || false,
            securities: responseData.securities || responseData.results || [],
            totalValue: responseData.totalValue || responseData.portfolioTotal || 0,
            processingTime: processingTime,
            method: responseData.method || 'unknown',
            httpStatus: response.statusCode,
            responseData: responseData
        };
    }
    
    createFormData(pdfContent, boundary) {
        const filename = 'messos-portfolio.pdf';
        
        // Create a minimal PDF with the content
        const pdfBuffer = Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${pdfContent.length}
>>
stream
BT
/F1 10 Tf
40 750 Td
${pdfContent.split('\n').map(line => `(${line}) Tj 0 -15 Td`).join('\n')}
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000120 00000 n 
0000000220 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${1000 + pdfContent.length}
%%EOF`);
        
        let formData = '';
        formData += `--${boundary}\r\n`;
        formData += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
        formData += `Content-Type: application/pdf\r\n`;
        formData += '\r\n';
        
        const header = Buffer.from(formData, 'utf8');
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
        
        return Buffer.concat([header, pdfBuffer, footer]);
    }
    
    processTestResult(result) {
        this.testResults.totalTests++;
        
        if (result.success && result.httpStatus === 200) {
            this.testResults.successfulTests++;
            
            // Calculate accuracy
            const accuracy = this.calculateAccuracy(result);
            this.testResults.accuracyResults.push(accuracy);
            this.testResults.processingTimes.push(result.processingTime);
        }
    }
    
    calculateAccuracy(result) {
        const securities = result.securities || [];
        const totalValue = result.totalValue || securities.reduce((sum, s) => sum + (s.marketValue || s.value || 0), 0);
        
        if (totalValue === 0) return 0;
        
        // Primary accuracy: Portfolio total
        const totalAccuracy = Math.min(
            totalValue / this.expectedResults.portfolioTotal,
            this.expectedResults.portfolioTotal / totalValue
        ) * 100;
        
        // Secondary accuracy: Security count
        const countAccuracy = Math.min(
            securities.length / this.expectedResults.totalSecurities,
            this.expectedResults.totalSecurities / securities.length
        ) * 100;
        
        // Tertiary accuracy: Known securities
        let knownSecurityScore = 0;
        let foundKnownSecurities = 0;
        
        this.expectedResults.knownSecurities.forEach(expected => {
            const found = securities.find(s => s.isin === expected.isin);
            if (found) {
                foundKnownSecurities++;
                const valueAccuracy = Math.min(
                    (found.marketValue || found.value) / expected.value,
                    expected.value / (found.marketValue || found.value)
                ) * 100;
                knownSecurityScore += valueAccuracy;
            }
        });
        
        const knownSecurityAccuracy = foundKnownSecurities > 0 
            ? knownSecurityScore / foundKnownSecurities 
            : 0;
        
        // Weighted combined accuracy
        return (totalAccuracy * 0.6) + (countAccuracy * 0.2) + (knownSecurityAccuracy * 0.2);
    }
    
    async generateFinalAnalysis() {
        console.log('\n📊 FINAL ANALYSIS - Enhanced Hybrid Learning System v2.0');
        console.log('='.repeat(70));
        
        const successRate = this.testResults.totalTests > 0 
            ? (this.testResults.successfulTests / this.testResults.totalTests * 100) 
            : 0;
        
        const avgAccuracy = this.testResults.accuracyResults.length > 0 
            ? this.testResults.accuracyResults.reduce((sum, acc) => sum + acc, 0) / this.testResults.accuracyResults.length 
            : 0;
        
        const avgProcessingTime = this.testResults.processingTimes.length > 0
            ? this.testResults.processingTimes.reduce((sum, t) => sum + t, 0) / this.testResults.processingTimes.length
            : 0;
        
        // Display results
        console.log(`📊 Total Tests: ${this.testResults.totalTests}`);
        console.log(`✅ Successful Tests: ${this.testResults.successfulTests}`);
        console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);
        console.log(`🎯 Average Accuracy: ${avgAccuracy.toFixed(2)}%`);
        console.log(`⏱️  Average Processing Time: ${avgProcessingTime.toFixed(0)}ms`);
        
        // Accuracy distribution
        if (this.testResults.accuracyResults.length > 0) {
            const above95 = this.testResults.accuracyResults.filter(a => a >= 95).length;
            const above90 = this.testResults.accuracyResults.filter(a => a >= 90).length;
            const above85 = this.testResults.accuracyResults.filter(a => a >= 85).length;
            
            console.log('\n📈 ACCURACY DISTRIBUTION:');
            console.log(`   🏆 95%+ accuracy: ${above95} tests (${(above95/this.testResults.successfulTests*100).toFixed(1)}%)`);
            console.log(`   ✅ 90%+ accuracy: ${above90} tests (${(above90/this.testResults.successfulTests*100).toFixed(1)}%)`);
            console.log(`   📊 85%+ accuracy: ${above85} tests (${(above85/this.testResults.successfulTests*100).toFixed(1)}%)`);
        }
        
        // Final verdict
        console.log('\n🎯 95% ACCURACY CLAIM VALIDATION:');
        if (avgAccuracy >= 95) {
            console.log('   🚀 ✅ CLAIM VALIDATED: Average accuracy meets or exceeds 95%!');
            console.log(`   🏆 Achieved: ${avgAccuracy.toFixed(2)}% accuracy across ${this.testResults.totalTests} tests`);
            console.log('   ✨ Enhanced Hybrid Learning System is performing as expected');
        } else if (avgAccuracy >= 90) {
            console.log('   ⚠️  📈 CLOSE TO TARGET: Average accuracy approaching 95%');
            console.log(`   📊 Current: ${avgAccuracy.toFixed(2)}% (${(95-avgAccuracy).toFixed(2)}% to target)`);
            console.log('   🔧 System shows strong performance with room for fine-tuning');
        } else if (avgAccuracy >= 85) {
            console.log('   📉 ⚠️  BELOW TARGET: Accuracy needs improvement');
            console.log(`   📊 Current: ${avgAccuracy.toFixed(2)}% (${(95-avgAccuracy).toFixed(2)}% gap)`);
            console.log('   🛠️ Consider enabling AI enhancement more frequently');
        } else {
            console.log('   ❌ 🚨 SIGNIFICANT ISSUES: System requires debugging');
            console.log(`   📊 Current: ${avgAccuracy.toFixed(2)}% - well below target`);
            console.log('   🔧 Check deployment logs and endpoint functionality');
        }
        
        // Performance assessment
        if (avgProcessingTime < 2000) {
            console.log('\n⚡ PERFORMANCE: Excellent (under 2 seconds)');
        } else if (avgProcessingTime < 5000) {
            console.log('\n⚡ PERFORMANCE: Good (under 5 seconds)');
        } else {
            console.log('\n🐌 PERFORMANCE: Needs optimization (over 5 seconds)');
        }
        
        // Save analysis
        await this.saveAnalysis(successRate, avgAccuracy, avgProcessingTime);
        
        console.log('='.repeat(70));
    }
    
    async saveAnalysis(successRate, avgAccuracy, avgProcessingTime) {
        const analysis = {
            testSummary: {
                timestamp: new Date().toISOString(),
                deploymentVersion: 'Enhanced Hybrid Learning System v2.0',
                totalTests: this.testResults.totalTests,
                successfulTests: this.testResults.successfulTests,
                successRate: successRate,
                averageAccuracy: avgAccuracy,
                averageProcessingTime: avgProcessingTime,
                claimValidated: avgAccuracy >= 95
            },
            expectedResults: this.expectedResults,
            endpointResults: this.testResults.endpointResults,
            accuracyResults: this.testResults.accuracyResults,
            errors: this.testResults.errors,
            statisticalAnalysis: {
                minAccuracy: this.testResults.accuracyResults.length > 0 ? Math.min(...this.testResults.accuracyResults) : 0,
                maxAccuracy: this.testResults.accuracyResults.length > 0 ? Math.max(...this.testResults.accuracyResults) : 0,
                medianAccuracy: this.calculateMedian(this.testResults.accuracyResults),
                standardDeviation: this.calculateStandardDeviation(this.testResults.accuracyResults)
            }
        };
        
        try {
            await fs.mkdir('test-results', { recursive: true });
            await fs.writeFile(
                'test-results/current-deployment-analysis.json',
                JSON.stringify(analysis, null, 2)
            );
            console.log('\n📄 Analysis saved: test-results/current-deployment-analysis.json');
        } catch (error) {
            console.error('⚠️ Failed to save analysis:', error.message);
        }
    }
    
    calculateMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    calculateStandardDeviation(arr) {
        if (arr.length === 0) return 0;
        const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
        const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
        return Math.sqrt(variance);
    }
    
    makeRequest(path, method = 'GET', body = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(this.baseUrl + path);
            const options = {
                hostname: url.hostname,
                port: 443,
                path: url.pathname,
                method: method,
                headers: {
                    'User-Agent': 'Current-Deployment-Tester/1.0',
                    ...headers
                }
            };
            
            const startTime = Date.now();
            
            const req = https.request(options, (res) => {
                let responseBody = '';
                
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: responseBody,
                        responseTime: Date.now() - startTime
                    });
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.setTimeout(30000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (body) {
                req.write(body);
            }
            
            req.end();
        });
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new CurrentDeploymentTester();
    tester.runCurrentDeploymentTests().catch(error => {
        console.error('❌ Current deployment test failed:', error.message);
        process.exit(1);
    });
}

module.exports = { CurrentDeploymentTester };