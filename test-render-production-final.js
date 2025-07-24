/**
 * RENDER PRODUCTION DEPLOYMENT TEST
 * Final comprehensive test of the deployed Smart OCR system on Render
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');

class RenderProductionTest {
    constructor() {
        this.renderURL = 'https://pdf-fzzi.onrender.com';
        this.browser = null;
        this.page = null;
        this.testResults = {
            timestamp: new Date().toISOString(),
            deploymentURL: this.renderURL,
            tests: [],
            finalAccuracy: 0,
            systemReady: false
        };
    }

    async checkDeploymentStatus() {
        console.log('🌐 CHECKING RENDER DEPLOYMENT STATUS');
        console.log('====================================');
        console.log(`🎯 URL: ${this.renderURL}`);
        
        for (let attempt = 1; attempt <= 10; attempt++) {
            try {
                console.log(`📡 Attempt ${attempt}/10 - Testing deployment...`);
                
                const response = await fetch(this.renderURL, {
                    timeout: 15000,
                    headers: {
                        'User-Agent': 'Production-Test/1.0'
                    }
                });
                
                if (response.ok) {
                    const content = await response.text();
                    
                    if (content.includes('Vercel build complete')) {
                        console.log('⚠️  Still showing "Vercel build complete" - deployment in progress...');
                        console.log('   This means Render is serving cached static content');
                        console.log('   Need to set environment variable and trigger rebuild');
                    } else if (content.includes('Financial PDF Processing System')) {
                        console.log('✅ SUCCESS! Express server is running correctly');
                        console.log('🎯 Smart OCR interface should be accessible');
                        return { success: true, content: content.substring(0, 200) };
                    } else if (content.includes('Application failed to respond')) {
                        console.log('❌ Application failed to start - check environment variables');
                        console.log('   Likely missing MISTRAL_API_KEY environment variable');
                    } else {
                        console.log('⚠️  Unexpected response - checking content...');
                        console.log(`   Content preview: ${content.substring(0, 100)}...`);
                    }
                } else {
                    console.log(`❌ HTTP ${response.status} - ${response.statusText}`);
                }
                
            } catch (error) {
                console.log(`❌ Connection error: ${error.message}`);
            }
            
            if (attempt < 10) {
                console.log('⏳ Waiting 10 seconds before retry...\n');
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
        
        return { success: false, error: 'Deployment check failed' };
    }

    async testSmartOCREndpoints() {
        console.log('\n🧪 TESTING SMART OCR API ENDPOINTS');
        console.log('===================================');
        
        const endpoints = [
            { path: '/api/smart-ocr-test', name: 'System Test' },
            { path: '/api/smart-ocr-stats', name: 'Statistics' },
            { path: '/api/smart-ocr-patterns', name: 'Patterns' },
            { path: '/smart-annotation', name: 'Annotation Interface' }
        ];
        
        const results = {};
        
        for (const endpoint of endpoints) {
            try {
                console.log(`📡 Testing ${endpoint.name}...`);
                
                const response = await fetch(`${this.renderURL}${endpoint.path}`, {
                    timeout: 10000
                });
                
                if (response.ok) {
                    if (endpoint.path.startsWith('/api/')) {
                        const data = await response.json();
                        results[endpoint.path] = data;
                        console.log(`✅ ${endpoint.name} - Working`);
                        
                        if (endpoint.path === '/api/smart-ocr-stats') {
                            console.log(`   📊 Accuracy: ${data.stats?.currentAccuracy || 'N/A'}%`);
                            console.log(`   🧠 Patterns: ${data.stats?.patternsLearned || 'N/A'}`);
                        }
                    } else {
                        const content = await response.text();
                        results[endpoint.path] = { length: content.length };
                        console.log(`✅ ${endpoint.name} - Loaded (${content.length} chars)`);
                    }
                } else {
                    console.log(`❌ ${endpoint.name} - HTTP ${response.status}`);
                    results[endpoint.path] = { error: response.status };
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint.name} - ${error.message}`);
                results[endpoint.path] = { error: error.message };
            }
        }
        
        return results;
    }

    async testFullWorkflowWithPuppeteer() {
        console.log('\n🎭 TESTING FULL WORKFLOW WITH PUPPETEER');
        console.log('========================================');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        try {
            // Test homepage
            console.log('📄 Testing homepage...');
            await this.page.goto(this.renderURL, { waitUntil: 'networkidle2', timeout: 30000 });
            
            const title = await this.page.title();
            console.log(`   📝 Page title: ${title}`);
            
            // Take screenshot
            await this.page.screenshot({ path: 'render-test-homepage.png', fullPage: true });
            console.log('   📸 Screenshot saved: render-test-homepage.png');
            
            // Test annotation interface
            console.log('🎨 Testing annotation interface...');
            await this.page.goto(`${this.renderURL}/smart-annotation`, { waitUntil: 'networkidle2' });
            
            // Check for annotation tools
            const annotationTools = await this.page.$$eval('[data-tool]', elements => 
                elements.map(el => el.getAttribute('data-tool'))
            );
            
            console.log(`   🛠️  Found annotation tools: ${annotationTools.length}`);
            console.log(`   📋 Tools: ${annotationTools.join(', ')}`);
            
            // Take annotation interface screenshot
            await this.page.screenshot({ path: 'render-test-annotation.png', fullPage: true });
            console.log('   📸 Screenshot saved: render-test-annotation.png');
            
            // Test learning API
            console.log('🧠 Testing learning system...');
            const learningResult = await this.page.evaluate(async (baseURL) => {
                try {
                    const response = await fetch(`${baseURL}/api/smart-ocr-learn`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            annotations: [{
                                type: "table-header",
                                content: "Production Test ISIN",
                                coordinates: { x: 100, y: 200, width: 150, height: 30 }
                            }],
                            corrections: [],
                            documentId: "render-production-test"
                        })
                    });
                    
                    return await response.json();
                } catch (error) {
                    return { error: error.message };
                }
            }, this.renderURL);
            
            if (learningResult.success) {
                console.log(`   ✅ Learning system working - New accuracy: ${learningResult.newAccuracy}%`);
                this.testResults.finalAccuracy = learningResult.newAccuracy;
                this.testResults.systemReady = true;
            } else {
                console.log(`   ❌ Learning system error: ${learningResult.error}`);
            }
            
            return true;
            
        } catch (error) {
            console.log(`❌ Puppeteer test failed: ${error.message}`);
            return false;
        }
    }

    async runProductionTest() {
        console.log('🚀 RENDER PRODUCTION DEPLOYMENT TEST');
        console.log('====================================');
        console.log('Testing complete Smart OCR system deployment\n');
        
        try {
            // Step 1: Check deployment status
            const deploymentStatus = await this.checkDeploymentStatus();
            
            if (!deploymentStatus.success) {
                console.log('\n❌ DEPLOYMENT NOT READY');
                console.log('=====================================');
                console.log('🔧 NEXT STEPS TO FIX:');
                console.log('1. Go to Render dashboard: https://dashboard.render.com');
                console.log('2. Find your service: smart-ocr-learning-system');
                console.log('3. Go to Environment tab');
                console.log('4. Add environment variable:');
                console.log('   Key: MISTRAL_API_KEY');
                console.log('   Value: <MISTRAL_API_KEY>');
                console.log('5. Save and wait for automatic redeploy');
                console.log('6. Run this test again');
                return this.testResults;
            }
            
            // Step 2: Test API endpoints
            const apiResults = await this.testSmartOCREndpoints();
            
            // Step 3: Test full workflow with Puppeteer
            const workflowSuccess = await this.testFullWorkflowWithPuppeteer();
            
            // Generate final report
            await this.generateReport();
            
            if (this.testResults.systemReady) {
                console.log('\n🎉 RENDER DEPLOYMENT SUCCESSFUL!');
                console.log('=================================');
                console.log(`🌐 Live URL: ${this.renderURL}`);
                console.log(`🎨 Annotation Interface: ${this.renderURL}/smart-annotation`);
                console.log(`🎯 Final Accuracy: ${this.testResults.finalAccuracy}%`);
                console.log('📸 Screenshots saved for proof');
                console.log('\n✅ SYSTEM IS LIVE AND READY FOR USE!');
            } else {
                console.log('\n⚠️  DEPLOYMENT PARTIALLY WORKING');
                console.log('Some features may need environment variable setup');
            }
            
        } catch (error) {
            console.log(`\n❌ TEST FAILED: ${error.message}`);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
        
        return this.testResults;
    }

    async generateReport() {
        const report = `
# 🚀 RENDER PRODUCTION DEPLOYMENT REPORT

**Test Timestamp**: ${this.testResults.timestamp}
**Deployment URL**: ${this.testResults.deploymentURL}
**System Ready**: ${this.testResults.systemReady ? '✅ YES' : '❌ NO'}
**Final Accuracy**: ${this.testResults.finalAccuracy}%

## Test Results Summary

${this.testResults.systemReady ? 
    '✅ **DEPLOYMENT SUCCESSFUL** - System is live and functional' : 
    '⚠️ **DEPLOYMENT NEEDS SETUP** - Environment variables required'}

## Screenshots Generated
- render-test-homepage.png
- render-test-annotation.png

## Next Steps
${this.testResults.systemReady ? 
    '🎯 Start using the annotation system to improve PDF processing accuracy!' :
    '🔧 Set MISTRAL_API_KEY environment variable in Render dashboard'}
        `;
        
        await require('fs').promises.writeFile('render-production-test-report.md', report);
        console.log('\n📄 Report saved: render-production-test-report.md');
    }
}

// Run the production test
const test = new RenderProductionTest();
test.runProductionTest().catch(console.error);

module.exports = RenderProductionTest;