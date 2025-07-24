#!/usr/bin/env node

/**
 * Monitor Render Deployment Progress
 * Continuously checks endpoint availability until deployment completes
 */

const https = require('https');

const RENDER_BASE_URL = 'https://pdf-fzzi.onrender.com';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_WAIT_TIME = 900000; // 15 minutes

const targetEndpoints = [
    '/api/ultra-accurate-extract',
    '/api/phase2-enhanced-extract', 
    '/api/mistral-ocr-extract',
    '/api/smart-ocr-extract'
];

const workingEndpoints = [
    '/api/test',
    '/api/bulletproof-processor',
    '/api/pdf-extract'
];

class RenderDeploymentMonitor {
    constructor() {
        this.startTime = Date.now();
        this.deploymentComplete = false;
        this.checks = 0;
    }

    async checkEndpoint(endpoint) {
        return new Promise((resolve) => {
            const url = `${RENDER_BASE_URL}${endpoint}`;
            
            const req = https.get(url, (res) => {
                const isWorking = res.statusCode !== 404;
                resolve({ endpoint, status: res.statusCode, working: isWorking });
            });
            
            req.on('error', () => {
                resolve({ endpoint, status: 'ERROR', working: false });
            });
            
            req.setTimeout(10000, () => {
                req.destroy();
                resolve({ endpoint, status: 'TIMEOUT', working: false });
            });
        });
    }

    async checkAllEndpoints() {
        this.checks++;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        
        console.log(`\n🔍 Check #${this.checks} (${elapsed}s elapsed)`);
        console.log('='.repeat(50));
        
        // Check working endpoints (should stay working)
        console.log('✅ Baseline endpoints:');
        for (const endpoint of workingEndpoints) {
            const result = await this.checkEndpoint(endpoint);
            const icon = result.working ? '✅' : '❌';
            console.log(`   ${icon} ${endpoint}: ${result.status}`);
        }
        
        // Check target endpoints (should become available)
        console.log('\n🎯 Target endpoints:');
        let newEndpointsWorking = 0;
        
        for (const endpoint of targetEndpoints) {
            const result = await this.checkEndpoint(endpoint);
            const icon = result.working ? '✅' : '❌';
            console.log(`   ${icon} ${endpoint}: ${result.status}`);
            
            if (result.working) {
                newEndpointsWorking++;
            }
        }
        
        // Check if deployment is complete
        if (newEndpointsWorking === targetEndpoints.length) {
            this.deploymentComplete = true;
            console.log('\n🎉 DEPLOYMENT COMPLETE!');
            console.log(`   All ${targetEndpoints.length} new endpoints are now available`);
            console.log(`   Total deployment time: ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
            return true;
        } else {
            const remaining = targetEndpoints.length - newEndpointsWorking;
            console.log(`\n⏳ Deployment in progress...`);
            console.log(`   ${newEndpointsWorking}/${targetEndpoints.length} new endpoints available`);
            console.log(`   ${remaining} endpoints still deploying`);
            return false;
        }
    }

    async waitForDeployment() {
        console.log('🚀 Monitoring Render Deployment Progress');
        console.log(`📍 Service: ${RENDER_BASE_URL}`);
        console.log(`⏱️  Check interval: ${CHECK_INTERVAL / 1000}s`);
        console.log(`⏰ Max wait time: ${MAX_WAIT_TIME / 60000} minutes`);
        console.log('='.repeat(60));

        while (!this.deploymentComplete && (Date.now() - this.startTime) < MAX_WAIT_TIME) {
            const isComplete = await this.checkAllEndpoints();
            
            if (isComplete) {
                break;
            }
            
            console.log(`\n💤 Waiting ${CHECK_INTERVAL / 1000}s for next check...`);
            await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        }
        
        if (!this.deploymentComplete) {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            console.log('\n⚠️  DEPLOYMENT TIMEOUT');
            console.log(`   Waited ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`);
            console.log('   Some endpoints may still be deploying');
            console.log('\n💡 Next steps:');
            console.log('   1. Check Render dashboard for deployment logs');
            console.log('   2. Verify no build errors or import issues');  
            console.log('   3. Consider manual redeploy if needed');
        }
        
        return this.deploymentComplete;
    }
}

// Run the monitor
const monitor = new RenderDeploymentMonitor();
monitor.waitForDeployment().catch(console.error);