/**
 * Test Mistral OCR with provided API key
 */

const { MistralOCR } = require('./mistral-ocr-processor.js');
const fs = require('fs');
const path = require('path');

async function testMistralWithKey() {
    console.log('🔑 Testing Mistral OCR with API key...');
    
    // Initialize with API key
    const mistralOCR = new MistralOCR({
        apiKey: 'bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR',
        debugMode: true,
        fallbackEnabled: true
    });
    
    const pdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    
    try {
        console.log('📄 Processing Messos PDF...');
        const result = await mistralOCR.processFromFile(pdfPath);
        
        console.log('\n🎉 MISTRAL OCR TEST COMPLETE!');
        console.log('================================');
        console.log(`🎯 Accuracy: ${result.summary.accuracy.toFixed(2)}%`);
        console.log(`📊 Securities: ${result.summary.totalSecurities}`);
        console.log(`💰 Total: $${result.summary.totalValue.toLocaleString()}`);
        console.log(`🔮 Method: ${result.method}`);
        console.log(`✅ Legitimate: ${result.metadata.legitimate}`);
        
        // Save results with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `mistral-test-with-key-${timestamp}.json`;
        await fs.promises.writeFile(resultsFile, JSON.stringify(result, null, 2));
        console.log(`\n💾 Results saved to: ${resultsFile}`);
        
        // Show first few securities if any
        if (result.securities && result.securities.length > 0) {
            console.log('\n📋 First 5 securities extracted:');
            result.securities.slice(0, 5).forEach((sec, i) => {
                console.log(`${i + 1}. ${sec.isin}: ${sec.name} = $${sec.value.toLocaleString()}`);
            });
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Mistral OCR test failed:', error.message);
        console.error('Stack:', error.stack);
        
        // Test if the API key is working by making a simple test call
        console.log('\n🔍 Testing API key with simple call...');
        try {
            const fetch = require('node-fetch');
            const response = await fetch('https://api.mistral.ai/v1/models', {
                headers: {
                    'Authorization': `Bearer bj7fEe8rHhtwh9Zeij1gh9LuqYrx3YXR`
                }
            });
            
            console.log(`API Response Status: ${response.status}`);
            const data = await response.text();
            console.log('API Response:', data.substring(0, 200) + '...');
            
        } catch (apiError) {
            console.error('❌ API key test failed:', apiError.message);
        }
        
        return null;
    }
}

if (require.main === module) {
    testMistralWithKey().catch(console.error);
}

module.exports = { testMistralWithKey };