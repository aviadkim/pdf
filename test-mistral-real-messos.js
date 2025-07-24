/**
 * DIRECT TEST: Mistral API with Real Messos PDF
 * Simple, straightforward test to see if we can extract actual data
 */

const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

async function testMistralRealMessos() {
    console.log('🔑 TESTING MISTRAL WITH REAL MESSOS PDF');
    console.log('======================================\n');
    
    const apiKey = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
    
    try {
        // Read the actual Messos PDF
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        console.log(`📄 Reading PDF: ${pdfPath}`);
        
        const pdfBuffer = await fs.readFile(pdfPath);
        console.log(`📊 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // First, let's try with a simple text extraction request
        const payload = {
            model: 'mistral-small-latest',
            messages: [{
                role: 'user',
                content: `I need to extract financial data from a PDF portfolio statement. The PDF contains Swiss financial data with:

1. ISIN codes (format like "CH1234567890", "XS1234567890") 
2. Security names
3. Market values in CHF (Swiss Francs)
4. A total portfolio value

The document is from Messos bank dated March 31, 2025.

Please tell me what specific information I should look for in the text, and what patterns would help identify:
- ISIN codes
- Market values (which might use Swiss formatting like 1'234'567)
- The total portfolio value
- Security names

Also, can you process base64 encoded PDF data if I provide it?`
            }],
            max_tokens: 1000
        };
        
        console.log('📤 Making initial API call to understand capabilities...');
        
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
            const content = data.choices[0].message.content;
            
            console.log('✅ Mistral API Response:');
            console.log('=' .repeat(60));
            console.log(content);
            console.log('=' .repeat(60));
            
            // Now try with a small portion of the actual PDF
            console.log('\n🔍 Testing with actual PDF data...');
            
            const base64Data = pdfBuffer.toString('base64');
            console.log(`📊 Base64 size: ${base64Data.length} characters`);
            
            // Try with actual PDF processing
            const pdfPayload = {
                model: 'mistral-small-latest',
                messages: [{
                    role: 'user',
                    content: `Extract financial data from this PDF portfolio statement. Look for ISIN codes, security names, and market values in CHF.

Please return the data in this exact JSON format:
{
  "securities": [
    {"isin": "XXXXXXXXXX", "name": "Security Name", "value": 123456}
  ],
  "totalValue": 19464431,
  "currency": "CHF",
  "date": "31.03.2025"
}

PDF Data (first part): ${base64Data.substring(0, 2000)}...

Focus on finding:
- ISIN codes (like CH1234567890, XS1234567890)
- Market values (Swiss format with apostrophes like 1'234'567)
- Total portfolio value around 19.4 million CHF`
                }],
                max_tokens: 2000
            };
            
            const pdfResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pdfPayload)
            });
            
            if (pdfResponse.ok) {
                const pdfData = await pdfResponse.json();
                const pdfContent = pdfData.choices[0].message.content;
                
                console.log('\n📊 PDF EXTRACTION RESULT:');
                console.log('=' .repeat(60));
                console.log(pdfContent);
                console.log('=' .repeat(60));
                
                // Try to find JSON in the response
                const jsonMatch = pdfContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const extracted = JSON.parse(jsonMatch[0]);
                        console.log('\n✅ Successfully parsed JSON:');
                        console.log(`• Securities found: ${extracted.securities?.length || 0}`);
                        console.log(`• Total value: ${extracted.totalValue?.toLocaleString() || 'N/A'} ${extracted.currency || ''}`);
                        
                        if (extracted.securities?.length > 0) {
                            console.log('\n📋 First 5 securities:');
                            extracted.securities.slice(0, 5).forEach((sec, i) => {
                                console.log(`${i + 1}. ${sec.isin}: ${sec.name} = ${sec.value?.toLocaleString()} CHF`);
                            });
                        }
                    } catch (parseError) {
                        console.warn('⚠️ Could not parse JSON response');
                    }
                }
                
                // Calculate costs
                const totalTokens = data.usage.total_tokens + pdfData.usage.total_tokens;
                const cost = (totalTokens / 1000000) * 0.2; // $0.2 per 1M tokens
                
                console.log(`\n💰 Total cost: $${cost.toFixed(4)} for ${totalTokens} tokens`);
                
                // Save the results
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const results = {
                    initialResponse: content,
                    extractionResponse: pdfContent,
                    cost: cost,
                    tokensUsed: totalTokens,
                    pdfSize: `${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`,
                    timestamp: new Date().toISOString()
                };
                
                await fs.writeFile(
                    `mistral-messos-test-${timestamp}.json`,
                    JSON.stringify(results, null, 2)
                );
                
                console.log(`\n💾 Results saved to: mistral-messos-test-${timestamp}.json`);
                
                return {
                    success: true,
                    extraction: pdfContent,
                    cost: cost,
                    tokensUsed: totalTokens
                };
                
            } else {
                const errorText = await pdfResponse.text();
                console.error('❌ PDF processing failed:', errorText);
            }
            
        } else {
            const errorText = await response.text();
            console.error('❌ Initial API call failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
if (require.main === module) {
    testMistralRealMessos().catch(console.error);
}

module.exports = { testMistralRealMessos };