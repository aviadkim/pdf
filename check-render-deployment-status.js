/**
 * RENDER DEPLOYMENT STATUS CHECKER
 * Monitors Render deployment and tests when ready
 */

const fetch = require('node-fetch');

class RenderDeploymentChecker {
    constructor() {
        this.renderURL = 'https://pdf-fzzi.onrender.com';
        this.maxRetries = 30;
        this.retryInterval = 10000; // 10 seconds
    }

    async checkDeploymentStatus() {
        console.log('🚀 CHECKING RENDER DEPLOYMENT STATUS');
        console.log('====================================');
        console.log(`🌐 URL: ${this.renderURL}`);
        console.log(`⏰ Max wait time: ${(this.maxRetries * this.retryInterval) / 60000} minutes\n`);
        
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`📡 Attempt ${attempt}/${this.maxRetries} - Checking deployment...`);
                
                const response = await fetch(this.renderURL, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Deployment-Checker/1.0'
                    }
                });
                
                if (response.ok) {
                    const content = await response.text();
                    
                    if (content.includes('Vercel build complete')) {
                        console.log('⚠️  Still showing "Vercel build complete" - deployment in progress...');
                    } else if (content.includes('Financial PDF Processing System')) {
                        console.log('✅ DEPLOYMENT SUCCESSFUL!');
                        console.log('🎯 Interface is live and working');
                        
                        // Test API endpoints
                        await this.testAPIEndpoints();
                        return true;
                    } else {
                        console.log('⚠️  Unexpected content - deployment may be updating...');
                    }
                } else {
                    console.log(`❌ HTTP ${response.status} - Service not ready yet`);
                }
                
            } catch (error) {
                console.log(`❌ Connection failed: ${error.message}`);
            }
            
            if (attempt < this.maxRetries) {
                console.log(`⏳ Waiting ${this.retryInterval/1000}s before next check...\n`);
                await new Promise(resolve => setTimeout(resolve, this.retryInterval));
            }
        }
        
        console.log('❌ DEPLOYMENT CHECK TIMEOUT');
        console.log('Please check Render dashboard for deployment status');
        return false;
    }

    async testAPIEndpoints() {
        console.log('\n🧪 TESTING API ENDPOINTS');
        console.log('========================');
        
        const endpoints = [
            '/api/smart-ocr-test',
            '/api/smart-ocr-stats',
            '/smart-annotation'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${this.renderURL}${endpoint}`, {
                    timeout: 5000
                });
                
                if (response.ok) {
                    console.log(`✅ ${endpoint} - OK (${response.status})`);
                    
                    if (endpoint === '/api/smart-ocr-stats') {
                        const data = await response.json();
                        console.log(`   📊 Accuracy: ${data.stats.currentAccuracy}%`);
                        console.log(`   🧠 Patterns: ${data.stats.patternsLearned}`);
                    }
                } else {
                    console.log(`❌ ${endpoint} - ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ ${endpoint} - ${error.message}`);
            }
        }
    }

    async run() {
        const success = await this.checkDeploymentStatus();
        
        if (success) {
            console.log('\n🎉 RENDER DEPLOYMENT COMPLETE!');
            console.log('===============================');
            console.log(`🌐 Live URL: ${this.renderURL}`);
            console.log(`🎨 Annotation Interface: ${this.renderURL}/smart-annotation`);
            console.log('');
            console.log('🔧 NEXT STEPS:');
            console.log('1. Add MISTRAL_API_KEY to Render environment secrets');
            console.log('2. Set MISTRAL_API_KEY = <your-api-key>');
            console.log('3. Run comprehensive Puppeteer tests');
            console.log('');
            console.log('💡 To test now, run:');
            console.log('node test-render-deployment-comprehensive.js');
        } else {
            console.log('\n❌ DEPLOYMENT CHECK FAILED');
            console.log('Check Render dashboard for build logs');
        }
        
        return success;
    }
}

// Run the checker
const checker = new RenderDeploymentChecker();
checker.run().catch(console.error);

module.exports = RenderDeploymentChecker;