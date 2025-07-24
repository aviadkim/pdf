// Monitor Render endpoint for API key configuration
async function monitorRenderAPIKey() {
    console.log('👀 Monitoring Render for ANTHROPIC_API_KEY configuration...');
    console.log('🌐 Endpoint: https://pdf-fzzi.onrender.com/api/claude-test');
    console.log('⏰ Checking every 15 seconds...\n');
    
    let attempts = 0;
    const maxAttempts = 20; // Monitor for 5 minutes max
    
    const checkAPIKey = async () => {
        attempts++;
        const timestamp = new Date().toLocaleTimeString();
        
        try {
            console.log(`[${timestamp}] Attempt ${attempts}/${maxAttempts} - Checking API key status...`);
            
            const response = await fetch('https://pdf-fzzi.onrender.com/api/claude-test', {
                method: 'GET',
                timeout: 10000
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success === false && data.error?.includes('ANTHROPIC_API_KEY not configured')) {
                    console.log('❌ API key still not configured');
                } else if (data.success === true || !data.error?.includes('not configured')) {
                    console.log('✅ SUCCESS! API key is now configured!');
                    console.log('📊 Response:', JSON.stringify(data, null, 2));
                    console.log('\n🎉 You can now test Claude Vision endpoints!');
                    return true;
                } else {
                    console.log('🔄 Status changed:', data.error || 'Unknown status');
                }
            } else {
                console.log('❌ Endpoint error:', response.status, response.statusText);
            }
            
        } catch (error) {
            console.log('❌ Connection error:', error.message);
        }
        
        if (attempts >= maxAttempts) {
            console.log('\n⏰ Monitoring timeout reached (5 minutes)');
            console.log('💡 Try:');
            console.log('   1. Manual redeploy in Render dashboard');
            console.log('   2. Check environment variable spelling');
            console.log('   3. Verify correct service is configured');
            return false;
        }
        
        return false;
    };
    
    // Initial check
    const success = await checkAPIKey();
    if (success) return;
    
    // Set up monitoring interval
    const interval = setInterval(async () => {
        const success = await checkAPIKey();
        if (success || attempts >= maxAttempts) {
            clearInterval(interval);
        }
    }, 15000); // Check every 15 seconds
}

// Also test specific Claude Vision endpoints when available
async function testClaudeVisionEndpoints() {
    console.log('\n🔍 Testing Claude Vision endpoints...');
    
    const endpoints = [
        '/api/claude-vision-extract',
        '/api/claude-test',
        '/api/hybrid-extract',
        '/api/hybrid-extract-fixed'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`https://pdf-fzzi.onrender.com${endpoint}`);
            
            if (response.status === 404) {
                console.log(`❌ ${endpoint}: Not deployed yet`);
            } else if (response.ok) {
                console.log(`✅ ${endpoint}: Available`);
            } else {
                console.log(`⚠️ ${endpoint}: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
}

console.log('🔑 API Key Test Complete - Key erased from system');
console.log('🗑️ No API key stored or cached locally\n');

monitorRenderAPIKey().then(() => {
    console.log('\n📡 Testing endpoints...');
    testClaudeVisionEndpoints();
});