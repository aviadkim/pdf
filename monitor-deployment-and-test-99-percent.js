/**
 * Monitor Render Deployment and Test 99% Accuracy
 * Waits for deployment to complete, then tests Claude Vision API
 */

const https = require('https');
const fs = require('fs');

class DeploymentMonitor {
    constructor() {
        this.renderUrl = 'https://pdf-production-5dis.onrender.com';
        this.maxWaitTime = 600000; // 10 minutes
        this.checkInterval = 15000; // 15 seconds
        this.expectedCommitHash = 'b135e22'; // Our latest commit
    }

    async makeRequest(url, options = {}) {
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

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.body) {
                req.write(options.body);
            }
            req.end();
        });
    }

    async checkDeploymentStatus() {
        try {
            const health = await this.makeRequest(`${this.renderUrl}/health`);
            
            if (health.status === 200 && health.data.status === 'healthy') {
                // Also check diagnostic to see if our fixes are deployed
                const diagnostic = await this.makeRequest(`${this.renderUrl}/api/diagnostic`);
                
                if (diagnostic.status === 200) {
                    const version = diagnostic.data.version;
                    const claudeAvailable = diagnostic.data.claudeVisionAvailable;
                    const pageByPageAvailable = diagnostic.data.pageByPageAvailable;
                    
                    console.log(`✅ Deployment healthy - Version: ${version}`);
                    console.log(`   Claude Vision: ${claudeAvailable ? '✅' : '❌'}`);
                    console.log(`   Page-by-Page: ${pageByPageAvailable ? '✅' : '❌'}`);
                    
                    // Check if this looks like our deployment
                    if (claudeAvailable && pageByPageAvailable) {
                        return { ready: true, version: version };
                    }
                }
                
                return { ready: false, reason: 'Still using old version' };
            }
            
            return { ready: false, reason: 'Service not healthy' };
            
        } catch (error) {
            return { ready: false, reason: `Error: ${error.message}` };
        }
    }

    async waitForDeployment() {
        console.log('🚀 MONITORING RENDER DEPLOYMENT');
        console.log('='.repeat(60));
        console.log(`📡 Target: ${this.renderUrl}`);
        console.log(`⏱️  Max wait time: ${this.maxWaitTime / 1000}s`);
        console.log(`🔄 Check interval: ${this.checkInterval / 1000}s`);
        console.log('='.repeat(60));

        const startTime = Date.now();
        let attempt = 1;

        while (Date.now() - startTime < this.maxWaitTime) {
            console.log(`\n🔍 Attempt ${attempt} - Checking deployment status...`);
            
            const status = await this.checkDeploymentStatus();
            
            if (status.ready) {
                console.log(`🎉 DEPLOYMENT READY! Version: ${status.version}`);
                return true;
            } else {
                console.log(`⏳ Not ready: ${status.reason}`);
                console.log(`   Waiting ${this.checkInterval / 1000}s for next check...`);
                await new Promise(resolve => setTimeout(resolve, this.checkInterval));
            }
            
            attempt++;
        }

        console.log(`❌ Deployment timeout after ${this.maxWaitTime / 1000}s`);
        return false;
    }

    async test99PercentAccuracy() {
        console.log('\n🎯 TESTING 99% ACCURACY WITH CLAUDE VISION');
        console.log('='.repeat(60));

        const pdfPath = './2. Messos  - 31.03.2025.pdf';
        if (!fs.existsSync(pdfPath)) {
            console.log('❌ Messos PDF not found');
            return { success: false, reason: 'PDF not found' };
        }

        const endpoints = [
            { name: '99% Enhanced (Smart Fallback)', path: '/api/99-percent-enhanced' },
            { name: 'Page-by-Page Claude Vision', path: '/api/page-by-page-processor' },
            { name: 'Bulletproof (Text Only)', path: '/api/bulletproof-processor' }
        ];

        const results = [];

        for (const endpoint of endpoints) {
            console.log(`\n🧪 Testing ${endpoint.name}...`);
            
            try {
                const FormData = require('form-data');
                const form = new FormData();
                form.append('pdf', fs.createReadStream(pdfPath));

                const result = await new Promise((resolve, reject) => {
                    const req = https.request(`${this.renderUrl}${endpoint.path}`, {
                        method: 'POST',
                        headers: form.getHeaders(),
                        timeout: 120000 // 2 minutes for Claude Vision processing
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
                    const cost = result.data.metadata?.totalCost || '0.00';
                    const fallback = result.data.metadata?.fallback;

                    console.log(`   ✅ Success!`);
                    console.log(`   📊 Accuracy: ${accuracy}%`);
                    console.log(`   🔧 Method: ${method}`);
                    console.log(`   💰 Cost: $${cost}`);
                    console.log(`   🔄 Fallback: ${fallback ? 'Yes' : 'No'}`);
                    console.log(`   🔢 Securities: ${result.data.securities?.length || 0}`);
                    console.log(`   💵 Total Value: CHF ${result.data.totalValue?.toLocaleString() || 0}`);

                    results.push({
                        endpoint: endpoint.name,
                        success: true,
                        accuracy: accuracy,
                        method: method,
                        cost: cost,
                        fallback: fallback,
                        securities: result.data.securities?.length || 0,
                        totalValue: result.data.totalValue || 0
                    });

                    if (accuracy >= 99) {
                        console.log(`   🏆 99%+ ACCURACY ACHIEVED!`);
                    }

                } else {
                    console.log(`   ❌ Failed: HTTP ${result.status}`);
                    if (result.data.error) {
                        console.log(`   Error: ${result.data.error}`);
                    }
                    
                    results.push({
                        endpoint: endpoint.name,
                        success: false,
                        error: result.data.error || 'Unknown error',
                        status: result.status
                    });
                }

            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                results.push({
                    endpoint: endpoint.name,
                    success: false,
                    error: error.message
                });
            }

            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return { success: true, results: results };
    }

    generateReport(testResults) {
        console.log('\n' + '='.repeat(80));
        console.log('📋 99% ACCURACY TEST REPORT');
        console.log('='.repeat(80));

        const successfulResults = testResults.results.filter(r => r.success);
        const maxAccuracy = Math.max(...successfulResults.map(r => r.accuracy || 0));
        const achieved99Plus = successfulResults.some(r => r.accuracy >= 99);

        console.log(`📊 RESULTS SUMMARY:`);
        console.log(`   Tests Run: ${testResults.results.length}`);
        console.log(`   Successful: ${successfulResults.length}`);
        console.log(`   Max Accuracy: ${maxAccuracy.toFixed(2)}%`);
        console.log(`   99%+ Achieved: ${achieved99Plus ? '🏆 YES' : '❌ NO'}`);

        console.log(`\n📋 DETAILED RESULTS:`);
        testResults.results.forEach((result, index) => {
            console.log(`\n${index + 1}. ${result.endpoint}`);
            if (result.success) {
                console.log(`   ✅ Accuracy: ${result.accuracy}%`);
                console.log(`   🔧 Method: ${result.method}`);
                console.log(`   💰 Cost: $${result.cost}`);
                console.log(`   🔄 Fallback: ${result.fallback ? 'Yes' : 'No'}`);
                console.log(`   📈 Securities: ${result.securities}`);
                console.log(`   💵 Value: CHF ${result.totalValue.toLocaleString()}`);
            } else {
                console.log(`   ❌ Failed: ${result.error}`);
            }
        });

        console.log(`\n🎯 CONCLUSION:`);
        if (achieved99Plus) {
            const best = successfulResults.find(r => r.accuracy >= 99);
            console.log(`✅ SUCCESS! 99%+ accuracy achieved with ${best.endpoint}`);
            console.log(`💰 Cost per PDF: $${best.cost}`);
            console.log(`🚀 Ready for production use!`);
        } else {
            console.log(`⚠️  99% accuracy not yet achieved`);
            console.log(`📊 Best result: ${maxAccuracy.toFixed(2)}%`);
            console.log(`🔍 May need further optimization or API key configuration`);
        }

        console.log('='.repeat(80));

        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `99-percent-test-results-${timestamp}.json`;
        fs.writeFileSync(filename, JSON.stringify(testResults, null, 2));
        console.log(`\n📁 Full results saved to: ${filename}`);

        return achieved99Plus;
    }

    async run() {
        try {
            // Step 1: Wait for deployment
            const deploymentReady = await this.waitForDeployment();
            
            if (!deploymentReady) {
                console.log('❌ Deployment not ready, cannot test accuracy');
                return false;
            }

            // Step 2: Test 99% accuracy
            const testResults = await this.test99PercentAccuracy();
            
            if (!testResults.success) {
                console.log('❌ Testing failed');
                return false;
            }

            // Step 3: Generate report
            const achieved99Plus = this.generateReport(testResults);
            
            return achieved99Plus;

        } catch (error) {
            console.log(`❌ Monitor failed: ${error.message}`);
            return false;
        }
    }
}

// Run the monitor
async function main() {
    const monitor = new DeploymentMonitor();
    const success = await monitor.run();
    
    if (success) {
        console.log('\n🎉 MISSION ACCOMPLISHED: 99% ACCURACY ACHIEVED WITH CLAUDE VISION API!');
    } else {
        console.log('\n⚠️  Mission incomplete - further optimization may be needed');
    }
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = DeploymentMonitor;