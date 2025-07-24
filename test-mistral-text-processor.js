#!/usr/bin/env node

/**
 * TEST MISTRAL TEXT-ENHANCED PROCESSOR
 * 
 * Tests the Mistral API integration for intelligent financial text parsing
 */

const { MistralTextEnhancedProcessor } = require('./mistral-text-enhanced-processor');
const fs = require('fs').promises;
const path = require('path');

class MistralTextProcessorTest {
    constructor() {
        this.processor = new MistralTextEnhancedProcessor();
        this.messosPdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    }

    async runTest() {
        console.log('🧪 MISTRAL TEXT-ENHANCED PROCESSOR TEST');
        console.log('=======================================');
        console.log(`📅 Test started: ${new Date().toLocaleString()}`);
        console.log('');

        const startTime = Date.now();

        try {
            // Check if Messos PDF exists
            const pdfExists = await fs.access(this.messosPdfPath).then(() => true).catch(() => false);
            if (!pdfExists) {
                throw new Error('Messos PDF not found');
            }

            console.log(`📄 Processing: ${this.messosPdfPath}`);
            console.log('🤖 Using Mistral API for intelligent financial text parsing...');
            console.log('');

            // Process with Mistral text-enhanced processor
            const result = await this.processor.processFinancialDocument(this.messosPdfPath);

            // Analyze results
            await this.analyzeResults(result);

            // Compare with previous basic parsing
            await this.compareWithBasicParsing(result);

            // Generate report
            await this.generateReport(result);

            const totalTime = Date.now() - startTime;
            console.log('');
            console.log('🎉 MISTRAL TEXT-ENHANCED TESTING COMPLETED!');
            console.log('===========================================');
            console.log(`⏱️  Total test time: ${totalTime}ms`);
            console.log(`✅ Success: ${result.success}`);
            console.log(`📊 Method: ${result.method}`);

            return result;

        } catch (error) {
            console.error('❌ Mistral text-enhanced testing failed:', error.message);
            throw error;
        }
    }

    async analyzeResults(result) {
        console.log('📊 MISTRAL TEXT PARSING RESULTS');
        console.log('===============================');

        if (!result.success) {
            console.log('❌ Processing failed:', result.error);
            return;
        }

        const financialData = result.financialData;

        // Overall statistics
        console.log(`✅ Processing successful: ${result.success}`);
        console.log(`⏱️  Processing time: ${result.processingTime}ms`);
        console.log(`📄 Pages processed: ${result.fileInfo.pages}`);
        console.log(`🎯 Extraction method: ${result.extraction.method}`);
        console.log(`🤖 Mistral processing: ${result.mistralProcessing.success ? 'Success' : 'Failed'}`);
        console.log('');

        // Securities analysis
        console.log('💰 SECURITIES EXTRACTION:');
        console.log(`   📈 Total securities: ${financialData.securities.length}`);
        console.log(`   💵 Total market value: $${financialData.summary.totalMarketValue.toLocaleString()}`);
        console.log(`   📊 Average security value: $${Math.round(financialData.summary.averageSecurityValue).toLocaleString()}`);
        console.log('');

        // Sample securities
        console.log('🔍 SAMPLE SECURITIES (First 5):');
        financialData.securities.slice(0, 5).forEach((security, index) => {
            console.log(`   ${index + 1}. ${security.isin}`);
            console.log(`      Name: ${security.name || 'Not extracted'}`);
            console.log(`      Market Value: $${security.marketValue?.toLocaleString() || 'Not extracted'}`);
            console.log(`      Currency: ${security.currency || 'Not extracted'}`);
            console.log(`      Coupon: ${security.coupon || 'Not extracted'}`);
            console.log(`      Maturity: ${security.maturity || 'Not extracted'}`);
            console.log(`      Rating: ${security.rating || 'Not extracted'}`);
            console.log('');
        });

        // Portfolio analysis
        console.log('💼 PORTFOLIO ANALYSIS:');
        console.log(`   💰 Total Value: $${financialData.portfolio.totalValue?.toLocaleString() || 'Not extracted'}`);
        console.log(`   💱 Currency: ${financialData.portfolio.currency || 'Not extracted'}`);
        console.log(`   📅 Valuation Date: ${financialData.portfolio.valuationDate || 'Not extracted'}`);
        console.log(`   🏦 Account Number: ${financialData.portfolio.accountNumber || 'Not extracted'}`);
        console.log('');

        // Allocations
        if (financialData.portfolio.allocations && Object.keys(financialData.portfolio.allocations).length > 0) {
            console.log('📊 ASSET ALLOCATIONS:');
            Object.entries(financialData.portfolio.allocations).forEach(([type, allocation]) => {
                console.log(`   ${type}: $${allocation.value?.toLocaleString()} (${allocation.percentage}%)`);
            });
            console.log('');
        }

        // Performance analysis
        console.log('📈 PERFORMANCE METRICS:');
        console.log(`   📊 YTD: ${financialData.performance.ytd || 'Not extracted'}`);
        console.log(`   📈 Annual: ${financialData.performance.annual || 'Not extracted'}`);
        console.log(`   🎯 TWR: ${financialData.performance.twr || 'Not extracted'}`);
        console.log(`   💰 Earnings: $${financialData.performance.earnings?.toLocaleString() || 'Not extracted'}`);
        console.log(`   💸 Accruals: $${financialData.performance.accruals?.toLocaleString() || 'Not extracted'}`);
        console.log('');

        // Quality assessment
        this.assessExtractionQuality(financialData);
    }

    assessExtractionQuality(financialData) {
        console.log('🎯 MISTRAL EXTRACTION QUALITY ASSESSMENT:');
        
        const securities = financialData.securities;
        let qualityScore = 0;
        let maxScore = 0;

        // Securities count (expected ~39)
        if (securities.length >= 35) {
            qualityScore += 20;
            console.log('   ✅ Securities count: Excellent (20/20)');
        } else if (securities.length >= 25) {
            qualityScore += 15;
            console.log('   ⚠️ Securities count: Good (15/20)');
        } else if (securities.length >= 10) {
            qualityScore += 10;
            console.log('   ⚠️ Securities count: Fair (10/20)');
        } else {
            qualityScore += 5;
            console.log('   ❌ Securities count: Poor (5/20)');
        }
        maxScore += 20;

        // Security names quality (looking for specific bank names, not generic)
        const securitiesWithGoodNames = securities.filter(s => 
            s.name && 
            s.name !== 'Ordinary Bonds' && 
            s.name !== 'Corporate Bond' &&
            s.name.length > 15
        ).length;
        const nameScore = securities.length > 0 ? (securitiesWithGoodNames / securities.length) * 20 : 0;
        qualityScore += nameScore;
        console.log(`   ${nameScore >= 15 ? '✅' : nameScore >= 10 ? '⚠️' : '❌'} Security names: ${nameScore.toFixed(1)}/20`);
        maxScore += 20;

        // Market values quality (should be realistic amounts, not dates)
        const securitiesWithRealisticValues = securities.filter(s => 
            s.marketValue && 
            s.marketValue > 1000 && 
            s.marketValue < 10000000
        ).length;
        const valueScore = securities.length > 0 ? (securitiesWithRealisticValues / securities.length) * 20 : 0;
        qualityScore += valueScore;
        console.log(`   ${valueScore >= 15 ? '✅' : valueScore >= 10 ? '⚠️' : '❌'} Market values: ${valueScore.toFixed(1)}/20`);
        maxScore += 20;

        // Financial details (coupons, ratings, maturities)
        const securitiesWithDetails = securities.filter(s => 
            s.coupon || s.rating || s.maturity
        ).length;
        const detailScore = securities.length > 0 ? (securitiesWithDetails / securities.length) * 20 : 0;
        qualityScore += detailScore;
        console.log(`   ${detailScore >= 15 ? '✅' : detailScore >= 10 ? '⚠️' : '❌'} Financial details: ${detailScore.toFixed(1)}/20`);
        maxScore += 20;

        // Portfolio data completeness
        let portfolioScore = 0;
        if (financialData.portfolio.totalValue && financialData.portfolio.totalValue > 1000000) portfolioScore += 5;
        if (financialData.portfolio.valuationDate) portfolioScore += 5;
        if (financialData.portfolio.currency) portfolioScore += 5;
        if (Object.keys(financialData.portfolio.allocations || {}).length > 0) portfolioScore += 5;
        qualityScore += portfolioScore;
        console.log(`   ${portfolioScore >= 15 ? '✅' : portfolioScore >= 10 ? '⚠️' : '❌'} Portfolio data: ${portfolioScore}/20`);
        maxScore += 20;

        const overallScore = maxScore > 0 ? (qualityScore / maxScore) * 100 : 0;
        console.log('');
        console.log(`🎯 OVERALL MISTRAL QUALITY SCORE: ${overallScore.toFixed(1)}%`);
        
        if (overallScore >= 90) {
            console.log('   🎉 EXCELLENT - Mistral API is extracting financial data perfectly!');
        } else if (overallScore >= 75) {
            console.log('   ✅ GOOD - Mistral shows significant improvement over basic parsing');
        } else if (overallScore >= 60) {
            console.log('   ⚠️ FAIR - Mistral is working but needs prompt refinement');
        } else {
            console.log('   ❌ POOR - Mistral integration needs debugging');
        }
        console.log('');

        return overallScore;
    }

    async compareWithBasicParsing(mistralResult) {
        console.log('🔄 COMPARISON: MISTRAL vs BASIC PARSING');
        console.log('=======================================');

        // Expected improvements with Mistral
        console.log('📊 EXPECTED IMPROVEMENTS WITH MISTRAL:');
        console.log('   ✅ Accurate market values (not dates as values)');
        console.log('   ✅ Complete security names (not generic "Ordinary Bonds")');
        console.log('   ✅ Financial details extraction (coupons, ratings, maturities)');
        console.log('   ✅ Proper Swiss number formatting handling');
        console.log('   ✅ Contextual understanding of financial document structure');
        console.log('');

        // Specific example comparison
        console.log('🔍 SPECIFIC EXAMPLE - XS2530201644 (Toronto Dominion Bank):');
        const testIsin = 'XS2530201644';
        const mistralSecurity = mistralResult.financialData?.securities?.find(s => s.isin === testIsin);

        if (mistralSecurity) {
            console.log('   🤖 MISTRAL EXTRACTION:');
            console.log(`     Name: "${mistralSecurity.name}"`);
            console.log(`     Market Value: $${mistralSecurity.marketValue?.toLocaleString()}`);
            console.log(`     Coupon: ${mistralSecurity.coupon || 'Not extracted'}`);
            console.log(`     Rating: ${mistralSecurity.rating || 'Not extracted'}`);
            console.log(`     Maturity: ${mistralSecurity.maturity || 'Not extracted'}`);
        } else {
            console.log('   ⚠️ MISTRAL: Security not found');
        }

        console.log('');
        console.log('   📋 EXPECTED FROM PDF:');
        console.log('     Name: "TORONTO DOMINION BANK NOTES 23-23.02.27 REG-S VRN"');
        console.log('     Market Value: $199,080');
        console.log('     Coupon: 3.32%');
        console.log('     Rating: Moody\'s A2');
        console.log('     Maturity: 2027-02-23');
        console.log('');

        console.log('   ❌ BASIC PARSING WAS EXTRACTING:');
        console.log('     Name: "Ordinary Bonds" (generic!)');
        console.log('     Value: "23.02" (wrong - this is the maturity date!)');
        console.log('     Coupon: Not extracted');
        console.log('     Rating: Not extracted');
        console.log('');
    }

    async generateReport(result) {
        const reportData = {
            timestamp: new Date().toISOString(),
            method: 'mistral-text-enhanced',
            success: result.success,
            processingTime: result.processingTime,
            fileInfo: result.fileInfo,
            extraction: result.extraction,
            mistralProcessing: result.mistralProcessing,
            financialData: result.financialData,
            qualityScore: result.financialData ? this.assessExtractionQuality(result.financialData) : 0,
            comparison: {
                method: 'mistral-vs-basic-parsing',
                expectedImprovements: [
                    'Accurate market value extraction',
                    'Complete security names',
                    'Financial details extraction',
                    'Swiss number formatting',
                    'Contextual understanding'
                ]
            }
        };

        const reportPath = `mistral-text-enhanced-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

        console.log(`📊 Detailed report saved: ${reportPath}`);
    }
}

async function main() {
    const tester = new MistralTextProcessorTest();
    await tester.runTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MistralTextProcessorTest };
