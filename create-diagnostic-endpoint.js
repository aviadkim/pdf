/**
 * Create a diagnostic endpoint to see exactly what's happening with Mistral
 */
const fs = require('fs');

console.log('🩺 CREATING DIAGNOSTIC ENDPOINT FOR MISTRAL');
console.log('==========================================');

// Add a new diagnostic endpoint to express-server.js
const diagnosticEndpoint = `
// Diagnostic endpoint for Mistral debugging
app.get('/api/mistral-diagnostic', (req, res) => {
    const rawKey = process.env.MISTRAL_API_KEY;
    
    const diagnostic = {
        timestamp: new Date().toISOString(),
        environment: {
            hasKey: !!rawKey,
            keyLength: rawKey ? rawKey.length : 0,
            keyPreview: rawKey ? rawKey.substring(0, 10) + '...' : 'NO_KEY',
            keyCharCodes: rawKey ? rawKey.split('').map((c, i) => ({
                index: i,
                char: c === '\\n' ? '\\\\n' : c === '\\r' ? '\\\\r' : c === '\\t' ? '\\\\t' : c,
                code: c.charCodeAt(0)
            })).slice(0, 5) : []
        },
        tests: {}
    };
    
    if (rawKey) {
        // Test different cleaning methods
        diagnostic.tests.trimmed = {
            value: rawKey.trim(),
            length: rawKey.trim().length,
            different: rawKey !== rawKey.trim()
        };
        
        diagnostic.tests.noQuotes = {
            value: rawKey.replace(/['"]/g, ''),
            length: rawKey.replace(/['"]/g, '').length,
            different: rawKey !== rawKey.replace(/['"]/g, '')
        };
        
        diagnostic.tests.noWhitespace = {
            value: rawKey.replace(/\\s/g, ''),
            length: rawKey.replace(/\\s/g, '').length,
            different: rawKey !== rawKey.replace(/\\s/g, '')
        };
        
        diagnostic.tests.fullClean = {
            value: rawKey.trim().replace(/[\\r\\n\\t'"]/g, ''),
            length: rawKey.trim().replace(/[\\r\\n\\t'"]/g, '').length
        };
        
        // Test authorization header construction
        try {
            const testHeader = \`Bearer \${rawKey.trim()}\`;
            diagnostic.headerTest = {
                success: true,
                headerLength: testHeader.length,
                headerPreview: testHeader.substring(0, 20) + '...'
            };
        } catch (e) {
            diagnostic.headerTest = {
                success: false,
                error: e.message
            };
        }
        
        // Test direct API call
        const https = require('https');
        const testPayload = JSON.stringify({
            model: "mistral-large-latest",
            messages: [{ role: "user", content: "Test" }],
            max_tokens: 10
        });
        
        const cleanKey = rawKey.trim().replace(/[\\r\\n\\t'"]/g, '');
        
        diagnostic.apiTest = {
            keyUsed: cleanKey.substring(0, 10) + '...',
            keyLength: cleanKey.length
        };
        
        const options = {
            hostname: 'api.mistral.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': \`Bearer \${cleanKey}\`,
                'Content-Length': Buffer.byteLength(testPayload)
            }
        };
        
        const apiReq = https.request(options, (apiRes) => {
            diagnostic.apiTest.statusCode = apiRes.statusCode;
            diagnostic.apiTest.statusMessage = apiRes.statusMessage;
            
            let responseData = '';
            apiRes.on('data', chunk => responseData += chunk);
            apiRes.on('end', () => {
                if (apiRes.statusCode === 200) {
                    diagnostic.apiTest.result = 'SUCCESS - API key works!';
                } else {
                    diagnostic.apiTest.result = responseData.substring(0, 200);
                }
                res.json(diagnostic);
            });
        });
        
        apiReq.on('error', (error) => {
            diagnostic.apiTest.error = error.message;
            diagnostic.apiTest.errorCode = error.code;
            res.json(diagnostic);
        });
        
        apiReq.write(testPayload);
        apiReq.end();
        
    } else {
        res.json(diagnostic);
    }
});
`;

// Read current express-server.js
let serverContent = fs.readFileSync('express-server.js', 'utf8');

// Check if diagnostic endpoint already exists
if (!serverContent.includes('/api/mistral-diagnostic')) {
    // Find a good place to insert (after other endpoints)
    const insertPoint = serverContent.lastIndexOf('app.post(\'/api/');
    const afterEndpoint = serverContent.indexOf('});', insertPoint) + 3;
    
    // Insert the diagnostic endpoint
    serverContent = serverContent.slice(0, afterEndpoint) + '\n' + diagnosticEndpoint + '\n' + serverContent.slice(afterEndpoint);
    
    // Add diagnostic marker
    const marker = '// MISTRAL_DIAGNOSTIC_ENDPOINT: ' + Date.now() + '\n';
    serverContent = serverContent.replace('// MISTRAL_HEADER_CLEAN_FIX:', marker + '// MISTRAL_HEADER_CLEAN_FIX:');
    
    // Write back
    fs.writeFileSync('express-server.js', serverContent);
    
    console.log('✅ Diagnostic endpoint added to express-server.js');
    console.log('📋 Endpoint: GET /api/mistral-diagnostic');
    console.log('🔍 This will show:');
    console.log('   - Exact API key format in environment');
    console.log('   - Character-by-character analysis');
    console.log('   - Different cleaning methods');
    console.log('   - Direct API test result');
    console.log('');
    console.log('🚀 Commit and deploy this to see what\'s happening!');
} else {
    console.log('ℹ️ Diagnostic endpoint already exists');
}