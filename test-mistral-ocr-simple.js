/**
 * SIMPLE MISTRAL OCR TEST
 * Basic test to verify Mistral OCR integration works
 */

const { MistralOCRRealAPI } = require('./mistral-ocr-real-api');
const fs = require('fs');

async function testMistralOCRSimple() {
    console.log('🧪 SIMPLE MISTRAL OCR TEST');
    console.log('==========================\\n');
    
    try {
        // Test 1: Configuration
        console.log('📋 Test 1: Configuration');
        console.log('========================');
        
        const mistralOCR = new MistralOCRRealAPI({
            debugMode: true
        });
        
        console.log('✅ MistralOCR initialized successfully');
        console.log(`🔐 API Key configured: ${mistralOCR.apiKey ? 'YES' : 'NO'}`);
        console.log(`🎯 Model: ${mistralOCR.model}`);
        console.log(`🌐 Endpoint: ${mistralOCR.endpoint}`);
        
        // Test 2: File existence
        console.log('\\n📋 Test 2: File Existence');
        console.log('==========================');
        
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        const pdfExists = fs.existsSync(pdfPath);
        
        console.log(`📄 PDF file exists: ${pdfExists ? 'YES' : 'NO'}`);
        
        if (!pdfExists) {
            console.log('⚠️  Test PDF file not found. Skipping processing test.');
            return;
        }
        
        // Test 3: Rate limiting
        console.log('\\n📋 Test 3: Rate Limiting');
        console.log('=========================');
        
        try {
            await mistralOCR.checkRateLimit();
            console.log('✅ Rate limit check passed');
        } catch (error) {
            console.log('❌ Rate limit check failed:', error.message);
        }
        
        // Test 4: Input preparation
        console.log('\\n📋 Test 4: Input Preparation');
        console.log('=============================');
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        console.log(`📦 PDF buffer size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        const preparedInput = await mistralOCR.prepareInputForAPI(pdfBuffer, 'buffer');
        console.log('✅ Input prepared successfully');
        console.log(`🎯 Model: ${preparedInput.model}`);
        console.log(`📝 Messages: ${preparedInput.messages.length}`);
        
        // Test 5: ISIN validation
        console.log('\\n📋 Test 5: ISIN Validation');
        console.log('===========================');
        
        const testISINs = [
            'XS2993414619', // Valid
            'XS2530201644', // Valid
            'INVALID123',   // Invalid
            'AB1234567890'  // Valid format
        ];
        
        testISINs.forEach(isin => {
            const isValid = mistralOCR.validateISIN(isin);
            console.log(`📊 ${isin}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        });
        
        // Test 6: Swiss number parsing
        console.log('\\n📋 Test 6: Swiss Number Parsing');
        console.log('=================================');
        
        const testNumbers = [
            "1'234'567",
            "366'223",
            "19'464'431",
            "1.234.567",
            "1,234,567"
        ];
        
        testNumbers.forEach(num => {
            const parsed = mistralOCR.parseSwissNumber(num);
            console.log(`💰 ${num} → ${parsed.toLocaleString()}`);
        });
        
        // Test 7: Full processing (if API key is available)
        console.log('\\n📋 Test 7: Full Processing');
        console.log('===========================');
        
        if (mistralOCR.apiKey && mistralOCR.apiKey !== 'undefined') {
            console.log('🔮 Attempting full Mistral OCR processing...');
            
            try {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                console.log('✅ Processing completed successfully');
                console.log(`📊 Securities found: ${result.securities.length}`);
                console.log(`💰 Total value: ${result.summary.totalValue.toLocaleString()}`);
                console.log(`🎯 Accuracy: ${result.summary.accuracy.toFixed(2)}%`);
                console.log(`🔮 Confidence: ${result.summary.averageConfidence.toFixed(1)}%`);
                console.log(`💵 Estimated cost: $${result.metadata.estimatedCost}`);
                
                // Save results
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const resultsFile = `mistral_ocr_test_results_${timestamp}.json`;
                fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
                console.log(`💾 Results saved to: ${resultsFile}`);
                
            } catch (error) {
                console.log('❌ Full processing failed:', error.message);
                console.log('🔍 Error details:', error.stack?.split('\\n')[0] || 'No stack trace');
            }
        } else {
            console.log('⚠️  No API key configured. Skipping full processing test.');
            console.log('💡 Set MISTRAL_API_KEY environment variable to test full processing.');
        }
        
        // Test 8: Fallback processing
        console.log('\\n📋 Test 8: Fallback Processing');
        console.log('===============================');
        
        try {
            const fallbackResult = await mistralOCR.fallbackProcessing(pdfBuffer, 'buffer');
            console.log('✅ Fallback processing completed');
            console.log(`📊 Fallback securities: ${fallbackResult.securities.length}`);
            console.log(`💰 Fallback total: ${fallbackResult.summary.totalValue.toLocaleString()}`);
            console.log(`🎯 Fallback accuracy: ${fallbackResult.summary.accuracy.toFixed(2)}%`);
        } catch (error) {
            console.log('❌ Fallback processing failed:', error.message);
        }
        
        console.log('\\n🎉 SIMPLE MISTRAL OCR TEST COMPLETE');
        console.log('====================================');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('🔍 Error details:', error.stack);
    }
}

// Run the test
if (require.main === module) {
    testMistralOCRSimple().catch(console.error);
}

module.exports = { testMistralOCRSimple };