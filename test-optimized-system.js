/**
 * TEST OPTIMIZED PRODUCTION SYSTEM
 * Test the cost-optimized system targeting $0.15/doc with 95%+ accuracy
 */

const OptimizedProductionSystem = require('./optimized-production-system.js');
const fs = require('fs').promises;

async function testOptimizedSystem() {
    console.log('🎯 TESTING OPTIMIZED PRODUCTION SYSTEM');
    console.log('=====================================\n');
    
    const system = new OptimizedProductionSystem();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    try {
        // Load the PDF
        const pdfBuffer = await fs.readFile(pdfPath);
        console.log(`📄 Processing: ${pdfPath} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
        
        // Run optimized processing
        const result = await system.processDocument(pdfBuffer, pdfPath);
        
        console.log('\n' + '='.repeat(70));
        console.log('🎯 OPTIMIZED SYSTEM FINAL RESULTS');
        console.log('='.repeat(70));
        
        if (result.error) {
            console.log('❌ Processing failed:', result.error);
            return;
        }
        
        // Show processing steps
        console.log('\n📋 PROCESSING STEPS:');
        console.log('====================');
        result.processingSteps.forEach((step, index) => {
            console.log(`${index + 1}. ${step.method}:`);
            console.log(`   Securities: ${step.securities?.length || 0}`);
            console.log(`   Value: $${step.totalValue?.toLocaleString() || '0'}`);
            console.log(`   Time: ${(step.processingTime/1000).toFixed(1)}s`);
            if (step.error) console.log(`   Error: ${step.error}`);
        });
        
        // Show final metrics
        console.log('\n📊 FINAL METRICS:');
        console.log('=================');
        console.log(`Securities Extracted: ${result.finalResult.securities?.length || 0}`);
        console.log(`Total Portfolio Value: $${result.finalResult.totalValue?.toLocaleString() || '0'}`);
        console.log(`Processing Time: ${(result.processingTime/1000).toFixed(1)}s`);
        console.log(`Total Cost: $${result.costs.total.toFixed(3)}`);
        console.log(`Human Review Required: ${result.needsHumanReview ? 'YES' : 'NO'}`);
        
        // Cost breakdown
        console.log('\n💰 COST BREAKDOWN:');
        console.log('==================');
        Object.entries(result.costs.breakdown).forEach(([item, cost]) => {
            console.log(`${item.padEnd(20)}: $${cost.toFixed(3)}`);
        });
        console.log(`${'TOTAL'.padEnd(20)}: $${result.costs.total.toFixed(3)}`);
        
        // Target comparison
        const targetCost = 0.15;
        console.log(`\n🎯 TARGET COMPARISON:`);
        console.log(`Target Cost: $${targetCost.toFixed(3)}`);
        console.log(`Actual Cost: $${result.costs.total.toFixed(3)}`);
        
        if (result.costs.total <= targetCost) {
            console.log(`✅ COST TARGET ACHIEVED! Saved $${(targetCost - result.costs.total).toFixed(3)}`);
        } else {
            console.log(`❌ Over budget by: $${(result.costs.total - targetCost).toFixed(3)}`);
        }
        
        // Quality assessment
        if (result.finalResult.portfolioValidation) {
            console.log(`\n📈 QUALITY ASSESSMENT:`);
            console.log(`Document Total: $${result.finalResult.portfolioValidation.documentTotal?.toLocaleString() || 'Unknown'}`);
            console.log(`Extracted Total: $${result.finalResult.portfolioValidation.extractedTotal?.toLocaleString() || 'Unknown'}`);
            console.log(`Accuracy: ${result.finalResult.portfolioValidation.accuracy || 'Unknown'}%`);
        }
        
        // Show sample extractions
        if (result.finalResult.securities && result.finalResult.securities.length > 0) {
            console.log('\n🔍 SAMPLE EXTRACTIONS (Top 15 by confidence):');
            console.log('============================================');
            console.log('ISIN           | Security Name                        | Value (USD)   | Conf | Enhanced');
            console.log('---------------|--------------------------------------|---------------|------|---------');
            
            const topSecurities = result.finalResult.securities
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                .slice(0, 15);
                
            topSecurities.forEach(security => {
                const isin = security.isin.padEnd(13);
                const name = (security.name || 'Unknown').substring(0, 36).padEnd(36);
                const value = `$${(security.marketValue || 0).toLocaleString()}`.padStart(13);
                const conf = `${security.confidence || 0}%`.padStart(4);
                const enhanced = security.enhanced ? '✅' : '  ';
                
                console.log(`${isin} | ${name} | ${value} | ${conf} | ${enhanced.padEnd(7)}`);
            });
        }
        
        // Business viability analysis
        console.log('\n💼 BUSINESS VIABILITY ANALYSIS:');
        console.log('===============================');
        const actualCost = result.costs.total;
        const suggestedPrice = actualCost * 3; // 3x markup
        
        console.log(`Suggested price per document: $${suggestedPrice.toFixed(3)} (3x markup)`);
        console.log(`Profit margin: ${(((suggestedPrice - actualCost) / suggestedPrice) * 100).toFixed(0)}%`);
        
        console.log('\nMonthly projections:');
        console.log('Volume | Cost     | Revenue  | Profit   | Annual');
        console.log('-------|----------|----------|----------|----------');
        [100, 500, 1000, 5000, 10000].forEach(volume => {
            const monthlyCost = volume * actualCost;
            const monthlyRevenue = volume * suggestedPrice;
            const monthlyProfit = monthlyRevenue - monthlyCost;
            const annualProfit = monthlyProfit * 12;
            
            console.log(`${volume.toString().padStart(6)} | $${monthlyCost.toFixed(0).padStart(7)} | $${monthlyRevenue.toFixed(0).padStart(7)} | $${monthlyProfit.toFixed(0).padStart(7)} | $${(annualProfit/1000).toFixed(0).padStart(6)}K`);
        });
        
        // Production readiness assessment
        console.log('\n🚀 PRODUCTION READINESS:');
        console.log('========================');
        
        const qualityScore = assessOverallQuality(result);
        const costScore = result.costs.total <= 0.20 ? 100 : Math.max(0, (0.30 - result.costs.total) / 0.10 * 100);
        const speedScore = result.processingTime <= 10000 ? 100 : Math.max(0, (60000 - result.processingTime) / 50000 * 100);
        
        console.log(`Quality Score: ${qualityScore}/100`);
        console.log(`Cost Score: ${costScore.toFixed(0)}/100`);
        console.log(`Speed Score: ${speedScore.toFixed(0)}/100`);
        
        const overallScore = (qualityScore + costScore + speedScore) / 3;
        console.log(`Overall Score: ${overallScore.toFixed(0)}/100`);
        
        if (overallScore >= 80) {
            console.log('✅ PRODUCTION READY - System meets all requirements');
        } else if (overallScore >= 60) {
            console.log('⚠️ NEAR PRODUCTION READY - Minor optimizations needed');
        } else {
            console.log('❌ NOT PRODUCTION READY - Significant improvements required');
        }
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.writeFile(
            `optimized-system-results-${timestamp}.json`,
            JSON.stringify(result, null, 2)
        );
        
        console.log(`\n💾 Complete results saved to: optimized-system-results-${timestamp}.json`);
        
        // Final recommendation
        console.log('\n🎯 FINAL RECOMMENDATION:');
        console.log('========================');
        
        if (result.costs.total <= 0.15 && qualityScore >= 80) {
            console.log('🎉 EXCELLENT! System ready for immediate production deployment');
            console.log('   • Cost target achieved');
            console.log('   • Quality is production-grade');
            console.log('   • Scalable architecture in place');
        } else if (result.costs.total <= 0.25 && qualityScore >= 70) {
            console.log('✅ GOOD! System viable with minor optimizations');
            console.log(`   • Cost: $${result.costs.total.toFixed(3)} (target: $0.15)`);
            console.log(`   • Quality: ${qualityScore}/100 (target: 80+)`);
            console.log('   • Recommend: Fine-tune processing pipeline');
        } else {
            console.log('⚠️ NEEDS WORK! System requires further development');
            console.log('   • Focus on cost optimization and quality improvements');
            console.log('   • Consider alternative AI models or processing approaches');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

function assessOverallQuality(result) {
    if (!result.finalResult || !result.finalResult.securities) return 0;
    
    const securities = result.finalResult.securities;
    let score = 0;
    
    // Quantity (30 points)
    if (securities.length >= 35) score += 30;
    else if (securities.length >= 25) score += 20;
    else if (securities.length >= 15) score += 10;
    
    // Average confidence (40 points)
    const avgConfidence = securities.reduce((sum, s) => sum + (s.confidence || 0), 0) / securities.length;
    score += Math.round(avgConfidence * 0.4);
    
    // Portfolio validation (30 points)
    if (result.finalResult.portfolioValidation) {
        const accuracy = parseFloat(result.finalResult.portfolioValidation.accuracy);
        score += Math.round(accuracy * 0.3);
    }
    
    return Math.min(score, 100);
}

testOptimizedSystem();