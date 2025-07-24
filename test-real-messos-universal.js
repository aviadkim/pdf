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
            console.log(`📋 Document type: ${result.documentType.type} (${result.documentType.confidence}% confidence)`);
            
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
            console.log('-'.repeat(40));\n            const securitiesFound = result.securities.length;\n            const accuracyVsTarget = result.portfolioTotal > 0 ? \n                Math.min(100, (Math.min(this.expectedForComparison.targetTotal, result.totalValue) / \n                Math.max(this.expectedForComparison.targetTotal, result.totalValue)) * 100) : 0;\n            \n            console.log(`📊 Securities: ${securitiesFound} found (expected ~${this.expectedForComparison.minSecurities})`);\n            console.log(`💰 Value accuracy: ${accuracyVsTarget.toFixed(1)}% vs target`);\n            console.log(`💱 Currency: ${result.currency} (expected ${this.expectedForComparison.currency})`);\n            \n            // Step 8: Quality assessment\n            console.log('\\n🎯 QUALITY ASSESSMENT:');\n            console.log('-'.repeat(30));\n            \n            let qualityScore = 0;\n            const assessments = [];\n            \n            // Check securities count\n            if (securitiesFound >= this.expectedForComparison.minSecurities * 0.8) {\n                qualityScore += 25;\n                assessments.push('✅ Good securities count');\n            } else {\n                assessments.push('⚠️ Low securities count');\n            }\n            \n            // Check currency detection\n            if (result.currency === this.expectedForComparison.currency) {\n                qualityScore += 25;\n                assessments.push('✅ Correct currency detected');\n            } else {\n                assessments.push('⚠️ Currency detection issue');\n            }\n            \n            // Check portfolio total detection\n            if (result.portfolioTotal > 0) {\n                qualityScore += 25;\n                assessments.push('✅ Portfolio total detected');\n            } else {\n                assessments.push('⚠️ Portfolio total not detected');\n            }\n            \n            // Check overall accuracy\n            if (result.accuracy >= 80) {\n                qualityScore += 25;\n                assessments.push('✅ High accuracy achieved');\n            } else if (result.accuracy >= 60) {\n                qualityScore += 15;\n                assessments.push('📈 Moderate accuracy');\n            } else {\n                assessments.push('📉 Low accuracy');\n            }\n            \n            assessments.forEach(assessment => console.log(`   ${assessment}`));\n            \n            console.log(`\\n📊 Overall Quality Score: ${qualityScore}/100`);\n            \n            // Step 9: Save results for analysis\n            await this.saveResults(result, processingTime, qualityScore);\n            \n            // Step 10: Final verdict\n            console.log('\\n🏆 FINAL VERDICT:');\n            console.log('='.repeat(30));\n            \n            if (qualityScore >= 80) {\n                console.log('🚀 EXCELLENT: Universal extractor working well!');\n                console.log('✅ No hardcoding needed - generic patterns successful');\n            } else if (qualityScore >= 60) {\n                console.log('📈 GOOD: Universal extractor shows promise');\n                console.log('🔧 Some refinements could improve results');\n            } else if (qualityScore >= 40) {\n                console.log('⚠️ MODERATE: Universal extractor partially working');\n                console.log('🛠️ Needs pattern improvements for this document type');\n            } else {\n                console.log('📉 NEEDS WORK: Universal extractor struggling');\n                console.log('🔍 May need document-specific patterns or vision processing');\n            }\n            \n            return {\n                success: true,\n                result: result,\n                qualityScore: qualityScore,\n                processingTime: processingTime\n            };\n            \n        } catch (error) {\n            console.error('❌ Error testing real Messos PDF:', error.message);\n            return {\n                success: false,\n                error: error.message\n            };\n        }\n    }\n    \n    async saveResults(result, processingTime, qualityScore) {\n        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');\n        const filename = `test-results/real-messos-universal-${timestamp}.json`;\n        \n        const report = {\n            testInfo: {\n                timestamp: new Date().toISOString(),\n                pdfFile: this.messosPath,\n                method: 'universal-extractor-no-hardcoding',\n                processingTime: processingTime,\n                qualityScore: qualityScore\n            },\n            extractionResults: result,\n            comparison: {\n                expectedTarget: this.expectedForComparison.targetTotal,\n                actualTotal: result.totalValue,\n                expectedCurrency: this.expectedForComparison.currency,\n                actualCurrency: result.currency,\n                expectedMinSecurities: this.expectedForComparison.minSecurities,\n                actualSecurities: result.securities.length\n            },\n            securities: result.securities.map(s => ({\n                type: s.identifierType,\n                identifier: s.isin || s.identifier,\n                name: s.name,\n                value: s.marketValue,\n                currency: s.currency\n            }))\n        };\n        \n        try {\n            await fs.mkdir('test-results', { recursive: true });\n            await fs.writeFile(filename, JSON.stringify(report, null, 2));\n            console.log(`\\n💾 Results saved: ${filename}`);\n        } catch (error) {\n            console.log(`⚠️ Could not save results: ${error.message}`);\n        }\n    }\n}\n\n// Run test if called directly\nif (require.main === module) {\n    const tester = new RealMessosUniversalTester();\n    tester.testRealMessosPDF().catch(error => {\n        console.error('❌ Test failed:', error.message);\n        process.exit(1);\n    });\n}\n\nmodule.exports = { RealMessosUniversalTester };