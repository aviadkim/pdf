/**
 * Test Universal Extractor with REAL Messos PDF
 * NO CHEATING - NO HARDCODING - Use actual PDF file
 */

const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const { UniversalExtractor } = require('./universal-extractor.js');

class RealMessosUniversalTester {
    constructor() {
        this.extractor = new UniversalExtractor();
        this.messosPath = '2. Messos  - 31.03.2025.pdf';
        
        // Expected results (for comparison only - NOT used in extraction)
        this.expectedForComparison = {
            targetTotal: 19464431, // CHF from document
            minSecurities: 20, // Should find at least 20 securities
            currency: 'CHF'
        };
    }
    
    async testRealMessosPDF() {
        console.log('🌍 TESTING UNIVERSAL EXTRACTOR WITH REAL MESSOS PDF');
        console.log('===================================================');
        console.log('🚫 NO HARDCODING - NO CHEATING - PURE GENERIC EXTRACTION');
        console.log('📄 File: 2. Messos  - 31.03.2025.pdf');
        console.log('===================================================');
        
        try {
            // Step 1: Load the actual PDF
            console.log('\n📂 Loading real Messos PDF...');
            const pdfBuffer = await fs.readFile(this.messosPath);
            console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
            
            // Step 2: Extract text using pdf-parse
            console.log('\n📖 Extracting text from PDF...');
            const pdfData = await pdfParse(pdfBuffer);
            console.log(`✅ Text extracted: ${pdfData.text.length} characters`);
            console.log(`📄 Pages: ${pdfData.numpages}`);
            
            // Step 3: Show a sample of the raw text (for transparency)
            console.log('\n🔍 Sample of raw PDF text (first 500 chars):');
            console.log('-'.repeat(50));
            console.log(pdfData.text.substring(0, 500).replace(/\\s+/g, ' '));
            console.log('-'.repeat(50));
            
            // Step 4: Run universal extraction (NO HARDCODING)
            console.log('\n🌍 Running Universal Extraction (generic patterns only)...');
            const startTime = Date.now();
            
            const result = await this.extractor.extract(pdfData.text);
            
            const processingTime = Date.now() - startTime;
            console.log(`⏱️ Processing time: ${processingTime}ms`);
            
            // Step 5: Display results
            console.log('\n📊 EXTRACTION RESULTS (NO HARDCODING):');
            console.log('='.repeat(50));
            console.log(`🔍 Securities found: ${result.securities.length}`);
            console.log(`💰 Total value: ${result.totalValue.toLocaleString()} ${result.currency}`);
            console.log(`📈 Portfolio total: ${result.portfolioTotal > 0 ? result.portfolioTotal.toLocaleString() + ' ' + result.currency : 'Not detected'}`);
            console.log(`🎯 Accuracy: ${result.accuracy}%`);
            console.log(`💱 Currency: ${result.currency}`);
            console.log(`📋 Document type: ${result.metadata.extractionMethod} (${result.metadata.documentSupported ? 'supported' : 'unsupported'})`);
            
            // Step 6: Show sample securities (up to 10)
            console.log('\n🔍 EXTRACTED SECURITIES (First 10):');
            console.log('-'.repeat(70));
            result.securities.slice(0, 10).forEach((security, index) => {
                console.log(`${(index + 1).toString().padStart(2)}. ${security.identifierType}: ${security.isin || security.identifier}`);
                console.log(`    Name: ${security.name}`);
                console.log(`    Value: ${security.marketValue.toLocaleString()} ${security.currency}`);
                console.log('');
            });
            
            if (result.securities.length > 10) {
                console.log(`... and ${result.securities.length - 10} more securities`);
            }
            
            // Step 7: Analysis (comparison with expected - NOT used in extraction)
            console.log('\n📈 ANALYSIS (Comparison Only):');
            console.log('-'.repeat(40));
            
            const securitiesFound = result.securities.length;
            const accuracyVsTarget = result.portfolioTotal > 0 ? 
                Math.min(100, (Math.min(this.expectedForComparison.targetTotal, result.totalValue) / 
                Math.max(this.expectedForComparison.targetTotal, result.totalValue)) * 100) : 0;
            
            console.log(`📊 Securities: ${securitiesFound} found (expected ~${this.expectedForComparison.minSecurities})`);
            console.log(`💰 Value accuracy: ${accuracyVsTarget.toFixed(1)}% vs target`);
            console.log(`💱 Currency: ${result.currency} (expected ${this.expectedForComparison.currency})`);
            
            // Step 8: Quality assessment
            console.log('\n🎯 QUALITY ASSESSMENT:');
            console.log('-'.repeat(30));
            
            let qualityScore = 0;
            const assessments = [];
            
            // Check securities count
            if (securitiesFound >= this.expectedForComparison.minSecurities * 0.8) {
                qualityScore += 25;
                assessments.push('✅ Good securities count');
            } else {
                assessments.push('⚠️ Low securities count');
            }
            
            // Check currency detection
            if (result.currency === this.expectedForComparison.currency) {
                qualityScore += 25;
                assessments.push('✅ Correct currency detected');
            } else {
                assessments.push('⚠️ Currency detection issue');
            }
            
            // Check portfolio total detection
            if (result.portfolioTotal > 0) {
                qualityScore += 25;
                assessments.push('✅ Portfolio total detected');
            } else {
                assessments.push('⚠️ Portfolio total not detected');
            }
            
            // Check overall accuracy
            if (result.accuracy >= 80) {
                qualityScore += 25;
                assessments.push('✅ High accuracy achieved');
            } else if (result.accuracy >= 60) {
                qualityScore += 15;
                assessments.push('📈 Moderate accuracy');
            } else {
                assessments.push('📉 Low accuracy');
            }
            
            assessments.forEach(assessment => console.log(`   ${assessment}`));
            
            console.log(`\n📊 Overall Quality Score: ${qualityScore}/100`);
            
            // Step 9: Save results for analysis
            await this.saveResults(result, processingTime, qualityScore);
            
            // Step 10: Final verdict
            console.log('\n🏆 FINAL VERDICT:');
            console.log('='.repeat(30));
            
            if (qualityScore >= 80) {
                console.log('🚀 EXCELLENT: Universal extractor working well!');
                console.log('✅ No hardcoding needed - generic patterns successful');
            } else if (qualityScore >= 60) {
                console.log('📈 GOOD: Universal extractor shows promise');
                console.log('🔧 Some refinements could improve results');
            } else if (qualityScore >= 40) {
                console.log('⚠️ MODERATE: Universal extractor partially working');
                console.log('🛠️ Needs pattern improvements for this document type');
            } else {
                console.log('📉 NEEDS WORK: Universal extractor struggling');
                console.log('🔍 May need document-specific patterns or vision processing');
            }
            
            return {
                success: true,
                result: result,
                qualityScore: qualityScore,
                processingTime: processingTime
            };
            
        } catch (error) {
            console.error('❌ Error testing real Messos PDF:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async saveResults(result, processingTime, qualityScore) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `test-results/real-messos-universal-${timestamp}.json`;
        
        const report = {
            testInfo: {
                timestamp: new Date().toISOString(),
                pdfFile: this.messosPath,
                method: 'universal-extractor-no-hardcoding',
                processingTime: processingTime,
                qualityScore: qualityScore
            },
            extractionResults: result,
            comparison: {
                expectedTarget: this.expectedForComparison.targetTotal,
                actualTotal: result.totalValue,
                expectedCurrency: this.expectedForComparison.currency,
                actualCurrency: result.currency,
                expectedMinSecurities: this.expectedForComparison.minSecurities,
                actualSecurities: result.securities.length
            },
            securities: result.securities.map(s => ({
                type: s.identifierType,
                identifier: s.isin || s.identifier,
                name: s.name,
                value: s.marketValue,
                currency: s.currency
            }))
        };
        
        try {
            await fs.mkdir('test-results', { recursive: true });
            await fs.writeFile(filename, JSON.stringify(report, null, 2));
            console.log(`\n💾 Results saved: ${filename}`);
        } catch (error) {
            console.log(`⚠️ Could not save results: ${error.message}`);
        }
    }
}

// Run test if called directly
if (require.main === module) {
    const tester = new RealMessosUniversalTester();
    tester.testRealMessosPDF().catch(error => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });
}

module.exports = { RealMessosUniversalTester };