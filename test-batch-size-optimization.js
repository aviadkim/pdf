#!/usr/bin/env node

/**
 * TEST BATCH SIZE OPTIMIZATION
 * 
 * Tests different batch sizes (5, 8, 10 pages) with the Messos PDF
 * to find optimal balance between cost and quality
 */

const { BatchSizeOptimizationAnalyzer } = require('./batch-size-optimization-analyzer');
const path = require('path');

async function runBatchSizeOptimizationTest() {
    console.log('🚀 BATCH SIZE OPTIMIZATION TEST');
    console.log('===============================');
    console.log('Testing 5, 8, and 10 page batch sizes with Messos PDF');
    console.log('Goal: Find optimal balance between cost savings and quality');
    console.log('');

    const analyzer = new BatchSizeOptimizationAnalyzer();
    const messosPdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');

    try {
        const results = await analyzer.runBatchSizeOptimizationTest(messosPdfPath);

        if (results.success) {
            console.log('📊 BATCH SIZE OPTIMIZATION RESULTS');
            console.log('==================================');
            
            // Display results for each batch size
            for (const [batchSize, result] of Object.entries(results.results)) {
                if (result.success) {
                    console.log(`\n🔬 BATCH SIZE: ${batchSize} PAGES`);
                    console.log('─'.repeat(30));
                    console.log(`💰 Cost: $${result.estimatedCost.toFixed(2)}`);
                    console.log(`🔧 API Calls: ${result.totalBatches} batches`);
                    console.log(`📊 Securities Found: ${result.financialData?.securities?.length || 0}`);
                    console.log(`💵 Portfolio Value: $${result.financialData?.portfolio?.totalValue?.toLocaleString() || 'N/A'}`);
                    console.log(`⏱️  Processing Time: ${result.processingTime}ms`);
                    console.log(`⚠️  Risk Level: ${result.analysis.riskLevel}`);
                    
                    if (batchSize != 5) {
                        const savings = (results.results[5]?.estimatedCost || 0.20) - result.estimatedCost;
                        const savingsPercent = ((savings / (results.results[5]?.estimatedCost || 0.20)) * 100).toFixed(1);
                        console.log(`💚 Savings vs 5-page: $${savings.toFixed(2)} (${savingsPercent}%)`);
                    }
                }
            }

            // Display comparison analysis
            console.log('\n📈 DETAILED COMPARISON ANALYSIS');
            console.log('===============================');
            
            console.log('\n💰 COST ANALYSIS:');
            console.log('Batch Size | Cost    | API Calls | Savings vs 5-page');
            console.log('-----------|---------|-----------|------------------');
            
            for (const [batchSize, analysis] of Object.entries(results.comparison.costAnalysis)) {
                const savings = analysis.savingsVs5Pages;
                const savingsPercent = savings > 0 ? `(${((savings / (results.comparison.costAnalysis[5]?.estimatedCost || 0.20)) * 100).toFixed(1)}%)` : '';
                console.log(`${batchSize.padEnd(10)} | $${analysis.estimatedCost.toFixed(2).padEnd(6)} | ${analysis.totalBatches.toString().padEnd(9)} | $${savings.toFixed(2)} ${savingsPercent}`);
            }

            console.log('\n📊 QUALITY ANALYSIS:');
            console.log('Batch Size | Securities | Portfolio Value | Accuracy | Time');
            console.log('-----------|------------|-----------------|----------|------');
            
            for (const [batchSize, analysis] of Object.entries(results.comparison.qualityAnalysis)) {
                const portfolioValue = analysis.portfolioValue ? `$${(analysis.portfolioValue / 1000000).toFixed(1)}M` : 'N/A';
                console.log(`${batchSize.padEnd(10)} | ${analysis.securitiesFound.toString().padEnd(10)} | ${portfolioValue.padEnd(15)} | ${analysis.accuracyScore}%${' '.repeat(5)} | ${(analysis.processingTime / 1000).toFixed(1)}s`);
            }

            console.log('\n⚠️  RISK ANALYSIS:');
            console.log('Batch Size | Risk Level   | Securities/Page | Content Density');
            console.log('-----------|--------------|-----------------|----------------');
            
            for (const [batchSize, analysis] of Object.entries(results.comparison.riskAnalysis)) {
                console.log(`${batchSize.padEnd(10)} | ${analysis.riskLevel.padEnd(12)} | ${analysis.securitiesPerPage.padEnd(15)} | ${analysis.contentDensity}`);
            }

            // Display recommendation
            console.log('\n🎯 RECOMMENDATION');
            console.log('=================');
            console.log(`✅ Recommended Batch Size: ${results.recommendation.recommended} pages`);
            console.log(`🎯 Confidence Level: ${results.recommendation.confidence}`);
            
            if (results.recommendation.analysis) {
                const rec = results.recommendation.analysis;
                console.log(`💰 Cost Savings: $${rec.costSavings.toFixed(2)} per document`);
                console.log(`📊 Quality Score: ${rec.qualityScore}%`);
                console.log(`⚠️  Risk Level: ${rec.riskLevel}`);
                console.log(`🏆 Combined Score: ${rec.combinedScore.toFixed(1)}/100`);
            }

            // Generate business impact analysis
            console.log('\n💼 BUSINESS IMPACT ANALYSIS');
            console.log('===========================');
            
            const recommendedResult = results.results[results.recommendation.recommended];
            if (recommendedResult && recommendedResult.success) {
                const monthlySavings = {
                    10: (0.20 - recommendedResult.estimatedCost) * 10,
                    100: (0.20 - recommendedResult.estimatedCost) * 100,
                    1000: (0.20 - recommendedResult.estimatedCost) * 1000,
                    10000: (0.20 - recommendedResult.estimatedCost) * 10000
                };

                console.log('\nMonthly Savings with Recommended Batch Size:');
                console.log(`📊 10 documents/month: $${monthlySavings[10].toFixed(2)} saved`);
                console.log(`📊 100 documents/month: $${monthlySavings[100].toFixed(2)} saved`);
                console.log(`📊 1,000 documents/month: $${monthlySavings[1000].toFixed(2)} saved`);
                console.log(`📊 10,000 documents/month: $${monthlySavings[10000].toFixed(2)} saved`);

                console.log(`\nAnnual Savings: $${(monthlySavings[1000] * 12).toFixed(2)} (for 1,000 docs/month)`);
            }

        } else {
            console.error('❌ Batch size optimization test failed:', results.error);
        }

    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    }
}

if (require.main === module) {
    runBatchSizeOptimizationTest().catch(console.error);
}

module.exports = { runBatchSizeOptimizationTest };
