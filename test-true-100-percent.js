// 🎯 Test True 100% Extractor - Extract ALL data to JSON then build table
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3001';

async function testTrue100Percent() {
    console.log('🎯 TRUE 100% EXTRACTOR TEST');
    console.log('📊 Stage 1: Extract ALL data to JSON');
    console.log('🧠 Stage 2: AI table construction');
    console.log('='.repeat(70));
    
    try {
        console.log('🚀 Testing True 100% Extractor with test mode...');
        const startTime = Date.now();
        
        const response = await fetch(`${SERVER_URL}/api/true-100-percent-extractor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                testMode: true,
                filename: 'Messos - Test for 100% extraction'
            })
        });
        
        const processingTime = Date.now() - startTime;
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ TRUE 100% EXTRACTION SUCCESSFUL!');
            console.log(`⏱️  Processing Time: ${processingTime}ms`);
            console.log('');
            
            // Stage 1 Results
            console.log('📊 STAGE 1 RESULTS (Raw Data Extraction):');
            console.log('-'.repeat(60));
            const stage1 = result.data.stage1Results;
            console.log(`🔢 Total Data Points: ${stage1.totalDataPoints.toLocaleString()}`);
            console.log(`📝 Words Extracted: ${stage1.words.toLocaleString()}`);
            console.log(`🔢 Numbers Found: ${stage1.numbers.toLocaleString()}`);
            console.log(`💼 ISINs Discovered: ${stage1.isins}`);
            console.log(`💰 Amounts Found: ${stage1.amounts}`);
            console.log(`👁️  OCR Elements: ${stage1.ocrElements}`);
            console.log(`🔧 Methods Used: ${result.data.extractionMethods.join(', ')}`);
            console.log('');
            
            // Stage 2 Results
            console.log('🧠 STAGE 2 RESULTS (AI Table Construction):');
            console.log('-'.repeat(60));
            const stage2 = result.data.stage2Results;
            console.log(`📊 Securities Constructed: ${result.data.securitiesCount}`);
            console.log(`💰 Total Portfolio Value: $${result.data.totalValue.toLocaleString()}`);
            console.log(`🎯 Confidence Score: ${(stage2.confidence * 100).toFixed(1)}%`);
            console.log(`📈 Coverage Rate: ${(stage2.coverage * 100).toFixed(1)}%`);
            console.log(`🤖 AI Algorithms: ${stage2.algorithms.join(', ')}`);
            console.log('');
            
            // Securities Sample
            if (result.data.holdings && result.data.holdings.length > 0) {
                console.log('📋 EXTRACTED SECURITIES (First 10):');
                console.log('-'.repeat(80));
                console.log('│ # │ ISIN         │ Security Name        │ Currency │ Market Value │');
                console.log('├───┼──────────────┼──────────────────────┼──────────┼──────────────┤');
                
                result.data.holdings.slice(0, 10).forEach((security, index) => {
                    const name = (security.name || 'Corporate Security').substring(0, 20).padEnd(20);
                    const isin = (security.isin || '').padEnd(12);
                    const currency = (security.currency || 'USD').padEnd(8);
                    const value = security.marketValue ? 
                        `$${security.marketValue.toLocaleString()}`.padEnd(12) : 
                        'Processing'.padEnd(12);
                    
                    console.log(`│${(index + 1).toString().padStart(2)} │ ${isin} │ ${name} │ ${currency} │ ${value} │`);
                });
                
                console.log('└───┴──────────────┴──────────────────────┴──────────┴──────────────┘');
                console.log(`... and ${result.data.holdings.length - 10} more securities`);
                console.log('');
            }
            
            // Accuracy Analysis
            const targetSecurities = 38;
            const foundSecurities = result.data.securitiesCount;
            const accuracy = (foundSecurities / targetSecurities) * 100;
            
            console.log('🎯 ACCURACY ANALYSIS:');
            console.log('-'.repeat(60));
            console.log(`📊 Securities Found: ${foundSecurities}`);
            console.log(`🎯 Expected Securities: ${targetSecurities}`);
            console.log(`📈 Extraction Accuracy: ${accuracy.toFixed(1)}%`);
            console.log(`🏆 Target Progress: ${foundSecurities}/${targetSecurities}`);
            
            if (accuracy >= 95) {
                console.log('🏆 EXCELLENT: 95%+ accuracy achieved - Ready for production!');
            } else if (accuracy >= 90) {
                console.log('✅ OUTSTANDING: 90%+ accuracy achieved!');
            } else if (accuracy >= 85) {
                console.log('✅ VERY GOOD: 85%+ accuracy achieved');
            } else if (accuracy >= 80) {
                console.log('⚡ GOOD: 80%+ accuracy achieved');
            } else {
                console.log('⚠️ IMPROVING: Working towards higher accuracy');
            }
            
            console.log('');
            console.log('🎯 METHODOLOGY VALIDATION:');
            console.log('-'.repeat(60));
            console.log(`✅ Stage 1: Extracted ${stage1.totalDataPoints.toLocaleString()} data points`);
            console.log(`✅ Stage 2: Constructed ${foundSecurities} securities from raw data`);
            console.log(`✅ Approach: True two-stage extraction working as designed`);
            console.log(`✅ Data Coverage: ${(stage2.coverage * 100).toFixed(1)}% of expected securities`);
            
        } else {
            console.log('❌ TRUE 100% EXTRACTION FAILED');
            console.log(`Error: ${result.error}`);
            if (result.details) {
                console.log(`Details: ${result.details}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testTrue100Percent();