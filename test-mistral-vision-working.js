/**
 * Test Mistral with a standard vision model that can handle PDF OCR
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testMistralVisionWorking() {
    const apiKey = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
    
    try {
        console.log('🔑 Testing Mistral with standard models for OCR...');
        
        // Try different models that might work for OCR
        const models = [
            'mistral-large-latest',
            'mistral-medium-latest', 
            'ministral-8b-latest',
            'mistral-small-latest'
        ];
        
        for (const model of models) {
            console.log(`\n🧪 Testing model: ${model}`);
            
            try {
                const payload = {
                    model: model,
                    messages: [{
                        role: 'user',
                        content: 'Can you help me extract text from a financial PDF document? I need to extract ISINs (International Securities Identification Numbers) and their associated market values. The document is a portfolio statement from Messos Bank dated March 31, 2025. Please respond with "YES" if you can help with PDF OCR tasks.'
                    }],
                    max_tokens: 100
                };
                
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    console.log(`✅ ${model}: ${content?.substring(0, 100)}...`);
                    
                    // If this model responds positively, let's try OCR with it
                    if (content?.toLowerCase().includes('yes') || content?.toLowerCase().includes('help')) {
                        console.log(`\n🎯 ${model} seems capable! Let's try a small OCR test...`);
                        
                        // Try with a simple text extraction request
                        const ocrPayload = {
                            model: model,
                            messages: [{
                                role: 'user',
                                content: `I have a PDF financial document. Even though I can't send the actual PDF, can you explain how to extract:

1. ISIN codes (format: 2 letters + 10 alphanumeric characters like "CH1234567890")
2. Market values in CHF (Swiss Francs)
3. Security names

From a typical portfolio statement? What patterns should I look for?`
                            }],
                            max_tokens: 500
                        };
                        
                        const ocrResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(ocrPayload)
                        });
                        
                        if (ocrResponse.ok) {
                            const ocrData = await ocrResponse.json();
                            const ocrContent = ocrData.choices?.[0]?.message?.content;
                            
                            console.log(`\n📄 ${model} OCR guidance:`);
                            console.log('=' .repeat(50));
                            console.log(ocrContent);
                            console.log('=' .repeat(50));
                            
                            // Save the working model info
                            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                            const filename = `mistral-working-model-${timestamp}.json`;
                            await fs.promises.writeFile(filename, JSON.stringify({
                                workingModel: model,
                                response: ocrContent,
                                timestamp: new Date().toISOString(),
                                usage: ocrData.usage
                            }, null, 2));
                            
                            console.log(`\n💾 Working model info saved to: ${filename}`);
                            console.log(`🎉 Found working model: ${model}`);
                            
                            return {
                                success: true,
                                workingModel: model,
                                content: ocrContent
                            };
                        }
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`❌ ${model}: ${errorText.substring(0, 100)}...`);
                }
                
            } catch (error) {
                console.log(`❌ ${model}: ${error.message}`);
            }
        }
        
        return { success: false, error: 'No working models found' };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

if (require.main === module) {
    testMistralVisionWorking().catch(console.error);
}

module.exports = { testMistralVisionWorking };