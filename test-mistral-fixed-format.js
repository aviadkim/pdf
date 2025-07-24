/**
 * Test Mistral OCR with corrected API format
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testMistralOCRFixed() {
    const apiKey = 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR';
    
    try {
        console.log('🔑 Testing Mistral OCR with corrected format...');
        
        // Read the PDF file
        const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        const pdfBuffer = await fs.promises.readFile(pdfPath);
        const base64Data = pdfBuffer.toString('base64');
        
        console.log(`📄 PDF file size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        console.log(`📊 Base64 length: ${base64Data.length} characters`);
        
        // Try different API formats to see which one works
        const formats = [
            {
                name: 'Format 1: image_base64',
                payload: {
                    model: 'mistral-ocr-latest',
                    messages: [{
                        role: 'user',
                        content: [
                            {
                                type: 'image_base64',
                                image_base64: `data:application/pdf;base64,${base64Data}`
                            },
                            {
                                type: 'text',
                                text: 'Please extract all text from this financial document, paying special attention to ISINs and their market values. Return as structured text.'
                            }
                        ]
                    }],
                    max_tokens: 4000
                }
            },
            {
                name: 'Format 2: Simple text with base64',
                payload: {
                    model: 'mistral-ocr-latest',
                    messages: [{
                        role: 'user',
                        content: `Please perform OCR on this PDF document and extract all financial data, especially ISINs and market values:

data:application/pdf;base64,${base64Data.substring(0, 1000)}...

Focus on extracting:
1. ISINs (format: 2 letters + 10 alphanumeric characters)
2. Associated market values
3. Security names
4. Table structures`
                    }],
                    max_tokens: 4000
                }
            }
        ];
        
        for (const format of formats) {
            console.log(`\n🧪 Testing ${format.name}...`);
            
            try {
                const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(format.payload)
                });
                
                console.log(`Status: ${response.status}`);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Success!');
                    console.log(`Response length: ${data.choices?.[0]?.message?.content?.length || 0} characters`);
                    
                    if (data.choices?.[0]?.message?.content) {
                        const content = data.choices[0].message.content;
                        console.log('📄 First 500 characters of response:');
                        console.log(content.substring(0, 500) + '...');
                        
                        // Save the full response
                        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        const filename = `mistral-ocr-success-${timestamp}.json`;
                        await fs.promises.writeFile(filename, JSON.stringify({
                            format: format.name,
                            response: data,
                            extractedText: content
                        }, null, 2));
                        console.log(`💾 Full response saved to: ${filename}`);
                        
                        return { success: true, content, format: format.name };
                    }
                } else {
                    const errorText = await response.text();
                    console.log(`❌ Failed: ${errorText}`);
                }
                
            } catch (error) {
                console.log(`❌ Error: ${error.message}`);
            }
        }
        
        return { success: false };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

if (require.main === module) {
    testMistralOCRFixed().catch(console.error);
}

module.exports = { testMistralOCRFixed };