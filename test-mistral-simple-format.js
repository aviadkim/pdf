/**
 * Test Mistral OCR with the correct simple format
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testMistralSimpleFormat() {
    const apiKey = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
    
    try {
        console.log('🔑 Testing Mistral OCR with simple format...');
        
        // Read PDF and convert to base64
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        const pdfBuffer = await fs.promises.readFile(pdfPath);
        const base64Data = pdfBuffer.toString('base64');
        
        console.log(`📄 PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Use the correct Mistral OCR format - simple text message
        const payload = {
            model: 'mistral-ocr-latest',
            messages: [{
                role: 'user',
                content: `Please analyze this PDF document and extract all text, especially focusing on financial data like ISINs and market values:

[PDF Content in base64: ${base64Data.substring(0, 100)}...]

Please extract:
1. All ISIN codes (format: 2 letters + 10 characters)
2. Associated security names
3. Market values in CHF
4. Any portfolio totals

Return as structured text with clear formatting.`
            }],
            max_tokens: 4000
        };
        
        console.log('📤 Making API request to Mistral...');
        
        const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log(`📥 Response status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Success! Mistral API responded correctly');
            
            const content = data.choices?.[0]?.message?.content;
            console.log(`📊 Response length: ${content?.length || 0} characters`);
            
            if (content) {
                console.log('\n📄 Extracted text (first 1000 characters):');
                console.log('=' .repeat(50));
                console.log(content.substring(0, 1000));
                if (content.length > 1000) {
                    console.log('\n[...content truncated...]');
                }
                console.log('=' .repeat(50));
                
                // Check for ISINs in the response
                const isins = content.match(/[A-Z]{2}[A-Z0-9]{10}/g) || [];
                console.log(`\n🔍 Found ${isins.length} potential ISINs: ${isins.slice(0, 5).join(', ')}${isins.length > 5 ? '...' : ''}`);
                
                // Save full response
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `mistral-ocr-working-${timestamp}.json`;
                await fs.promises.writeFile(filename, JSON.stringify({
                    success: true,
                    extractedText: content,
                    isinsFound: isins,
                    usage: data.usage,
                    timestamp: new Date().toISOString()
                }, null, 2));
                
                console.log(`\n💾 Results saved to: ${filename}`);
                
                return {
                    success: true,
                    content,
                    isinsFound: isins,
                    usage: data.usage
                };
            }
        } else {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            return { success: false, error: errorText };
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

if (require.main === module) {
    testMistralSimpleFormat().catch(console.error);
}

module.exports = { testMistralSimpleFormat };