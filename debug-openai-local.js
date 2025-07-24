// Debug OpenAI locally
const fs = require('fs');
const { OpenAIGPT4Processor } = require('./openai-gpt4-processor.js');

// Set the API key locally for testing
// process.env.OPENAI_API_KEY = 'your-api-key-here'; // Set this manually for local testing

async function testOpenAILocally() {
    console.log('🧪 DEBUGGING OPENAI LOCALLY');
    console.log('===========================');
    
    try {
        const processor = new OpenAIGPT4Processor();
        
        // Test connection first
        console.log('1️⃣ Testing connection...');
        const connectionTest = await processor.testConnection();
        console.log('Connection result:', connectionTest);
        
        if (!connectionTest.success) {
            console.log('❌ Connection failed, cannot proceed');
            return;
        }
        
        // Test with sample text (similar to what we'd extract from Messos PDF)
        console.log('\n2️⃣ Testing with sample financial text...');
        const sampleText = `
        MESSOS ENTERPRISES LTD.
        Valuation as of 31.03.2025
        Portfolio Total: 19'464'431 USD
        
        ISIN: XS2105981117 // Valorn.: 114118068
        GOLDMAN SACHS GR.STRUCT.NOTE 21-20.12.28 VRN ON NAT
        Market Value: USD 484'457
        
        ISIN: XS2746319610 // Valorn.: 133393503  
        SOCIETE GENERALE 32.46 % NOTES 2024-01.03.30 REG S
        Market Value: USD 192'100
        
        ISIN: XS2993414619 // Valorn.: 140610687
        RBC LONDON 0% NOTES 2025-28.03.2035
        Market Value: USD 97'700
        
        Total Bonds: 12'363'974 USD
        Total Structured products: 6'946'239 USD
        `;
        
        console.log(`📝 Sample text length: ${sampleText.length} characters`);
        
        const result = await processor.extractSecurities(sampleText, 19464431);
        
        console.log('\n📊 OPENAI RESULTS:');
        console.log('==================');
        console.log('✅ Success:', result.success);
        console.log('📊 Securities found:', result.securitiesFound);
        console.log('💰 Total extracted: $' + result.totalValue.toLocaleString());
        console.log('🎯 Accuracy:', result.accuracy + '%');
        console.log('⏱️ Processing time:', result.metadata.processingTime + 'ms');
        
        if (result.securities && result.securities.length > 0) {
            console.log('\n🔝 EXTRACTED SECURITIES:');
            result.securities.forEach((sec, i) => {
                console.log(`${i + 1}. ${sec.isin}: $${sec.marketValue.toLocaleString()}`);
                console.log(`   📛 ${sec.name || 'N/A'}`);
                console.log(`   🎯 Confidence: ${sec.confidence || 'N/A'}`);
            });
        }
        
        // Compare with expected
        const accuracy = parseFloat(result.accuracy);
        if (accuracy >= 95) {
            console.log('\n🎉 EXCELLENT! 95%+ accuracy achieved!');
        } else if (accuracy >= 90) {
            console.log('\n📈 VERY GOOD! 90%+ accuracy achieved');
        } else {
            console.log('\n⚠️ Accuracy needs improvement');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testOpenAILocally();