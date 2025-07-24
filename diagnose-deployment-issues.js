/**
 * Deployment Diagnosis Tool
 * Investigates why the Render deployment is not working as expected
 */

const https = require('https');
const fs = require('fs').promises;

class DeploymentDiagnoser {
    constructor() {
        this.baseUrl = 'https://pdf-fzzi.onrender.com';
        this.diagnostics = {
            connectivity: null,
            homepage: null,
            apiEndpoints: {},
            actualResponses: {},
            workingEndpoints: []
        };
    }
    
    async runDiagnostics() {
        console.log('🔍 DEPLOYMENT DIAGNOSTICS');
        console.log('='.repeat(50));
        console.log(`🌍 Target: ${this.baseUrl}`);
        
        try {
            // Test 1: Basic connectivity
            await this.testConnectivity();
            
            // Test 2: Homepage content
            await this.testHomepage();
            
            // Test 3: Individual endpoint analysis
            await this.testIndividualEndpoints();
            
            // Test 4: Working endpoint discovery
            await this.discoverWorkingEndpoints();
            
            // Test 5: Real PDF upload test
            await this.testRealPDFUpload();
            
            // Generate diagnosis report
            await this.generateDiagnosisReport();
            
        } catch (error) {
            console.error('❌ Diagnosis failed:', error.message);
        }
    }
    
    async testConnectivity() {
        console.log('\n🔌 Testing basic connectivity...');
        
        try {
            const response = await this.makeRequest('/');
            this.diagnostics.connectivity = {
                success: true,
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                headers: response.headers
            };
            
            console.log(`✅ Connected: ${response.statusCode} (${response.responseTime}ms)`);
            
        } catch (error) {
            this.diagnostics.connectivity = {
                success: false,
                error: error.message
            };
            console.log(`❌ Connection failed: ${error.message}`);
        }
    }
    
    async testHomepage() {
        console.log('\n🏠 Testing homepage content...');
        
        try {
            const response = await this.makeRequest('/');
            const body = response.body.substring(0, 1000); // First 1000 chars
            
            this.diagnostics.homepage = {
                statusCode: response.statusCode,
                hasHTML: body.includes('<html>'),
                hasTitle: body.includes('<title>'),
                hasUploadForm: body.includes('type="file"'),
                contentPreview: body
            };
            
            console.log(`✅ Homepage loaded (${response.statusCode})`);
            console.log(`   HTML detected: ${this.diagnostics.homepage.hasHTML}`);
            console.log(`   Upload form: ${this.diagnostics.homepage.hasUploadForm}`);
            
        } catch (error) {
            console.log(`❌ Homepage test failed: ${error.message}`);
        }
    }
    
    async testIndividualEndpoints() {
        console.log('\n🔗 Testing individual API endpoints...');
        
        const endpoints = [
            '/api/pdf-extract',
            '/api/bulletproof-processor', 
            '/api/hybrid-extract',
            '/api/learning-stats',
            '/api/smart-ocr-test'
        ];
        
        for (const endpoint of endpoints) {
            console.log(`   Testing ${endpoint}...`);
            
            try {
                // Test GET first
                const getResponse = await this.makeRequest(endpoint, 'GET');
                
                // Test POST if GET fails
                let postResponse = null;
                if (getResponse.statusCode >= 400) {
                    try {
                        postResponse = await this.makeRequest(endpoint, 'POST', '{}', {
                            'Content-Type': 'application/json'
                        });
                    } catch (postError) {
                        // Ignore POST errors for now
                    }
                }
                
                this.diagnostics.apiEndpoints[endpoint] = {
                    get: {
                        statusCode: getResponse.statusCode,
                        responseTime: getResponse.responseTime,
                        bodyPreview: getResponse.body.substring(0, 200),
                        isJSON: this.isJSON(getResponse.body)
                    },
                    post: postResponse ? {
                        statusCode: postResponse.statusCode,
                        responseTime: postResponse.responseTime,
                        bodyPreview: postResponse.body.substring(0, 200),
                        isJSON: this.isJSON(postResponse.body)
                    } : null
                };
                
                const status = getResponse.statusCode < 300 ? '✅' : getResponse.statusCode < 500 ? '⚠️' : '❌';
                console.log(`     ${status} GET: ${getResponse.statusCode}`);
                
                if (postResponse) {
                    const postStatus = postResponse.statusCode < 300 ? '✅' : postResponse.statusCode < 500 ? '⚠️' : '❌';
                    console.log(`     ${postStatus} POST: ${postResponse.statusCode}`);
                }
                
            } catch (error) {
                console.log(`     ❌ Error: ${error.message}`);
                this.diagnostics.apiEndpoints[endpoint] = { error: error.message };
            }
        }
    }
    
    async discoverWorkingEndpoints() {
        console.log('\n🔍 Discovering working endpoints...');
        
        // Find endpoints that return JSON successfully
        for (const [endpoint, data] of Object.entries(this.diagnostics.apiEndpoints)) {
            if (data.get && data.get.statusCode === 200 && data.get.isJSON) {
                this.diagnostics.workingEndpoints.push(endpoint);
                console.log(`   ✅ Working: ${endpoint}`);
                
                // Store actual response for analysis
                try {
                    const response = await this.makeRequest(endpoint, 'GET');
                    this.diagnostics.actualResponses[endpoint] = JSON.parse(response.body);
                } catch (error) {
                    console.log(`     ⚠️ Could not parse JSON: ${error.message}`);
                }
            }
        }
        
        console.log(`📊 Found ${this.diagnostics.workingEndpoints.length} working endpoints`);
    }
    
    async testRealPDFUpload() {
        console.log('\n📄 Testing real PDF upload...');
        
        // Create a minimal valid PDF
        const pdfContent = `%PDF-1.4
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
/Length 150
>>
stream
BT
/F1 12 Tf
50 750 Td
(ISIN: CH0012005267 UBS Group AG 850,000) Tj
0 -20 Td
(Portfolio Total: 19'464'431) Tj
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
800
%%EOF`;

        // Test with a working endpoint if available
        const testEndpoint = this.diagnostics.workingEndpoints.length > 0 
            ? this.diagnostics.workingEndpoints[0]
            : '/api/pdf-extract';
        
        try {
            // Create multipart form data
            const boundary = '----WebKitFormBoundary' + Math.random().toString(36);
            const formData = this.createFormData(pdfContent, boundary);
            
            console.log(`   Testing upload to ${testEndpoint}...`);
            
            const response = await this.makeRequest(testEndpoint, 'POST', formData, {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': formData.length
            });
            
            console.log(`   📊 Upload response: ${response.statusCode}`);
            console.log(`   📄 Response preview: ${response.body.substring(0, 200)}`);
            
            // Try to parse as JSON
            if (this.isJSON(response.body)) {
                const jsonResponse = JSON.parse(response.body);
                console.log(`   📋 Success: ${jsonResponse.success}`);
                if (jsonResponse.securities) {
                    console.log(`   🔢 Securities found: ${jsonResponse.securities.length}`);
                }
                if (jsonResponse.totalValue || jsonResponse.portfolioTotal) {
                    console.log(`   💰 Total value: $${(jsonResponse.totalValue || jsonResponse.portfolioTotal).toLocaleString()}`);
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Upload test failed: ${error.message}`);
        }
    }
    
    createFormData(pdfContent, boundary) {
        const filename = 'test-portfolio.pdf';
        const pdfBuffer = Buffer.from(pdfContent);
        
        let formData = '';
        formData += `--${boundary}\r\n`;
        formData += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
        formData += `Content-Type: application/pdf\r\n`;
        formData += '\r\n';
        
        const header = Buffer.from(formData, 'utf8');
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
        
        return Buffer.concat([header, pdfBuffer, footer]);
    }
    
    async generateDiagnosisReport() {
        console.log('\n📊 DIAGNOSIS SUMMARY');
        console.log('='.repeat(50));
        
        // Connectivity status
        if (this.diagnostics.connectivity?.success) {
            console.log('✅ Basic connectivity: WORKING');
        } else {
            console.log('❌ Basic connectivity: FAILED');
            return;
        }
        
        // Homepage status
        if (this.diagnostics.homepage?.hasHTML) {
            console.log('✅ Homepage: LOADED');
            console.log(`   Upload form available: ${this.diagnostics.homepage.hasUploadForm}`);
        } else {
            console.log('❌ Homepage: ISSUES');
        }
        
        // API endpoints status
        const workingCount = this.diagnostics.workingEndpoints.length;
        const totalCount = Object.keys(this.diagnostics.apiEndpoints).length;
        console.log(`📊 API Endpoints: ${workingCount}/${totalCount} working`);
        
        // Working endpoints details
        if (workingCount > 0) {
            console.log('\n✅ Working endpoints:');
            for (const endpoint of this.diagnostics.workingEndpoints) {
                console.log(`   - ${endpoint}`);
                const response = this.diagnostics.actualResponses[endpoint];
                if (response) {
                    console.log(`     Response type: ${typeof response}`);
                    if (response.success !== undefined) {
                        console.log(`     Success field: ${response.success}`);
                    }
                }
            }
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        
        if (workingCount === 0) {
            console.log('   🚨 No working API endpoints found');
            console.log('   🔧 Check deployment logs for errors');
            console.log('   🔄 Consider redeploying the service');
        } else {
            console.log(`   ✅ ${workingCount} endpoints are functional`);
            console.log('   🧪 Use working endpoints for further testing');
            if (this.diagnostics.homepage?.hasUploadForm) {
                console.log('   📄 Try manual PDF upload through web interface');
            }
        }
        
        // Save full diagnosis
        try {
            await fs.mkdir('test-results', { recursive: true });
            await fs.writeFile(
                'test-results/deployment-diagnosis.json',
                JSON.stringify(this.diagnostics, null, 2)
            );
            console.log('\n📄 Full diagnosis saved: test-results/deployment-diagnosis.json');
        } catch (error) {
            console.log(`\n⚠️ Could not save diagnosis: ${error.message}`);
        }
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
                    'User-Agent': 'Deployment-Diagnostics/1.0',
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
            
            req.setTimeout(15000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (body) {
                req.write(body);
            }
            
            req.end();
        });
    }
    
    isJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }
}

// Run diagnostics if called directly
if (require.main === module) {
    const diagnoser = new DeploymentDiagnoser();
    diagnoser.runDiagnostics().catch(error => {
        console.error('❌ Diagnostics failed:', error.message);
        process.exit(1);
    });
}

module.exports = { DeploymentDiagnoser };