/**
 * TEST HYBRID ACCURACY SYSTEM
 * Test the complete hybrid processing pipeline
 */

const HybridAccuracySystem = require('./hybrid-accuracy-system.js');
const fs = require('fs').promises;

async function testHybridSystem() {
    console.log('🚀 TESTING HYBRID ACCURACY SYSTEM');
    console.log('=================================\n');
    
    const hybridSystem = new HybridAccuracySystem();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    try {
        // Load the PDF
        const pdfBuffer = await fs.readFile(pdfPath);
        console.log(`📄 Processing: ${pdfPath} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        
        // Run hybrid processing
        const results = await hybridSystem.processDocument(pdfBuffer, pdfPath);
        
        console.log('\n' + '='.repeat(60));
        console.log('📋 FINAL HYBRID SYSTEM RESULTS');
        console.log('='.repeat(60));
        
        if (results.error) {
            console.log('❌ Processing failed:', results.error);
            return;
        }
        
        // Show strategy comparison
        console.log('\n📊 STRATEGY COMPARISON:');
        console.log('=======================');
        console.log('Strategy               | Securities | Confidence | Cost    | Time');
        console.log('-----------------------|------------|------------|---------|--------');
        
        results.strategies.forEach(strategy => {
            const name = strategy.strategy.padEnd(20);
            const securities = (strategy.securities?.length || 0).toString().padStart(8);
            const confidence = strategy.error ? 'ERROR'.padStart(8) : `${strategy.confidence || 0}%`.padStart(8);
            const cost = `$${(strategy.cost || 0).toFixed(3)}`.padStart(7);
            const time = `${(strategy.processingTime/1000).toFixed(1)}s`.padStart(6);
            
            console.log(`${name} | ${securities} | ${confidence} | ${cost} | ${time}`);
        });
        
        // Show final decision
        console.log('\n🎯 FINAL DECISION:');
        console.log('==================');
        console.log(`Securities Extracted: ${results.finalResult.securities?.length || 0}`);
        console.log(`Total Portfolio Value: $${results.finalResult.totalValue?.toLocaleString() || '0'}`);
        console.log(`Overall Confidence: ${results.finalResult.overallConfidence || 0}%`);
        console.log(`Requires Human Review: ${results.requiresHumanReview ? 'YES' : 'NO'}`);
        console.log(`Total Processing Time: ${(results.processingTime/1000).toFixed(1)}s`);
        console.log(`Total Cost: $${results.costBreakdown.totalCost.toFixed(3)}`);
        
        // Show quality breakdown
        if (results.finalResult.qualityMetrics) {
            console.log('\n📈 QUALITY METRICS:');
            console.log('===================');
            const metrics = results.finalResult.qualityMetrics;
            console.log(`Name Quality: ${metrics.nameQuality}%`);
            console.log(`Value Quality: ${metrics.valueQuality}%`);
            console.log(`ISIN Quality: ${metrics.isinQuality}%`);
        }
        
        // Show sample extractions
        if (results.finalResult.securities && results.finalResult.securities.length > 0) {
            console.log('\n🔍 SAMPLE EXTRACTIONS (First 10):');
            console.log('=================================');
            console.log('ISIN           | Security Name                        | Value (USD)   | Conf');
            console.log('---------------|--------------------------------------|---------------|-----');
            
            results.finalResult.securities.slice(0, 10).forEach(security => {
                const isin = security.isin.padEnd(13);
                const name = (security.name || 'Unknown').substring(0, 36).padEnd(36);
                const value = `$${(security.marketValue || 0).toLocaleString()}`.padStart(13);
                const conf = `${security.confidence || 0}%`.padStart(4);
                
                console.log(`${isin} | ${name} | ${value} | ${conf}`);
            });
        }
        
        // Cost optimization analysis
        console.log('\n💰 COST OPTIMIZATION ANALYSIS:');
        console.log('==============================');
        console.log(`Current Cost: $${results.costBreakdown.totalCost.toFixed(3)}/document`);
        console.log(`Target Cost: $0.150/document`);
        
        const costReduction = results.costBreakdown.totalCost - 0.150;
        if (costReduction > 0) {
            console.log(`⚠️  Need to reduce cost by: $${costReduction.toFixed(3)} per document`);
            console.log(`💡 Optimization suggestions:`);
            
            if (results.strategies.find(s => s.strategy === 'slow-mistral-large' && s.cost > 0.10)) {
                console.log(`   • Switch from Mistral Large to Mistral Medium (-$${(results.strategies.find(s => s.strategy === 'slow-mistral-large')?.cost - 0.05).toFixed(3)})`);
            }
            
            if (results.requiresHumanReview) {
                console.log(`   • Improve auto-approval rate to reduce human review (-$2.00)`);
                console.log(`   • Target: 90% auto-approval vs current ${100 - (results.requiresHumanReview ? 100 : 0)}%`);
            }
            
            console.log(`   • Implement caching for repeat document patterns (-$0.02)`);
            console.log(`   • Use hybrid fast/slow processing based on confidence (-$0.05)`);
        } else {
            console.log(`✅ Cost target achieved! Under $0.15/document`);
        }
        
        // Business viability assessment
        console.log('\n📊 BUSINESS VIABILITY:');
        console.log('======================');
        const monthlyVolumes = [100, 500, 1000, 5000];
        console.log('Volume  | Monthly Cost | Revenue (3x) | Profit   | Margin');
        console.log('--------|--------------|--------------|----------|-------');
        
        monthlyVolumes.forEach(volume => {
            const cost = volume * results.costBreakdown.totalCost;
            const revenue = volume * results.costBreakdown.totalCost * 3;
            const profit = revenue - cost;
            const margin = ((profit / revenue) * 100).toFixed(0);
            
            console.log(`${volume.toString().padStart(6)} | $${cost.toFixed(0).padStart(10)} | $${revenue.toFixed(0).padStart(10)} | $${profit.toFixed(0).padStart(7)} | ${margin.padStart(5)}%`);
        });
        
        // Save complete results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.writeFile(
            `hybrid-system-results-${timestamp}.json`,
            JSON.stringify(results, null, 2)
        );
        
        console.log(`\n💾 Complete results saved to: hybrid-system-results-${timestamp}.json`);
        
        // Recommendation
        console.log('\n🎯 RECOMMENDATION:');
        console.log('==================');
        if (results.finalResult.overallConfidence >= 85) {
            console.log('✅ SYSTEM READY FOR PRODUCTION');
            console.log(`   Confidence: ${results.finalResult.overallConfidence}% (Target: 85%+)`);
            console.log(`   Cost: $${results.costBreakdown.totalCost.toFixed(3)} (Target: <$0.50)`);
        } else if (results.finalResult.overallConfidence >= 70) {
            console.log('⚠️ SYSTEM NEEDS OPTIMIZATION');
            console.log(`   Confidence: ${results.finalResult.overallConfidence}% (Need: 85%+)`);
            console.log('   Recommend: Improve Mistral prompts and add more validation');
        } else {
            console.log('❌ SYSTEM NEEDS MAJOR IMPROVEMENTS');
            console.log(`   Confidence: ${results.finalResult.overallConfidence}% (Need: 85%+)`);
            console.log('   Recommend: Consider different AI models or approach');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testHybridSystem();