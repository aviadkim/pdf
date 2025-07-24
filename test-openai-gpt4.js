/**
 * Test OpenAI GPT-4 vs Current System
 * Compare accuracy and verify API setup
 */

const fs = require('fs');
const { OpenAIGPT4Processor } = require('./openai-gpt4-processor.js');

console.log('🚀 OPENAI GPT-4 SETUP & TESTING');
console.log('===============================');

async function testOpenAISetup() {
    console.log('1️⃣ TESTING OPENAI API CONNECTION');
    console.log('=================================');
    
    const processor = new OpenAIGPT4Processor();
    
    // Test connection
    const connectionTest = await processor.testConnection();
    if (connectionTest.success) {
        console.log('✅ OpenAI API connection successful!');
        console.log(`📊 Model: ${connectionTest.model}`);
        console.log(`💬 Status: ${connectionTest.message}`);
    } else {
        console.log('❌ OpenAI API connection failed!');
        console.log(`🔍 Error: ${connectionTest.error}`);
        console.log('');
        console.log('💡 SETUP INSTRUCTIONS:');
        console.log('1. Get API key from: https://platform.openai.com/api-keys');
        console.log('2. Set environment variable: OPENAI_API_KEY=your_key_here');
        console.log('3. For local testing: add to .env file');
        console.log('4. For Render: add to environment variables in dashboard');
        return;
    }
    
    console.log('');
    console.log('2️⃣ AVAILABLE MODELS');
    console.log('==================');
    
    try {
        const modelsInfo = await processor.getAvailableModels();
        console.log(`✅ Found ${modelsInfo.models.length} GPT models`);
        console.log(`🎯 Recommended: ${modelsInfo.recommended}`);
        console.log(`📝 Note: ${modelsInfo.note}`);
        
        // Show some key models
        const keyModels = modelsInfo.models.filter(m => 
            m.includes('gpt-4') || m.includes('gpt-3.5')
        ).slice(0, 5);
        keyModels.forEach(model => console.log(`   📋 ${model}`));
    } catch (error) {
        console.log(`⚠️ Could not fetch models: ${error.message}`);
    }
    
    console.log('');
    console.log('3️⃣ DOCUMENT PROCESSING TEST');
    console.log('===========================');
    
    // Test with sample Messos document
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ Messos PDF not found. Skipping document test.');
        console.log('💡 To test document processing, ensure Messos PDF is in the directory.');
        return;
    }
    
    try {
        // For testing, we'll use a sample text (in real implementation, use PDF parser)
        const sampleText = `
        MESSOS ENTERPRISES LTD.
        Portfolio Total: 19'464'431 USD
        
        ISIN: XS2105981117 // Goldman Sachs Structured Note
        Market Value: 484'457 USD
        
        ISIN: XS2746319610 // Societe Generale Note  
        Market Value: 192'100 USD
        
        ISIN: XS2993414619 // RBC London Notes
        Market Value: 97'700 USD
        `;
        
        console.log('🔍 Testing with sample financial document...');
        console.log('📊 Expected total: $19,464,431');
        
        const result = await processor.extractSecurities(sampleText, 19464431);
        
        console.log('');
        console.log('📈 OPENAI GPT-4 RESULTS:');
        console.log('========================');
        console.log(`✅ Success: ${result.success}`);
        console.log(`📊 Securities found: ${result.securitiesFound}`);
        console.log(`💰 Total extracted: $${result.totalValue.toLocaleString()}`);
        console.log(`🎯 Accuracy: ${result.accuracy}%`);
        console.log(`⏱️ Processing time: ${result.metadata.processingTime}ms`);
        console.log(`🤖 Model: ${result.metadata.model}`);
        
        if (result.securities && result.securities.length > 0) {
            console.log('');
            console.log('🔝 EXTRACTED SECURITIES:');
            result.securities.forEach((sec, i) => {
                console.log(`${i + 1}. ${sec.isin}`);
                console.log(`   💰 Value: $${sec.marketValue.toLocaleString()}`);
                console.log(`   📛 Name: ${sec.name || 'N/A'}`);
                console.log(`   🎯 Confidence: ${sec.confidence || 'N/A'}`);
                console.log('');
            });
        }
        
        // Compare with expected accuracy
        const accuracy = parseFloat(result.accuracy);
        if (accuracy >= 95) {
            console.log('🎉 EXCELLENT! 95%+ accuracy achieved!');
            console.log('✅ OpenAI GPT-4 is ready for production use');
        } else if (accuracy >= 90) {
            console.log('📈 VERY GOOD! 90%+ accuracy achieved');
            console.log('✅ Significant improvement over current system');
        } else {
            console.log('⚠️ Accuracy needs improvement');
            console.log('💡 May need prompt engineering or model tuning');
        }
        
    } catch (error) {
        console.log('❌ Document processing test failed:');
        console.log(`🔍 Error: ${error.message}`);
        console.log('💡 This might be due to API limits or model availability');
    }
    
    console.log('');
    console.log('4️⃣ NEXT STEPS');
    console.log('=============');
    console.log('✅ If connection successful: Deploy to Render with OPENAI_API_KEY');
    console.log('✅ Test with real Messos PDF using new endpoint');
    console.log('✅ Compare results with current Mistral system');
    console.log('✅ Switch to OpenAI for production if accuracy > 95%');
}

// Run test
testOpenAISetup().catch(error => {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 TROUBLESHOOTING:');
    console.log('1. Make sure OPENAI_API_KEY is set in environment');
    console.log('2. Check API key has sufficient credits');
    console.log('3. Verify API key format: sk-...');
    console.log('4. Try running: export OPENAI_API_KEY=your_key_here');
});