#!/usr/bin/env node

/**
 * TEST COST OPTIMIZATION
 * 
 * Compare current expensive processing vs cost-optimized processing
 */

const fs = require('fs').promises;
const CostOptimizedProcessor = require('./cost-optimized-processor');

async function testCostOptimization() {
    console.log('💰 TESTING COST OPTIMIZATION');
    console.log('============================');
    console.log('Comparing current vs optimized processing costs');
    console.log('');
    
    try {
        // Read the MESSOS file
        const filePath = '2. Messos  - 31.03.2025.pdf';
        const fileBuffer = await fs.readFile(filePath);
        
        console.log(`📁 File: ${filePath}`);
        console.log(`📊 Size: ${fileBuffer.length} bytes`);
        console.log('');
        
        // Test cost-optimized processing
        console.log('🚀 TESTING COST-OPTIMIZED PROCESSING:');
        console.log('=====================================');
        
        const processor = new CostOptimizedProcessor();
        const result = await processor.processDocument(fileBuffer);
        
        if (result.success) {
            console.log('\n📊 COST-OPTIMIZED RESULTS:');
            console.log('==========================');
            console.log(`✅ Success: ${result.success}`);
            console.log(`📄 Pages processed: ${result.results.length}`);
            console.log(`⏱️ Processing time: ${result.processingTime}ms`);
            console.log(`💰 Total API cost: $${result.totalCost.toFixed(4)}`);
            console.log(`📊 Cost per page: $${result.costPerPage.toFixed(4)}`);
            console.log(`🎯 Under $0.10 target: ${result.totalCost < 0.10 ? 'YES ✅' : 'NO ❌'}`);
            
            // Show summary
            console.log('\n📈 EXTRACTION SUMMARY:');
            console.log('======================');
            console.log(`📄 Total pages: ${result.summary.totalPages}`);
            console.log(`🏢 Total ISINs: ${result.summary.totalISINs}`);
            console.log(`💰 Total currencies: ${result.summary.totalCurrencies}`);
            console.log(`🎯 Average confidence: ${(result.summary.averageConfidence * 100).toFixed(1)}%`);
            
            // Show processing methods used
            console.log('\n⚙️ PROCESSING METHODS:');
            console.log('======================');
            const methods = {};
            result.results.forEach(r => {
                methods[r.method] = (methods[r.method] || 0) + 1;
            });
            
            Object.entries(methods).forEach(([method, count]) => {
                console.log(`   ${method}: ${count} pages`);
            });
            
            // Show cost breakdown
            console.log('\n💸 COST BREAKDOWN:');
            console.log('==================');
            const costByMethod = {};
            result.results.forEach(r => {
                const method = r.method;
                costByMethod[method] = (costByMethod[method] || 0) + (r.apiCost || 0);
            });
            
            Object.entries(costByMethod).forEach(([method, cost]) => {
                console.log(`   ${method}: $${cost.toFixed(4)}`);
            });
            
            // Compare with current system
            console.log('\n📊 COST COMPARISON:');
            console.log('===================');
            const currentCost = 1.50; // Current system cost
            const optimizedCost = result.totalCost;
            const savings = currentCost - optimizedCost;
            const savingsPercent = (savings / currentCost) * 100;
            
            console.log(`💸 Current system: $${currentCost.toFixed(2)} per document`);
            console.log(`💰 Optimized system: $${optimizedCost.toFixed(4)} per document`);
            console.log(`💵 Savings: $${savings.toFixed(4)} per document`);
            console.log(`📈 Cost reduction: ${savingsPercent.toFixed(1)}%`);
            
            // Monthly volume projections
            console.log('\n📅 MONTHLY COST PROJECTIONS:');
            console.log('============================');
            
            const volumes = [100, 500, 1000, 5000];
            volumes.forEach(volume => {
                const currentMonthly = currentCost * volume;
                const optimizedMonthly = optimizedCost * volume;
                const monthlySavings = currentMonthly - optimizedMonthly;
                
                console.log(`\n📊 ${volume} documents/month:`);
                console.log(`   Current: $${currentMonthly.toFixed(2)}/month`);
                console.log(`   Optimized: $${optimizedMonthly.toFixed(2)}/month`);
                console.log(`   Savings: $${monthlySavings.toFixed(2)}/month`);
                console.log(`   Annual savings: $${(monthlySavings * 12).toFixed(2)}/year`);
            });
            
            // Show sample extracted data
            console.log('\n📋 SAMPLE EXTRACTED DATA:');
            console.log('=========================');
            
            const samplePage = result.results[0];
            if (samplePage && samplePage.patterns) {
                console.log(`📄 Page 1 sample:`);
                console.log(`   Method: ${samplePage.method}`);
                console.log(`   Confidence: ${(samplePage.confidence * 100).toFixed(1)}%`);
                console.log(`   Cost: $${(samplePage.apiCost || 0).toFixed(4)}`);
                
                if (samplePage.patterns.isins && samplePage.patterns.isins.length > 0) {
                    console.log(`   Sample ISINs: ${samplePage.patterns.isins.slice(0, 3).join(', ')}`);
                }
                
                if (samplePage.patterns.currencies && samplePage.patterns.currencies.length > 0) {
                    console.log(`   Sample Currencies: ${samplePage.patterns.currencies.slice(0, 3).join(', ')}`);
                }
                
                if (samplePage.text && samplePage.text.length > 100) {
                    const preview = samplePage.text.substring(0, 200).replace(/\s+/g, ' ').trim();
                    console.log(`   Text Preview: "${preview}..."`);
                }
            }
            
            // Final assessment
            console.log('\n🏆 FINAL ASSESSMENT:');
            console.log('====================');
            
            if (result.totalCost < 0.05) {
                console.log('🎉 EXCELLENT: Under $0.05 per document (target exceeded)');
            } else if (result.totalCost < 0.10) {
                console.log('✅ SUCCESS: Under $0.10 per document (target achieved)');
            } else if (result.totalCost < 0.50) {
                console.log('👍 GOOD: Significant cost reduction achieved');
            } else {
                console.log('⚠️ NEEDS IMPROVEMENT: Cost reduction insufficient');
            }
            
            if (result.summary.totalISINs >= 30) {
                console.log('✅ DATA QUALITY: Good ISIN extraction');
            } else {
                console.log('⚠️ DATA QUALITY: ISIN extraction needs improvement');
            }
            
            if (result.summary.averageConfidence >= 0.8) {
                console.log('✅ CONFIDENCE: High confidence in results');
            } else {
                console.log('⚠️ CONFIDENCE: Results need verification');
            }
            
        } else {
            console.log('❌ Cost-optimized processing failed:', result.error);
        }
        
        // Save detailed results
        const resultsFile = `cost-optimization-results-${Date.now()}.json`;
        await fs.writeFile(resultsFile, JSON.stringify(result, null, 2));
        console.log(`\n📁 Detailed results saved: ${resultsFile}`);
        
    } catch (error) {
        console.error('💥 Cost optimization test failed:', error.message);
        console.error('📍 Error details:', error.stack);
    }
}

testCostOptimization();
