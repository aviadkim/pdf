/**
 * Direct API Debug - Test different variations to find the error source
 */
const https = require('https');

console.log('🔍 DIRECT API DEBUGGING - FINDING ERROR SOURCE');
console.log('=============================================');

// Test 1: Direct Mistral API with clean key
async function test1_directMistralClean() {
    console.log('\n1️⃣ TEST 1: Direct Mistral API with alphanumeric-only key');
    
    // Remove ALL non-alphanumeric characters except dashes
    const cleanKey = 'pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs'.replace(/[^a-zA-Z0-9]/g, '');
    console.log('Clean key:', cleanKey);
    
    const payload = {
        model: "mistral-large-latest",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 10
    };
    
    const data = JSON.stringify(payload);
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'api.mistral.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`,
                'Content-Length': data.length
            }
        };
        
        const req = https.request(options, (res) => {
            console.log('Response:', res.statusCode);
            res.on('data', chunk => console.log('Data:', chunk.toString().substring(0, 100)));
            res.on('end', () => resolve());
        });
        
        req.on('error', (e) => {
            console.log('Error:', e.message);
            resolve();
        });
        
        req.write(data);
        req.end();
    });
}

// Test 2: Test with different header formats
async function test2_headerFormats() {
    console.log('\n2️⃣ TEST 2: Testing different Authorization header formats');
    
    const key = 'pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs';
    const formats = [
        `Bearer ${key}`,
        `bearer ${key}`,
        `BEARER ${key}`,
        key, // Without Bearer
        `Token ${key}`,
        `ApiKey ${key}`
    ];
    
    for (const format of formats) {
        console.log(`\nTesting format: "${format.substring(0, 20)}..."`);
        
        try {
            const options = {
                hostname: 'api.mistral.ai',
                path: '/v1/chat/completions',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': format
                }
            };
            
            // Just create the request to see if headers are valid
            const req = https.request(options);
            req.end();
            console.log('✅ Header format valid');
        } catch (e) {
            console.log('❌ Header error:', e.message);
        }
    }
}

// Test 3: Character-by-character analysis
async function test3_characterAnalysis() {
    console.log('\n3️⃣ TEST 3: Character-by-character analysis of API key');
    
    const key = 'pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs';
    console.log('Key length:', key.length);
    console.log('Characters:', key.split('').map((c, i) => `${i}:${c}(${c.charCodeAt(0)})`).join(' '));
    
    // Check for any non-ASCII characters
    const nonAscii = key.split('').filter(c => c.charCodeAt(0) > 127);
    if (nonAscii.length > 0) {
        console.log('❌ Non-ASCII characters found:', nonAscii);
    } else {
        console.log('✅ All characters are ASCII');
    }
    
    // Check for any whitespace
    if (key !== key.trim()) {
        console.log('❌ Whitespace detected');
    } else {
        console.log('✅ No whitespace');
    }
}

// Test 4: Test Bearer token separately
async function test4_bearerToken() {
    console.log('\n4️⃣ TEST 4: Testing Bearer token construction');
    
    const key = 'pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs';
    
    // Different ways to construct Bearer token
    const constructions = [
        { name: 'String concat', value: 'Bearer ' + key },
        { name: 'Template literal', value: `Bearer ${key}` },
        { name: 'Array join', value: ['Bearer', key].join(' ') },
        { name: 'Buffer', value: Buffer.from(`Bearer ${key}`).toString() }
    ];
    
    for (const construct of constructions) {
        console.log(`\n${construct.name}:`);
        console.log('Length:', construct.value.length);
        console.log('First 20 chars:', construct.value.substring(0, 20));
        console.log('Has invalid chars:', /[^\x20-\x7E]/.test(construct.value) ? 'YES' : 'NO');
    }
}

// Test 5: Environment variable check
async function test5_envVariable() {
    console.log('\n5️⃣ TEST 5: Environment variable analysis');
    
    const envKey = process.env.MISTRAL_API_KEY;
    
    if (envKey) {
        console.log('Env key exists');
        console.log('Length:', envKey.length);
        console.log('Trimmed length:', envKey.trim().length);
        console.log('Starts with space:', envKey[0] === ' ');
        console.log('Ends with space:', envKey[envKey.length - 1] === ' ');
        console.log('Contains newline:', envKey.includes('\\n'));
        console.log('Contains carriage return:', envKey.includes('\\r'));
    } else {
        console.log('No MISTRAL_API_KEY in environment');
    }
}

// Test 6: Test actual HTTP request creation
async function test6_httpRequest() {
    console.log('\n6️⃣ TEST 6: Testing actual HTTP request creation');
    
    const testHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer pgPfIqCxT8hYJ4V9e1EeOR1jcwAGxocs',
        'X-Test-Header': 'test-value'
    };
    
    try {
        const options = {
            hostname: 'api.mistral.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: testHeaders
        };
        
        const req = https.request(options);
        console.log('✅ Request created successfully');
        req.destroy(); // Don't actually send it
    } catch (e) {
        console.log('❌ Request creation failed:', e.message);
        console.log('Error code:', e.code);
    }
}

// Run all tests
async function runAllTests() {
    await test1_directMistralClean();
    await test2_headerFormats();
    await test3_characterAnalysis();
    await test4_bearerToken();
    await test5_envVariable();
    await test6_httpRequest();
    
    console.log('\n🎯 DEBUGGING COMPLETE');
    console.log('====================');
    console.log('Check the results above to identify the error source');
}

runAllTests().catch(console.error);