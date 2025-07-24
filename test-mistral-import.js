#!/usr/bin/env node

console.log('🧪 Testing Mistral OCR Import');
console.log('=============================\n');

try {
    console.log('1. Testing MistralOCR import...');
    const { MistralOCR } = require('./mistral-ocr-processor.js');
    console.log('✅ MistralOCR imported successfully');
    
    console.log('2. Testing MistralOCR instantiation...');
    const mistralOCR = new MistralOCR({
        apiKey: 'test-key',
        debugMode: true
    });
    console.log('✅ MistralOCR instantiated successfully');
    
    console.log('3. Testing MistralOCR methods...');
    console.log('   Available methods:', Object.getOwnPropertyNames(MistralOCR.prototype));
    
    console.log('4. Testing environment variables...');
    console.log('   MISTRAL_API_KEY:', process.env.MISTRAL_API_KEY ? 'SET' : 'NOT SET');
    console.log('   MISTRAL_ENDPOINT:', process.env.MISTRAL_ENDPOINT || 'DEFAULT');
    
    console.log('\n✅ All tests passed - MistralOCR import is working correctly');
    
} catch (error) {
    console.log('❌ Import test failed:');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    
    if (error.code === 'MODULE_NOT_FOUND') {
        console.log('\n🔍 Module resolution issue detected');
        console.log('Check if mistral-ocr-processor.js exists and has correct exports');
    }
    
    if (error.message.includes('fetch') || error.message.includes('node-fetch')) {
        console.log('\n🔍 Possible missing dependency: node-fetch');
        console.log('Try: npm install node-fetch');
    }
}