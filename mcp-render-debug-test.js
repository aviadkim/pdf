/**
 * MCP RENDER DEBUG TEST - Real-time log monitoring + Puppeteer
 * Test on actual Render deployment with live log analysis
 */
const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');

class MCPRenderDebugTest {
    constructor() {
        this.renderUrl = 'https://pdf-production-5dis.onrender.com';
        this.pdfPath = './2. Messos  - 31.03.2025.pdf';
        this.browser = null;
        this.page = null;
        this.logMessages = [];
    }

    async setup() {
        console.log('🔍 MCP RENDER DEBUG TEST');
        console.log('📋 Real-time log monitoring + Puppeteer testing');
        console.log('🎯 Goal: Find exact cause of 502 errors on Render');
        console.log('='.repeat(60));

        // Launch browser for testing
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1200, height: 800 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Monitor network requests
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            if (request.url().includes('/api/')) {
                console.log(`📡 API Request: ${request.method()} ${request.url()}`);
                this.logMessages.push(`API_REQUEST: ${request.method()} ${request.url()}`);
            }
            request.continue();
        });
        
        // Monitor responses with detailed analysis
        this.page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('/api/')) {
                const status = response.status();
                console.log(`📨 API Response: ${status} from ${url}`);
                this.logMessages.push(`API_RESPONSE: ${status} ${url}`);
                
                if (status >= 400) {
                    try {
                        const responseText = await response.text();
                        console.log(`🚨 Error Response: ${responseText.substring(0, 200)}`);
                        this.logMessages.push(`ERROR_RESPONSE: ${responseText.substring(0, 500)}`);
                    } catch (e) {
                        console.log('❌ Could not read error response');
                    }
                }
            }
        });
    }

    async monitorRenderLogs() {
        console.log('\\n📊 MONITORING RENDER SERVICE STATUS');
        
        // Check service health with detailed analysis
        try {
            const health = await this.makeRequest(`${this.renderUrl}/health`);
            console.log(`🏥 Health Status: ${health.status}`);
            if (health.data && typeof health.data === 'object') {
                console.log(`   Version: ${health.data.version || 'unknown'}`);  
                console.log(`   Uptime: ${health.data.uptime || 'unknown'}s`);
            }
            
            // Check diagnostic with component analysis
            const diagnostic = await this.makeRequest(`${this.renderUrl}/api/diagnostic`);
            console.log(`🔧 Diagnostic Status: ${diagnostic.status}`);
            if (diagnostic.data && typeof diagnostic.data === 'object') {
                console.log('📋 Component Status:');
                console.log(`   Claude Vision: ${diagnostic.data.claudeVisionAvailable ? '✅' : '❌'}`);
                console.log(`   Page-by-Page: ${diagnostic.data.pageByPageAvailable ? '✅' : '❌'}`);  
                console.log(`   ImageMagick: ${diagnostic.data.imageMagickAvailable ? '✅' : '❌'}`);
                console.log(`   Accuracy: ${diagnostic.data.accuracy || 'unknown'}`);
                console.log(`   Cost per PDF: ${diagnostic.data.costPerPDF || 'unknown'}`);
            }
            
        } catch (error) {
            console.log(`❌ Service monitoring error: ${error.message}`);
        }
    }

    async makeRequest(url) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, { timeout: 10000 }, (res) => {
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
                reject(new Error('timeout'));
            });
            
            req.end();
        });
    }

    async testWithPuppeteer() {
        console.log('\\n🎭 PUPPETEER TEST WITH DETAILED LOGGING');
        
        try {
            // Navigate to the website
            console.log('🌐 Loading website...');
            await this.page.goto(this.renderUrl, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const title = await this.page.title();
            console.log(`✅ Page loaded: ${title}`);
            
            // Find and test the upload form
            const fileInput = await this.page.$('input[type="file"][name="pdf"]');
            if (!fileInput) {
                throw new Error('File input not found');
            }
            
            console.log('📁 Uploading PDF file...');
            await fileInput.uploadFile(this.pdfPath);
            
            // Try different endpoints to see which ones work
            const endpoints = [
                { name: 'bulletproof-processor', selector: 'form[action*="bulletproof"]' },
                { name: 'page-by-page-processor', selector: 'form[action*="page-by-page"]' },
                { name: 'default form', selector: 'form[enctype="multipart/form-data"]' }
            ];
            
            for (const endpoint of endpoints) {
                console.log(`\\n🧪 Testing ${endpoint.name}...`);
                
                try {
                    // Find submit button
                    const submitButton = await this.page.$('button[type="submit"], input[type="submit"]');
                    if (!submitButton) {
                        console.log('❌ Submit button not found');
                        continue;
                    }
                    
                    console.log('🔄 Submitting form...');
                    const startTime = Date.now();
                    
                    // Submit and wait for response (with timeout)
                    const responsePromise = this.page.waitForResponse(
                        response => response.url().includes('/api/'),
                        { timeout: 120000 } // 2 minutes
                    );
                    
                    await submitButton.click();
                    
                    try {
                        const response = await responsePromise;
                        const elapsed = Math.round((Date.now() - startTime) / 1000);
                        
                        console.log(`📊 Response: ${response.status()} after ${elapsed}s`);
                        
                        if (response.status() === 200) {
                            const responseText = await response.text();
                            console.log('✅ SUCCESS! Got 200 response');
                            
                            try {
                                const data = JSON.parse(responseText);
                                console.log(`🎯 Accuracy: ${data.accuracy}%`);
                                console.log(`🔢 Securities: ${data.securities?.length || 0}`);
                                console.log(`💰 Total: CHF ${data.totalValue?.toLocaleString() || 0}`);
                                console.log(`🔧 Method: ${data.metadata?.method || 'unknown'}`);
                                
                                return { success: true, data, endpoint: endpoint.name };
                            } catch (e) {
                                console.log('⚠️  Response not JSON, but request successful');
                                return { success: true, raw: responseText.substring(0, 200), endpoint: endpoint.name };
                            }
                        } else if (response.status() === 502) {
                            console.log('🚨 502 ERROR DETECTED - Analyzing...');
                            const errorText = await response.text();
                            console.log('📋 Error details:');
                            console.log(errorText.substring(0, 300));
                            
                            // This is the key finding for debugging
                            this.logMessages.push(`502_ERROR: ${endpoint.name} - ${errorText.substring(0, 200)}`);
                        }
                        
                    } catch (timeoutError) {
                        console.log(`⏰ Timeout after 2 minutes for ${endpoint.name}`);
                        this.logMessages.push(`TIMEOUT: ${endpoint.name} - 2 minutes`);
                    }
                    
                } catch (error) {
                    console.log(`❌ Error testing ${endpoint.name}: ${error.message}`);
                    this.logMessages.push(`TEST_ERROR: ${endpoint.name} - ${error.message}`);
                }
                
                // Reset page for next test
                await this.page.reload();
                await fileInput.uploadFile(this.pdfPath);
            }
            
            return { success: false, reason: 'All endpoints failed' };
            
        } catch (error) {
            console.log(`❌ Puppeteer test failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    async analyzeLogs() {
        console.log('\\n📊 LOG ANALYSIS FOR RENDER DEBUGGING');
        console.log('='.repeat(60));
        
        console.log('📋 Collected log messages:');
        this.logMessages.forEach((msg, index) => {
            console.log(`${index + 1}. ${msg}`);
        });
        
        // Analyze patterns
        const errors502 = this.logMessages.filter(msg => msg.includes('502'));
        const timeouts = this.logMessages.filter(msg => msg.includes('TIMEOUT'));
        const successes = this.logMessages.filter(msg => msg.includes('200'));
        
        console.log('\\n📊 PATTERN ANALYSIS:');
        console.log(`🚨 502 Errors: ${errors502.length}`);
        console.log(`⏰ Timeouts: ${timeouts.length}`);
        console.log(`✅ Successes: ${successes.length}`);
        
        if (errors502.length > 0) {
            console.log('\\n🔍 502 ERROR DIAGNOSIS:');
            console.log('Most likely causes on Render:');
            console.log('1. 📦 ImageMagick runtime issue (binaries found but execution fails)');
            console.log('2. 🧠 Memory limit exceeded during PDF processing');
            console.log('3. ⏰ Request timeout (Render has 30s limit by default)');
            console.log('4. 🔧 Node.js process crash during pdf2pic conversion');
            console.log('5. 📝 Missing permissions for temporary file creation');
        }
        
        if (timeouts.length > 0) {
            console.log('\\n⏰ TIMEOUT DIAGNOSIS:');
            console.log('Render timeout limits exceeded - need optimization');
        }
        
        return {
            errors502: errors502.length,
            timeouts: timeouts.length, 
            successes: successes.length,
            logMessages: this.logMessages
        };
    }

    async generateRenderDebugReport() {
        console.log('\\n📝 GENERATING RENDER DEBUG REPORT');
        
        const report = {
            timestamp: new Date().toISOString(),
            renderUrl: this.renderUrl,
            testType: 'MCP Puppeteer + Log Analysis',
            serviceStatus: 'analyzed',
            logAnalysis: await this.analyzeLogs(),
            recommendations: []
        };
        
        // Generate specific recommendations based on findings
        if (report.logAnalysis.errors502 > 0) {
            report.recommendations.push('PRIORITY: Fix ImageMagick runtime execution on Render');
            report.recommendations.push('Add more detailed error logging in page-by-page processor');
            report.recommendations.push('Implement graceful fallback when ImageMagick fails');
            report.recommendations.push('Increase Render timeout settings if possible');
        }
        
        if (report.logAnalysis.timeouts > 0) {
            report.recommendations.push('Optimize processing speed for Render timeout limits');
            report.recommendations.push('Process fewer pages or use streaming responses');
        }
        
        if (report.logAnalysis.successes === 0) {
            report.recommendations.push('CRITICAL: No endpoints working - check basic deployment');
        }
        
        // Save report
        const filename = `render-debug-report-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        
        console.log(`📄 Debug report saved: ${filename}`);
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.setup();
            await this.monitorRenderLogs();
            const testResult = await this.testWithPuppeteer();
            const report = await this.generateRenderDebugReport();
            
            console.log('\\n' + '='.repeat(60));
            console.log('🏁 MCP RENDER DEBUG COMPLETE');
            
            if (testResult.success) {
                console.log('✅ Found working solution!');
                console.log(`🎯 Working endpoint: ${testResult.endpoint}`);
            } else {
                console.log('❌ All tests failed - debug info collected');
                console.log('🔧 Check the generated report for specific fixes needed');
            }
            
            console.log('📋 Next steps:');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
            
            return testResult.success;
            
        } catch (error) {
            console.log(`❌ MCP test failed: ${error.message}`);
            return false;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the MCP debug test
async function main() {
    console.log('🚀 MCP RENDER DEBUG TEST STARTING');
    console.log('🎯 Goal: Find exact cause of 502 errors on Render');
    console.log('🔧 Method: Real-time monitoring + Puppeteer testing');
    console.log('📊 Output: Detailed debug report with specific fixes');
    console.log('');
    
    const tester = new MCPRenderDebugTest();
    const success = await tester.run();
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = MCPRenderDebugTest;