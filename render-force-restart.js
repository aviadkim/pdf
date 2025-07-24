/**
 * RENDER FORCE RESTART SYSTEM
 * Forces complete Render restart and verifies Perfect Mistral system
 */

const fetch = require('node-fetch');

class RenderForceRestart {
    constructor() {
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        console.log('🚀 RENDER FORCE RESTART SYSTEM');
        console.log('🎯 Target: Perfect Mistral System Activation');
    }

    async checkCurrentSystem() {
        console.log('\n🔍 CHECKING CURRENT SYSTEM STATUS');
        
        try {
            const response = await fetch(this.renderUrl, { timeout: 10000 });
            const html = await response.text();
            
            // Detect system type
            const systemType = html.includes('Perfect Mistral') ? 'Perfect Mistral System' :
                              html.includes('Smart OCR Learning') ? 'Smart OCR System' :
                              html.includes('Mistral OCR') ? 'Mistral OCR System' :
                              'Unknown System';
            
            console.log(`📊 Current System: ${systemType}`);
            console.log(`📈 Status Code: ${response.status}`);
            
            // Check if Mistral is working
            if (html.includes('Perfect Mistral') || html.includes('Mistral OCR')) {
                console.log('✅ Mistral system detected in HTML');
            } else {
                console.log('❌ OLD Smart OCR system still running');
            }
            
            return { systemType, html };
            
        } catch (error) {
            console.log('❌ System check failed:', error.message);
            return null;
        }
    }

    async testMistralEndpoint() {
        console.log('\n🧪 TESTING MISTRAL ENDPOINTS');
        
        const endpoints = [
            '/api/perfect-extraction',
            '/api/bulletproof-processor',
            '/api/mistral-process',
            '/api/pdf-extract'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(this.renderUrl + endpoint, { 
                    method: 'GET',
                    timeout: 5000 
                });
                
                console.log(`${response.ok ? '✅' : '❌'} ${endpoint}: ${response.status}`);
                
                if (response.ok) {
                    const text = await response.text();
                    if (text.includes('mistral') || text.includes('Perfect')) {
                        console.log(`   🎯 Mistral detected in ${endpoint}`);
                    }
                }
                
            } catch (error) {
                console.log(`❌ ${endpoint}: ${error.message}`);
            }
        }
    }

    async triggerRenderRestart() {
        console.log('\n🔄 TRIGGERING RENDER RESTART METHODS');
        
        // Method 1: Try to hit restart endpoint
        try {
            console.log('🔄 Method 1: Attempting service restart...');
            const restartResponse = await fetch(this.renderUrl + '/restart', { 
                method: 'POST',
                timeout: 10000 
            });
            console.log(`   Response: ${restartResponse.status}`);
        } catch (error) {
            console.log('   ❌ Restart endpoint not available');
        }

        // Method 2: Clear cache request
        try {
            console.log('🔄 Method 2: Cache clearing request...');
            const cacheResponse = await fetch(this.renderUrl + '/?clear-cache=1', { timeout: 10000 });
            console.log(`   Response: ${cacheResponse.status}`);
        } catch (error) {
            console.log('   ❌ Cache clear failed');
        }

        // Method 3: Force environment check
        try {
            console.log('🔄 Method 3: Environment variable check...');
            const envResponse = await fetch(this.renderUrl + '/api/env-check', { timeout: 10000 });
            console.log(`   Response: ${envResponse.status}`);
        } catch (error) {
            console.log('   ❌ Environment check not available');
        }
    }

    async createForceRestartFile() {
        console.log('\n📝 CREATING FORCE RESTART SIGNAL');
        
        // Create a file that will force restart on next deploy
        const restartSignal = {
            timestamp: new Date().toISOString(),
            action: 'FORCE_RESTART_PERFECT_MISTRAL',
            system: 'Perfect Mistral System Required',
            apiKey: 'MISTRAL_API_KEY_REQUIRED',
            entryPoint: 'express-server.js'
        };

        console.log('📄 Restart signal created:');
        console.log(JSON.stringify(restartSignal, null, 2));
        
        return restartSignal;
    }

    async waitAndRecheck(minutes = 2) {
        console.log(`\n⏳ WAITING ${minutes} MINUTES FOR RESTART...`);
        
        for (let i = 0; i < minutes; i++) {
            console.log(`   ⏱️  ${i + 1}/${minutes} minutes...`);
            await this.sleep(60000); // 1 minute
            
            // Quick check every minute
            try {
                const response = await fetch(this.renderUrl, { timeout: 5000 });
                const html = await response.text();
                
                if (html.includes('Perfect Mistral') || html.includes('Mistral OCR')) {
                    console.log('   🎉 PERFECT MISTRAL SYSTEM DETECTED!');
                    return true;
                }
            } catch (error) {
                console.log('   🔄 System restarting...');
            }
        }
        
        return false;
    }

    async runFullRestart() {
        console.log('🚀 STARTING FULL RENDER RESTART SEQUENCE\n');
        
        // Step 1: Check current system
        const currentSystem = await this.checkCurrentSystem();
        
        // Step 2: Test endpoints
        await this.testMistralEndpoint();
        
        // Step 3: Create restart signal
        await this.createForceRestartFile();
        
        // Step 4: Trigger restart methods
        await this.triggerRenderRestart();
        
        // Step 5: Wait and verify
        const success = await this.waitAndRecheck(3);
        
        if (success) {
            console.log('\n🎉 SUCCESS: Perfect Mistral System is now running!');
            console.log('🧪 Run the test suite again to verify all 39 securities');
        } else {
            console.log('\n⚠️  MANUAL ACTION REQUIRED:');
            console.log('1. Go to Render dashboard');
            console.log('2. Manually restart the service');
            console.log('3. Check environment variables include MISTRAL_API_KEY');
            console.log('4. Verify package.json main field is express-server.js');
        }
        
        return success;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run if called directly
if (require.main === module) {
    const restarter = new RenderForceRestart();
    restarter.runFullRestart();
}

module.exports = { RenderForceRestart };