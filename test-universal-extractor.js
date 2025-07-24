/**
 * Test Universal Financial Extractor
 * Tests extraction from ANY financial PDF without hardcoding
 */

const { UniversalExtractor } = require('./universal-extractor.js');

class UniversalExtractorTester {
    constructor() {
        this.extractor = new UniversalExtractor();
        
        // Test documents from different banks/institutions
        this.testDocuments = {
            // Swiss bank format
            messos: `
MESSOS WEALTH MANAGEMENT
Portfolio Statement

ISIN: CH0012005267    UBS Group AG                           850'000 CHF
ISIN: CH0038863350    Nestlé SA                            2'100'000 CHF  
ISIN: US0378331005    Apple Inc.                           1'450'000 USD
ISIN: DE0007236101    Siemens AG                             890'000 EUR
ISIN: XS2746319610    Government Bond 2024                   140'000 CHF

Portfolio Total: 19'464'431 CHF
            `,
            
            // US brokerage format
            usBrokerage: `
ACCOUNT STATEMENT - CHARLES SCHWAB
Security Holdings

CUSIP: 037833100    Apple Inc                      $1,234,567.89
CUSIP: 594918104    Microsoft Corp                 $2,345,678.90
CUSIP: 88160R101    Tesla Inc                        $876,543.21
CUSIP: 02079K305    Alphabet Inc                   $1,567,890.12

Total Account Value: $6,024,680.12
            `,
            
            // European bank format
            europeanBank: `
DEUTSCHE BANK PRIVATE WEALTH
Wertpapierdepot

ISIN: DE0007164600    SAP SE                         1.234.567,89 EUR
ISIN: NL0000235190    Airbus SE                        789.123,45 EUR
WKN: 823212          BASF SE                          456.789,12 EUR
ISIN: FR0000120578    Sanofi SA                        345.678,90 EUR

Gesamtwert Portfolio: 2.826.159,36 EUR
            `,
            
            // UK format
            ukFormat: `
BARCLAYS WEALTH MANAGEMENT
Investment Portfolio

SEDOL: 0263494      BP PLC                           £234,567.89
SEDOL: 0540528      Shell PLC                        £345,678.90
SEDOL: 0798059      Vodafone Group                   £123,456.78
ISIN: GB0002374006   Diageo PLC                       £456,789.01

Total Portfolio Value: £1,160,492.58
            `
        };
    }
    
    async testUniversalExtraction() {
        console.log('🌍 TESTING UNIVERSAL FINANCIAL EXTRACTOR');
        console.log('==========================================');
        console.log('🎯 Goal: Extract from ANY financial document without hardcoding');
        console.log('🚫 No cheating, no bank-specific logic, no hardcoded values');
        console.log('==========================================');
        
        const results = {};
        
        for (const [bankType, document] of Object.entries(this.testDocuments)) {
            console.log(`\\n📋 Testing ${bankType.toUpperCase()} format...`);
            console.log('-'.repeat(50));
            
            try {
                const result = await this.extractor.extract(document);
                
                console.log(`✅ Securities found: ${result.securities.length}`);
                console.log(`💰 Total value: ${result.totalValue.toLocaleString()} ${result.currency}`);
                console.log(`🎯 Portfolio total: ${result.portfolioTotal.toLocaleString()} ${result.currency}`);
                console.log(`📊 Accuracy: ${result.accuracy}%`);
                
                // Show sample securities
                console.log('\\n🔍 Sample securities:');
                result.securities.slice(0, 3).forEach(s => {
                    console.log(`   ${s.identifierType}: ${s.isin || s.identifier} - ${s.name} - ${s.marketValue.toLocaleString()} ${s.currency}`);
                });
                
                results[bankType] = {
                    success: true,
                    securities: result.securities.length,
                    accuracy: result.accuracy,
                    totalValue: result.totalValue,
                    currency: result.currency
                };
                
                // Validate accuracy
                if (result.accuracy >= 85) {
                    console.log(`🏆 EXCELLENT: ${result.accuracy}% accuracy for ${bankType}`);
                } else if (result.accuracy >= 70) {
                    console.log(`✅ GOOD: ${result.accuracy}% accuracy for ${bankType}`);
                } else {
                    console.log(`⚠️ NEEDS IMPROVEMENT: ${result.accuracy}% accuracy for ${bankType}`);
                }
                
            } catch (error) {
                console.log(`❌ Failed to process ${bankType}: ${error.message}`);
                results[bankType] = {
                    success: false,
                    error: error.message
                };
            }
        }
        
        // Overall summary
        console.log('\\n📊 UNIVERSAL EXTRACTION SUMMARY');
        console.log('='.repeat(40));
        
        const successful = Object.values(results).filter(r => r.success).length;
        const total = Object.keys(results).length;
        const avgAccuracy = Object.values(results)
            .filter(r => r.success)
            .reduce((sum, r) => sum + r.accuracy, 0) / successful;
        
        console.log(`✅ Success rate: ${successful}/${total} (${(successful/total*100).toFixed(1)}%)`);
        console.log(`📈 Average accuracy: ${avgAccuracy.toFixed(1)}%`);
        
        // Test different currencies
        const currencies = [...new Set(Object.values(results)
            .filter(r => r.success)
            .map(r => r.currency))];
        console.log(`💱 Currencies detected: ${currencies.join(', ')}`);
        
        // Final verdict
        if (successful === total && avgAccuracy >= 80) {
            console.log('\\n🚀 SUCCESS: Universal extractor works with multiple bank formats!');
            console.log('✅ No hardcoding required - truly generic extraction');
        } else if (successful >= total * 0.75) {
            console.log('\\n📈 GOOD PROGRESS: Works with most formats, some refinement needed');
        } else {
            console.log('\\n🛠️ NEEDS WORK: Requires improvements for broader compatibility');
        }
        
        return results;
    }
    
    async testEdgeCases() {
        console.log('\\n🧪 TESTING EDGE CASES');
        console.log('-'.repeat(30));
        
        const edgeCases = {
            // Mixed currencies
            mixedCurrencies: `
Portfolio Statement
ISIN: US0378331005    Apple Inc                 $1,234,567 USD
ISIN: CH0038863350    Nestlé SA                 1'234'567 CHF
ISIN: DE0007164600    SAP SE                    1.234.567,89 EUR
Total: Multi-currency portfolio
            `,
            
            // Minimal format
            minimal: `
ISIN: CH0012005267    UBS                       500,000
ISIN: US0378331005    Apple                     750,000
Total: 1,250,000
            `,
            
            // Complex table
            complexTable: `
|----|------------------|-----------|----------|
|ISIN|Security Name     |Currency   |Value     |
|----|------------------|-----------|----------|
|CH01|UBS Group AG      |CHF        |1'000'000 |
|US03|Apple Inc         |USD        |2'000'000 |
|DE00|SAP SE            |EUR        |1'500'000 |
|----|------------------|-----------|----------|
            `
        };
        
        for (const [caseType, document] of Object.entries(edgeCases)) {
            console.log(`\\n🧪 Testing ${caseType}...`);
            
            try {
                const result = await this.extractor.extract(document);
                console.log(`   Securities: ${result.securities.length}, Accuracy: ${result.accuracy}%`);
            } catch (error) {
                console.log(`   ❌ Failed: ${error.message}`);
            }
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new UniversalExtractorTester();
    
    async function runTests() {
        try {
            await tester.testUniversalExtraction();
            await tester.testEdgeCases();
        } catch (error) {
            console.error('❌ Test failed:', error.message);
            process.exit(1);
        }
    }
    
    runTests();
}

module.exports = { UniversalExtractorTester };