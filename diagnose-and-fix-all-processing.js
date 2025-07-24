/**
 * DIAGNOSE AND FIX ALL PROCESSING ISSUES
 * Why isn't even basic text extraction working? Let's find out and fix everything.
 */
const fs = require('fs');
const pdfParse = require('pdf-parse');

class ComprehensiveDiagnostic {
    constructor() {
        this.pdfPath = './2. Messos  - 31.03.2025.pdf';
        this.expectedTotal = 19464431;
        this.results = {
            pdfExtraction: null,
            textAnalysis: null,
            isinDetection: null,
            valueExtraction: null,
            recommendations: []
        };
    }

    async diagnosePDFExtraction() {
        console.log('🔍 STEP 1: DIAGNOSING PDF EXTRACTION');
        console.log('='.repeat(50));
        
        if (!fs.existsSync(this.pdfPath)) {
            throw new Error('Messos PDF not found');
        }
        
        const pdfBuffer = fs.readFileSync(this.pdfPath);
        console.log(`📄 PDF Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        try {
            const pdfData = await pdfParse(pdfBuffer);
            const text = pdfData.text;
            
            console.log(`📊 PDF Pages: ${pdfData.numpages}`);
            console.log(`📝 Text Length: ${text.length} characters`);
            console.log(`📋 Lines: ${text.split('\\n').length}`);
            
            // Save extracted text for analysis
            fs.writeFileSync('./extracted-text-debug.txt', text);
            console.log('✅ Text saved to: extracted-text-debug.txt');
            
            this.results.pdfExtraction = {
                success: true,
                pages: pdfData.numpages,
                textLength: text.length,
                lines: text.split('\\n').length
            };
            
            return text;
            
        } catch (error) {
            console.log(`❌ PDF extraction failed: ${error.message}`);
            this.results.pdfExtraction = { success: false, error: error.message };
            return null;
        }
    }

    analyzeTextStructure(text) {
        console.log('\\n🔍 STEP 2: ANALYZING TEXT STRUCTURE');
        console.log('='.repeat(50));
        
        const lines = text.split('\\n');
        const nonEmptyLines = lines.filter(line => line.trim().length > 0);
        
        console.log(`📊 Total lines: ${lines.length}`);
        console.log(`📊 Non-empty lines: ${nonEmptyLines.length}`);
        
        // Look for table patterns
        const tableLines = nonEmptyLines.filter(line => {
            const parts = line.trim().split(/\\s+/);
            return parts.length >= 3; // Likely table rows
        });
        
        console.log(`📊 Potential table lines: ${tableLines.length}`);
        
        // Show sample content
        console.log('\\n📋 SAMPLE CONTENT (first 20 non-empty lines):');
        nonEmptyLines.slice(0, 20).forEach((line, i) => {
            console.log(`${i + 1}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
        });
        
        this.results.textAnalysis = {
            totalLines: lines.length,
            nonEmptyLines: nonEmptyLines.length,
            tableLines: tableLines.length,
            sampleLines: nonEmptyLines.slice(0, 20)
        };
        
        return nonEmptyLines;
    }

    detectISINs(text) {
        console.log('\\n🔍 STEP 3: DETECTING ISINs');
        console.log('='.repeat(50));
        
        // Multiple ISIN patterns
        const patterns = [
            /[A-Z]{2}[A-Z0-9]{10}/g,  // Standard ISIN
            /\\b[A-Z]{2}[0-9A-Z]{10}\\b/g,  // Word boundary ISIN
            /[A-Z]{2}\\d{10}/g,  // ISIN with digits only
        ];
        
        const allISINs = new Set();
        const isinDetails = [];
        
        const lines = text.split('\\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            for (const pattern of patterns) {
                const matches = line.match(pattern);
                if (matches) {
                    for (const isin of matches) {
                        if (!allISINs.has(isin)) {
                            allISINs.add(isin);
                            isinDetails.push({
                                isin: isin,
                                line: i + 1,
                                context: line.substring(0, 150),
                                fullLine: line
                            });
                            console.log(`🎯 Found ISIN: ${isin} on line ${i + 1}`);
                            console.log(`   Context: ${line.substring(0, 100)}...`);
                        }
                    }
                }
            }
        }
        
        console.log(`\\n📊 Total unique ISINs found: ${allISINs.size}`);
        
        this.results.isinDetection = {
            totalISINs: allISINs.size,
            isins: Array.from(allISINs),
            details: isinDetails
        };
        
        return isinDetails;
    }

    extractValues(isinDetails) {
        console.log('\\n🔍 STEP 4: EXTRACTING VALUES');
        console.log('='.repeat(50));
        
        const securities = [];
        
        for (const isinInfo of isinDetails) {
            const line = isinInfo.fullLine;
            const isin = isinInfo.isin;
            
            console.log(`\\n💰 Analyzing values for ${isin}:`);
            console.log(`   Line: ${line}`);
            
            // Multiple value patterns
            const valuePatterns = [
                // Swiss format with apostrophes
                /(\\d{1,3}(?:'\\d{3})+)/g,
                // Decimal numbers
                /(\\d{1,3}(?:[,.]\\d{3})*[.,]\\d{2})/g,
                // Large numbers
                /(\\d{4,})/g,
                // Numbers with currency
                /([\\d,.']+)\\s*(?:CHF|USD|EUR)/gi,
                /(?:CHF|USD|EUR)\\s*([\\d,.']+)/gi
            ];
            
            const valueCandidates = [];
            
            for (const pattern of valuePatterns) {
                const matches = line.match(pattern);
                if (matches) {
                    for (const match of matches) {
                        const cleaned = match.replace(/[^\\d.]/g, '');
                        const value = parseFloat(cleaned);
                        
                        if (value >= 1000 && value <= 100000000) {
                            valueCandidates.push(value);
                            console.log(`   💰 Value candidate: ${value.toLocaleString()} (from "${match}")`);
                        }
                    }
                }
            }
            
            // Select best value
            if (valueCandidates.length > 0) {
                valueCandidates.sort((a, b) => a - b);
                const medianValue = valueCandidates[Math.floor(valueCandidates.length / 2)];
                
                // Extract name (text before ISIN)
                const beforeISIN = line.substring(0, line.indexOf(isin)).trim();
                const name = beforeISIN.replace(/^\\d+\\s*/, '').replace(/[^\\w\\s&.-]/g, '').trim() || `Security ${isin}`;
                
                securities.push({
                    isin: isin,
                    name: name,
                    value: medianValue,
                    currency: 'CHF',
                    candidates: valueCandidates,
                    line: isinInfo.line
                });
                
                console.log(`   ✅ Selected: ${medianValue.toLocaleString()} CHF`);
                console.log(`   📛 Name: ${name}`);
            } else {
                console.log(`   ❌ No valid values found`);
            }
        }
        
        const totalValue = securities.reduce((sum, sec) => sum + sec.value, 0);
        const accuracy = totalValue > 0 ? ((1 - Math.abs(totalValue - this.expectedTotal) / this.expectedTotal) * 100) : 0;
        
        console.log(`\\n📊 EXTRACTION SUMMARY:`);
        console.log(`🔢 Securities with values: ${securities.length}`);
        console.log(`💰 Total value: CHF ${totalValue.toLocaleString()}`);
        console.log(`🎯 Expected: CHF ${this.expectedTotal.toLocaleString()}`);
        console.log(`📈 Accuracy: ${accuracy.toFixed(2)}%`);
        
        this.results.valueExtraction = {
            securities: securities,
            totalValue: totalValue,
            accuracy: accuracy
        };
        
        return securities;
    }

    generateRecommendations() {
        console.log('\\n💡 GENERATING RECOMMENDATIONS');
        console.log('='.repeat(50));
        
        const recommendations = [];
        
        // PDF extraction issues
        if (!this.results.pdfExtraction?.success) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'PDF extraction failing',
                solution: 'Fix pdf-parse configuration or try alternative libraries'
            });
        }
        
        // ISIN detection issues
        if (this.results.isinDetection?.totalISINs === 0) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'No ISINs detected',
                solution: 'PDF might be image-based, need OCR processing'
            });
        } else if (this.results.isinDetection?.totalISINs < 20) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: `Only ${this.results.isinDetection.totalISINs} ISINs found`,
                solution: 'Expand ISIN detection patterns, check for multi-page tables'
            });
        }
        
        // Value extraction issues
        if (this.results.valueExtraction?.securities.length === 0) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'No values extracted',
                solution: 'Improve value pattern matching, handle Swiss number format'
            });
        }
        
        // Accuracy issues
        if (this.results.valueExtraction?.accuracy < 50) {
            recommendations.push({
                priority: 'HIGH',
                issue: `Low accuracy: ${this.results.valueExtraction?.accuracy?.toFixed(2)}%`,
                solution: 'Use Claude API to supervise and correct extraction'
            });
        }
        
        // Multi-API strategy
        recommendations.push({
            priority: 'MEDIUM',
            issue: 'Single extraction method limitation',
            solution: 'Implement multi-stage: 1) Text extraction 2) Claude supervision 3) OpenAI backup'
        });
        
        recommendations.push({
            priority: 'LOW',
            issue: 'Agent system not utilized',
            solution: 'Use existing agents for parallel processing and validation'
        });
        
        this.results.recommendations = recommendations;
        
        console.log('📋 RECOMMENDATIONS:');
        recommendations.forEach((rec, i) => {
            console.log(`${i + 1}. [${rec.priority}] ${rec.issue}`);
            console.log(`   💡 ${rec.solution}`);
        });
        
        return recommendations;
    }

    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            pdfFile: this.pdfPath,
            expectedTotal: this.expectedTotal,
            results: this.results,
            summary: {
                pdfExtractionWorking: this.results.pdfExtraction?.success || false,
                isinsFound: this.results.isinDetection?.totalISINs || 0,
                securitiesExtracted: this.results.valueExtraction?.securities?.length || 0,
                accuracy: this.results.valueExtraction?.accuracy || 0,
                totalValue: this.results.valueExtraction?.totalValue || 0
            }
        };
        
        const filename = `comprehensive-diagnosis-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        
        console.log(`\\n📄 Comprehensive report saved: ${filename}`);
        return report;
    }

    async run() {
        try {
            console.log('🚀 COMPREHENSIVE PROCESSING DIAGNOSIS');
            console.log('🎯 Goal: Find why even basic extraction fails');
            console.log('📋 Then create multi-API solution for 99% accuracy');
            console.log('');
            
            // Step 1: PDF extraction
            const text = await this.diagnosePDFExtraction();
            if (!text) {
                throw new Error('Cannot proceed without PDF text');
            }
            
            // Step 2: Text analysis
            this.analyzeTextStructure(text);
            
            // Step 3: ISIN detection
            const isinDetails = this.detectISINs(text);
            
            // Step 4: Value extraction
            const securities = this.extractValues(isinDetails);
            
            // Step 5: Recommendations
            this.generateRecommendations();
            
            // Step 6: Generate report
            const report = await this.generateReport();
            
            console.log('\\n' + '='.repeat(60));
            console.log('🏁 COMPREHENSIVE DIAGNOSIS COMPLETE');
            console.log(`📊 ISINs found: ${report.summary.isinsFound}`);
            console.log(`🔢 Securities extracted: ${report.summary.securitiesExtracted}`);
            console.log(`🎯 Accuracy: ${report.summary.accuracy.toFixed(2)}%`);
            console.log(`💰 Total value: CHF ${report.summary.totalValue.toLocaleString()}`);
            
            if (report.summary.accuracy > 50) {
                console.log('\\n✅ BASIC EXTRACTION WORKING - Ready for Claude/OpenAI enhancement');
            } else if (report.summary.isinsFound > 0) {
                console.log('\\n⚠️  ISINs found but values problematic - Need better extraction');
            } else {
                console.log('\\n❌ FUNDAMENTAL ISSUES - PDF might be image-based, need OCR');
            }
            
            return report.summary.accuracy > 10; // At least some basic success
            
        } catch (error) {
            console.log(`❌ Diagnosis failed: ${error.message}`);
            return false;
        }
    }
}

// Run comprehensive diagnosis
async function main() {
    const diagnostic = new ComprehensiveDiagnostic();
    const success = await diagnostic.run();
    
    console.log('\\n' + '='.repeat(60));
    if (success) {
        console.log('🎯 NEXT STEPS: Implement multi-API supervision system');
        console.log('1. Fix basic text extraction to get 92%');
        console.log('2. Add Claude API supervision for corrections');
        console.log('3. Add OpenAI backup for verification');
        console.log('4. Use existing agents for parallel processing');
    } else {
        console.log('🚨 CRITICAL: Fix fundamental extraction issues first');
    }
    console.log('='.repeat(60));
    
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ComprehensiveDiagnostic;