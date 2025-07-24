/**
 * Test Mistral API directly to check authentication and available models
 */

const fetch = require('node-fetch');

async function testMistralAPI() {
    const apiKey = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
    
    try {
        console.log('🔍 Testing Mistral API authentication...');
        
        // Test 1: List available models
        console.log('\n📋 Fetching available models...');
        const modelsResponse = await fetch('https://api.mistral.ai/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Models API Status: ${modelsResponse.status}`);
        
        if (modelsResponse.ok) {
            const modelsData = await modelsResponse.json();
            console.log('✅ Authentication successful!');
            console.log(`📊 Available models: ${modelsData.data?.length || 0}`);
            
            // Show first few models
            if (modelsData.data && modelsData.data.length > 0) {
                console.log('\n🎯 Available models:');
                modelsData.data.slice(0, 10).forEach(model => {
                    console.log(`- ${model.id} (${model.object})`);
                });
                
                // Check for OCR-specific models
                const ocrModels = modelsData.data.filter(model => 
                    model.id.toLowerCase().includes('ocr') || 
                    model.id.toLowerCase().includes('vision') ||
                    model.id.toLowerCase().includes('document')
                );
                
                if (ocrModels.length > 0) {
                    console.log('\n🔍 OCR/Vision models found:');
                    ocrModels.forEach(model => {
                        console.log(`- ${model.id}`);
                    });
                } else {
                    console.log('\n⚠️ No specific OCR models found in the list');
                }
            }
            
        } else {
            const errorData = await modelsResponse.text();
            console.error('❌ Authentication failed:', modelsResponse.status, errorData);
            return false;
        }
        
        // Test 2: Try a simple text completion to verify API key works
        console.log('\n🧪 Testing simple text completion...');
        const testResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'mistral-small-latest',
                messages: [{
                    role: 'user',
                    content: 'Hello, can you see this message?'
                }],
                max_tokens: 50
            })
        });
        
        console.log(`Chat API Status: ${testResponse.status}`);
        
        if (testResponse.ok) {
            const testData = await testResponse.json();
            console.log('✅ Chat API working!');
            console.log(`Response: ${testData.choices?.[0]?.message?.content || 'No content'}`);
        } else {
            const errorData = await testResponse.text();
            console.error('❌ Chat API failed:', testResponse.status, errorData);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        return false;
    }
}

if (require.main === module) {
    testMistralAPI().catch(console.error);
}

module.exports = { testMistralAPI };