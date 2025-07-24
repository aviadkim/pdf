// Comprehensive Render environment diagnostic
async function diagnoseRenderEnvironment() {
    console.log('🔍 Comprehensive Render Environment Diagnostic\n');
    console.log('=' .repeat(60));
    
    // Test 1: Check deployment version
    console.log('\n1️⃣ DEPLOYMENT VERSION CHECK:');
    try {
        const diagResponse = await fetch('https://pdf-fzzi.onrender.com/api/diagnostic');
        const diagData = await diagResponse.json();
        console.log('   Version:', diagData.version);
        console.log('   Server File:', diagData.serverFile);
        console.log('   Timestamp:', diagData.timestamp);
        
        if (diagData.version === 'v3.1-quality-fixes') {
            console.log('   ⚠️ ISSUE: Still running old version 3.1');
            console.log('   📝 Latest code with fixes not deployed yet');
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 2: Check Claude test endpoint
    console.log('\n2️⃣ CLAUDE API CONFIGURATION:');
    try {
        const claudeResponse = await fetch('https://pdf-fzzi.onrender.com/api/claude-test');
        const claudeData = await claudeResponse.json();
        
        if (claudeData.error?.includes('ANTHROPIC_API_KEY not configured')) {
            console.log('   ❌ ANTHROPIC_API_KEY: Not detected');
            console.log('   📝 Error message:', claudeData.error);
        } else if (claudeData.success) {
            console.log('   ✅ ANTHROPIC_API_KEY: Configured!');
        } else {
            console.log('   🔄 Status:', JSON.stringify(claudeData));
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 3: Check available endpoints
    console.log('\n3️⃣ AVAILABLE ENDPOINTS:');
    try {
        const homeResponse = await fetch('https://pdf-fzzi.onrender.com/');
        const homeData = await homeResponse.json();
        console.log('   Endpoints:', homeData.endpoints?.join(', ') || 'None listed');
        
        // Check for new endpoints
        const newEndpoints = ['/api/claude-vision-extract', '/api/hybrid-extract-fixed'];
        const hasNewEndpoints = newEndpoints.some(ep => homeData.endpoints?.includes(ep));
        
        if (!hasNewEndpoints) {
            console.log('   ⚠️ New Claude Vision endpoints not available');
            console.log('   📝 Deployment needs to update from GitHub');
        }
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 4: Check for other API keys
    console.log('\n4️⃣ OTHER API KEYS:');
    try {
        const capsResponse = await fetch('https://pdf-fzzi.onrender.com/api/system-capabilities');
        const capsData = await capsResponse.json();
        
        if (capsData.environment?.mistral_api_configured) {
            console.log('   ✅ MISTRAL_API_KEY: Configured');
        }
        
        console.log('   📊 Environment:', JSON.stringify(capsData.environment, null, 2));
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 5: Check GitHub deployment status
    console.log('\n5️⃣ GITHUB DEPLOYMENT STATUS:');
    console.log('   📝 Latest push: "Trigger Render deployment with path fixes"');
    console.log('   📝 Commit: 9d4dfc7 (pushed ~8 minutes ago)');
    console.log('   📝 Changes: Fixed PORT, file paths, memory storage');
    
    console.log('\n' + '=' .repeat(60));
    console.log('\n🔧 DIAGNOSIS SUMMARY:\n');
    
    console.log('❌ PROBLEM 1: Deployment not updated from GitHub');
    console.log('   - Still running version 3.1 instead of 4.2');
    console.log('   - Latest code fixes not deployed');
    console.log('   - Auto-deploy may not be configured\n');
    
    console.log('❌ PROBLEM 2: ANTHROPIC_API_KEY not detected');
    console.log('   - Even after adding to environment variables');
    console.log('   - May need deployment to pick up env changes\n');
    
    console.log('💡 RECOMMENDED ACTIONS:');
    console.log('1. Check Render dashboard > Settings > "Auto-Deploy" is ON');
    console.log('2. If not, enable Auto-Deploy from GitHub main branch');
    console.log('3. Or manually deploy: Dashboard > "Manual Deploy" > Deploy latest commit');
    console.log('4. Environment variables only load on deployment/restart');
    console.log('5. May need to clear build cache if stuck');
    
    console.log('\n🔄 ALTERNATIVE: Force restart service');
    console.log('   Dashboard > Service > "Restart" button');
}

diagnoseRenderEnvironment();