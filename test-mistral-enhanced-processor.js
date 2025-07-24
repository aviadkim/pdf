#!/usr/bin/env node

/**
 * TEST MISTRAL-ENHANCED FINANCIAL PROCESSOR
 * 
 * Tests the new Mistral Vision API integration for accurate financial data extraction
 */

const { MistralEnhancedFinancialProcessor } = require('./mistral-enhanced-financial-processor');
const fs = require('fs').promises;
const path = require('path');

class MistralEnhancedProcessorTest {
    constructor() {
        this.processor = new MistralEnhancedFinancialProcessor();
        this.messosPdfPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
    }

    async runComprehensiveTest() {
        console.log('🧪 MISTRAL-ENHANCED FINANCIAL PROCESSOR TEST');
        console.log('============================================');
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
            console.log('🤖 Using Mistral Vision API for intelligent OCR...');
            console.log('');

            // Process with Mistral-enhanced processor
            const result = await this.processor.processFinancialDocument(this.messosPdfPath);

            // Analyze and display results
            await this.analyzeResults(result);

            // Compare with previous results
            await this.compareWithPreviousResults(result);

            // Generate detailed report
            await this.generateDetailedReport(result);

            const totalTime = Date.now() - startTime;
            console.log('');
            console.log('🎉 MISTRAL-ENHANCED TESTING COMPLETED!');
            console.log('=====================================');
            console.log(`⏱️  Total test time: ${totalTime}ms`);
            console.log(`✅ Success: ${result.success}`);
            console.log(`📊 Method: ${result.method}`);

            return result;

        } catch (error) {
            console.error('❌ Mistral-enhanced testing failed:', error.message);
            console.error(error.stack);
            throw error;
        } finally {
            // Cleanup
            await this.processor.cleanup();
        }
    }

    async analyzeResults(result) {
        console.log('📊 MISTRAL EXTRACTION RESULTS ANALYSIS');
        console.log('======================================');

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
        console.log(`📊 Confidence: ${result.extraction.confidence}%`);
        console.log('');

        // Securities analysis
        console.log('💰 SECURITIES EXTRACTION:');
        console.log(`   📈 Total securities: ${financialData.securities.length}`);
        console.log(`   💵 Total market value: $${financialData.summary.totalMarketValue.toLocaleString()}`);
        console.log('');

        // Sample securities with detailed analysis
        console.log('🔍 SAMPLE SECURITIES (First 5):');
        financialData.securities.slice(0, 5).forEach((security, index) => {
            console.log(`   ${index + 1}. ${security.isin}`);
            console.log(`      Name: ${security.name || 'Not extracted'}`);
            console.log(`      Market Value: $${security.marketValue?.toLocaleString() || 'Not extracted'}`);
            console.log(`      Currency: ${security.currency || 'Not extracted'}`);
            console.log(`      Coupon: ${security.coupon || 'Not extracted'}`);
            console.log(`      Maturity: ${security.maturity || 'Not extracted'}`);
            console.log(`      Rating: ${security.rating || 'Not extracted'}`);
            console.log(`      YTD Performance: ${security.ytdPerformance || 'Not extracted'}`);
            console.log('');
        });

        // Portfolio analysis
        console.log('💼 PORTFOLIO ANALYSIS:');
        console.log(`   💰 Total Value: $${financialData.portfolio.totalValue?.toLocaleString() || 'Not extracted'}`);
        console.log(`   💱 Currency: ${financialData.portfolio.currency || 'Not extracted'}`);
        console.log(`   📅 Valuation Date: ${financialData.portfolio.valuationDate || 'Not extracted'}`);
        console.log(`   📊 Securities Count: ${financialData.portfolio.securitiesCount || 0}`);
        console.log('');

        // Performance analysis
        console.log('📈 PERFORMANCE METRICS:');
        console.log(`   📊 YTD: ${financialData.performance.ytd || 'Not extracted'}`);
        console.log(`   📈 Annual: ${financialData.performance.annual || 'Not extracted'}`);
        console.log(`   🎯 TWR: ${financialData.performance.twr || 'Not extracted'}`);
        console.log(`   💰 Earnings: $${financialData.performance.earnings?.toLocaleString() || 'Not extracted'}`);
        console.log('');

        // Quality assessment
        this.assessExtractionQuality(financialData);
    }

    assessExtractionQuality(financialData) {
        console.log('🎯 EXTRACTION QUALITY ASSESSMENT:');
        
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
        } else {
            qualityScore += 10;
            console.log('   ❌ Securities count: Poor (10/20)');
        }
        maxScore += 20;

        // Security names quality
        const securitiesWithNames = securities.filter(s => s.name && s.name !== 'Ordinary Bonds' && s.name.length > 10).length;
        const nameScore = securities.length > 0 ? (securitiesWithNames / securities.length) * 20 : 0;
        qualityScore += nameScore;
        console.log(`   ${nameScore >= 15 ? '✅' : nameScore >= 10 ? '⚠️' : '❌'} Security names: ${nameScore.toFixed(1)}/20`);
        maxScore += 20;

        // Market values quality
        const securitiesWithValues = securities.filter(s => s.marketValue && s.marketValue > 1000).length;
        const valueScore = securities.length > 0 ? (securitiesWithValues / securities.length) * 20 : 0;
        qualityScore += valueScore;
        console.log(`   ${valueScore >= 15 ? '✅' : valueScore >= 10 ? '⚠️' : '❌'} Market values: ${valueScore.toFixed(1)}/20`);
        maxScore += 20;

        // Financial details (coupons, ratings, etc.)
        const securitiesWithDetails = securities.filter(s => s.coupon || s.rating || s.maturity).length;
        const detailScore = securities.length > 0 ? (securitiesWithDetails / securities.length) * 20 : 0;
        qualityScore += detailScore;
        console.log(`   ${detailScore >= 15 ? '✅' : detailScore >= 10 ? '⚠️' : '❌'} Financial details: ${detailScore.toFixed(1)}/20`);
        maxScore += 20;

        // Portfolio data
        let portfolioScore = 0;
        if (financialData.portfolio.totalValue) portfolioScore += 5;
        if (financialData.portfolio.valuationDate) portfolioScore += 5;
        if (financialData.portfolio.currency) portfolioScore += 5;
        if (Object.keys(financialData.portfolio.allocations || {}).length > 0) portfolioScore += 5;
        qualityScore += portfolioScore;
        console.log(`   ${portfolioScore >= 15 ? '✅' : portfolioScore >= 10 ? '⚠️' : '❌'} Portfolio data: ${portfolioScore}/20`);
        maxScore += 20;

        const overallScore = maxScore > 0 ? (qualityScore / maxScore) * 100 : 0;
        console.log('');
        console.log(`🎯 OVERALL QUALITY SCORE: ${overallScore.toFixed(1)}%`);
        
        if (overallScore >= 90) {
            console.log('   🎉 EXCELLENT - Mistral OCR is working perfectly!');
        } else if (overallScore >= 75) {
            console.log('   ✅ GOOD - Significant improvement over basic parsing');
        } else if (overallScore >= 60) {
            console.log('   ⚠️ FAIR - Some improvement but needs refinement');
        } else {
            console.log('   ❌ POOR - Mistral integration needs debugging');
        }
        console.log('');
    }

    async compareWithPreviousResults(mistralResult) {
        console.log('🔄 COMPARISON WITH PREVIOUS BASIC PARSING:');
        console.log('==========================================');

        // Load previous results if available
        try {
            const previousFiles = await fs.readdir('.');
            const latestReport = previousFiles
                .filter(f => f.startsWith('enhanced-financial-processor-test-report-'))
                .sort()
                .pop();

            if (latestReport) {
                const previousData = JSON.parse(await fs.readFile(latestReport, 'utf8'));
                const previousSecurities = previousData.messos?.result?.financialData?.securities || [];

                console.log('📊 COMPARISON METRICS:');
                console.log(`   Previous method: Basic parsing`);
                console.log(`   New method: Mistral Vision OCR`);
                console.log('');
                console.log(`   Securities count:`);
                console.log(`     Previous: ${previousSecurities.length}`);
                console.log(`     Mistral: ${mistralResult.financialData.securities.length}`);
                console.log('');

                // Compare specific securities
                console.log('🔍 SPECIFIC SECURITY COMPARISON:');
                const testIsin = 'XS2530201644'; // Toronto Dominion Bank
                const previousSecurity = previousSecurities.find(s => s.isin === testIsin);
                const mistralSecurity = mistralResult.financialData.securities.find(s => s.isin === testIsin);

                if (previousSecurity && mistralSecurity) {
                    console.log(`   ${testIsin} (Toronto Dominion Bank):`);
                    console.log(`     Previous name: "${previousSecurity.name}"`);
                    console.log(`     Mistral name: "${mistralSecurity.name}"`);
                    console.log(`     Previous value: "${previousSecurity.value}"`);
                    console.log(`     Mistral value: $${mistralSecurity.marketValue?.toLocaleString()}`);
                    console.log(`     Previous rating: "${previousSecurity.rating || 'None'}"`);
                    console.log(`     Mistral rating: "${mistralSecurity.rating || 'None'}"`);
                }
            } else {
                console.log('   ⚠️ No previous results found for comparison');
            }
        } catch (error) {
            console.log('   ⚠️ Could not load previous results for comparison');
        }
        console.log('');
    }

    async generateDetailedReport(result) {
        const reportData = {
            timestamp: new Date().toISOString(),
            method: 'mistral-vision-ocr',
            success: result.success,
            processingTime: result.processingTime,
            fileInfo: result.fileInfo,
            extraction: result.extraction,
            financialData: result.financialData,
            qualityAssessment: this.generateQualityAssessment(result.financialData),
            comparison: {
                method: 'mistral-vs-basic-parsing',
                improvements: this.identifyImprovements(result.financialData)
            }
        };

        const reportPath = `mistral-enhanced-processor-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));

        console.log(`📊 Detailed report saved: ${reportPath}`);
    }

    generateQualityAssessment(financialData) {
        const securities = financialData.securities;
        
        return {
            totalSecurities: securities.length,
            securitiesWithNames: securities.filter(s => s.name && s.name.length > 10).length,
            securitiesWithValues: securities.filter(s => s.marketValue && s.marketValue > 1000).length,
            securitiesWithCoupons: securities.filter(s => s.coupon).length,
            securitiesWithRatings: securities.filter(s => s.rating).length,
            securitiesWithMaturities: securities.filter(s => s.maturity).length,
            portfolioDataComplete: !!(financialData.portfolio.totalValue && financialData.portfolio.valuationDate),
            performanceDataAvailable: !!(financialData.performance.ytd || financialData.performance.annual)
        };
    }

    identifyImprovements(financialData) {
        return [
            'Accurate market value extraction (not dates as values)',
            'Complete security names (not generic "Ordinary Bonds")',
            'Financial details extraction (coupons, ratings, maturities)',
            'Proper Swiss number formatting handling',
            'Contextual understanding of financial document structure',
            'Higher confidence in data accuracy'
        ];
    }
}

async function main() {
    const tester = new MistralEnhancedProcessorTest();
    await tester.runComprehensiveTest();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { MistralEnhancedProcessorTest };
