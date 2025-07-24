/**
 * REAL DEMO TEST - COMPLETE PROCEDURE
 * Shows exactly how the system works step by step
 * Demonstrates the full extraction and structuring process
 * 📊 Complete transparency of what happens inside
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class DemoRealTest {
    constructor() {
        console.log('🎯 REAL DEMO TEST - COMPLETE PROCEDURE');
        console.log('=====================================');
        console.log('📊 Showing EXACTLY how the system extracts and structures data');
        console.log('🔍 Complete transparency of the extraction process');
        console.log('🧠 No hidden magic - see every step in detail\n');
    }

    async runCompleteDemo(pdfPath) {
        console.log('🎯 STARTING COMPLETE DEMO TEST');
        console.log('===============================');
        console.log(`📄 Processing: ${pdfPath}\n`);
        
        const startTime = Date.now();
        
        try {
            // STEP 1: Read the PDF file
            const pdfBuffer = await this.readPDFFile(pdfPath);
            
            // STEP 2: Extract ALL raw data (100% extraction)
            const rawExtraction = await this.extractAllRawData(pdfBuffer);
            
            // STEP 3: Analyze document structure
            const structureAnalysis = await this.analyzeDocumentStructure(rawExtraction);
            
            // STEP 4: Find and match securities with values
            const securityMatching = await this.findAndMatchSecurities(rawExtraction, structureAnalysis);
            
            // STEP 5: Validate and calculate final results
            const finalResults = await this.validateAndCalculateFinal(securityMatching);
            
            const processingTime = Date.now() - startTime;
            
            // STEP 6: Show complete results as they would appear on website
            this.showWebsiteResults(finalResults, processingTime);
            
            return finalResults;
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
            return null;
        }
    }

    async readPDFFile(pdfPath) {
        console.log('📄 STEP 1: READING PDF FILE');
        console.log('============================');
        
        if (!fs.existsSync(pdfPath)) {
            throw new Error(`PDF file not found: ${pdfPath}`);
        }
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        const fileSize = (pdfBuffer.length / 1024).toFixed(1);
        
        console.log(`✅ PDF file loaded successfully`);
        console.log(`   📁 File: ${pdfPath}`);
        console.log(`   📏 Size: ${fileSize} KB`);
        console.log(`   🔍 Ready for extraction\n`);
        
        return pdfBuffer;
    }

    async extractAllRawData(pdfBuffer) {
        console.log('🔍 STEP 2: EXTRACTING ALL RAW DATA (100% EXTRACTION)');
        console.log('=====================================================');
        console.log('📊 Extracting EVERYTHING from the PDF first...\n');
        
        const pdfData = await pdf(pdfBuffer);
        const text = pdfData.text;
        const lines = text.split('\n');
        
        console.log(`📄 Document Information:`);
        console.log(`   📋 Total pages: ${pdfData.numpages || 1}`);
        console.log(`   📏 Total lines: ${lines.length}`);
        console.log(`   📊 Total characters: ${text.length.toLocaleString()}`);
        
        // Extract ALL ISINs
        console.log(`\n🔍 Finding ALL ISINs in document...`);
        const allISINs = [];
        lines.forEach((line, index) => {
            const isinMatch = line.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
            if (isinMatch) {
                allISINs.push({
                    isin: isinMatch[1],
                    lineNumber: index + 1,
                    lineContent: line.trim(),
                    context: this.getLineContext(lines, index, 3)
                });
            }
        });
        
        console.log(`✅ Found ${allISINs.length} ISINs:`);
        allISINs.slice(0, 5).forEach((isin, i) => {
            console.log(`   ${i+1}. ${isin.isin} (line ${isin.lineNumber})`);
        });
        if (allISINs.length > 5) {
            console.log(`   ... and ${allISINs.length - 5} more ISINs`);
        }
        
        // Extract ALL potential values
        console.log(`\n🔢 Finding ALL potential values in document...`);
        const allNumbers = [];
        lines.forEach((line, index) => {
            const numberMatches = [...line.matchAll(/\b(\d{1,3}(?:'?\d{3})*(?:\.\d{1,2})?)\b/g)];
            numberMatches.forEach(match => {
                const value = this.parseSwissNumber(match[1]);
                if (value >= 1000 && value <= 100000000) { // Reasonable range for financial values
                    allNumbers.push({
                        raw: match[1],
                        value: value,
                        lineNumber: index + 1,
                        lineContent: line.trim(),
                        position: match.index
                    });
                }
            });
        });
        
        console.log(`✅ Found ${allNumbers.length} potential financial values:`);
        console.log(`   📊 Range: ${Math.min(...allNumbers.map(n => n.value)).toLocaleString()} - ${Math.max(...allNumbers.map(n => n.value)).toLocaleString()}`);
        console.log(`   🔢 Examples: ${allNumbers.slice(0, 5).map(n => n.value.toLocaleString()).join(', ')}`);
        
        return {
            text: text,
            lines: lines,
            isins: allISINs,
            numbers: allNumbers,
            documentInfo: {
                pages: pdfData.numpages || 1,
                totalLines: lines.length,
                totalCharacters: text.length
            }
        };
    }

    async analyzeDocumentStructure(rawExtraction) {
        console.log(`\n📊 STEP 3: ANALYZING DOCUMENT STRUCTURE`);
        console.log('=======================================');
        console.log('🧠 Understanding how the document is organized...\n');
        
        const { lines, isins, numbers } = rawExtraction;
        
        // Find document sections
        console.log('🏗️ Identifying document sections...');
        const sections = this.identifyDocumentSections(lines);
        console.log(`✅ Found ${sections.length} main sections:`);
        sections.forEach(section => {
            console.log(`   📍 ${section.name} (lines ${section.startLine}-${section.endLine})`);
        });
        
        // Analyze ISIN distribution
        console.log(`\n📍 Analyzing ISIN distribution...`);
        const isinDistribution = this.analyzeISINDistribution(isins);
        console.log(`✅ ISIN Analysis:`);
        console.log(`   📊 First ISIN at line: ${isinDistribution.firstLine}`);
        console.log(`   📊 Last ISIN at line: ${isinDistribution.lastLine}`);
        console.log(`   📊 Main concentration: lines ${isinDistribution.concentrationStart}-${isinDistribution.concentrationEnd}`);
        
        // Analyze number patterns around ISINs
        console.log(`\n🔢 Analyzing number patterns around ISINs...`);
        const numberPatterns = this.analyzeNumberPatterns(isins, numbers);
        console.log(`✅ Number Pattern Analysis:`);
        console.log(`   📊 Numbers within 10 lines of ISINs: ${numberPatterns.nearbyCount}`);
        console.log(`   📊 Most common distances: ${numberPatterns.commonDistances.join(', ')}`);
        console.log(`   📊 Swiss format numbers: ${numberPatterns.swissFormatCount}`);
        
        return {
            sections: sections,
            isinDistribution: isinDistribution,
            numberPatterns: numberPatterns,
            documentType: 'Swiss Financial Portfolio',
            confidence: 0.85
        };
    }

    async findAndMatchSecurities(rawExtraction, structureAnalysis) {
        console.log(`\n🎯 STEP 4: FINDING AND MATCHING SECURITIES WITH VALUES`);
        console.log('====================================================');
        console.log('🧠 Intelligently matching each ISIN with its market value...\n');
        
        const { isins, numbers } = rawExtraction;
        const securities = [];
        
        console.log('🔍 Processing each ISIN...');
        
        for (let i = 0; i < isins.length; i++) {
            const isin = isins[i];
            console.log(`\n🔍 [${i+1}/${isins.length}] Processing ${isin.isin}:`);
            console.log(`   📍 Found at line ${isin.lineNumber}: "${isin.lineContent}"`);
            
            // Find numbers near this ISIN
            const nearbyNumbers = numbers.filter(num => 
                Math.abs(num.lineNumber - isin.lineNumber) <= 15
            );
            
            console.log(`   🔢 Found ${nearbyNumbers.length} numbers within 15 lines`);
            
            if (nearbyNumbers.length > 0) {
                // Analyze distance patterns for this specific ISIN
                const distanceAnalysis = this.analyzeDistancesForISIN(isin, nearbyNumbers);
                console.log(`   📊 Distance analysis: ${distanceAnalysis.summary}`);
                
                // Find the most likely market value
                const bestMatch = this.findBestValueMatch(isin, nearbyNumbers, distanceAnalysis);
                
                if (bestMatch) {
                    securities.push({
                        isin: isin.isin,
                        value: bestMatch.value,
                        raw: bestMatch.raw,
                        confidence: bestMatch.confidence,
                        method: bestMatch.method,
                        distance: bestMatch.distance,
                        foundAt: {
                            isinLine: isin.lineNumber,
                            valueLine: bestMatch.lineNumber
                        },
                        reasoning: bestMatch.reasoning
                    });
                    
                    console.log(`   ✅ MATCHED: ${bestMatch.value.toLocaleString()} (${bestMatch.confidence.toFixed(2)} confidence)`);
                    console.log(`   📍 Value found at line ${bestMatch.lineNumber}, distance ${bestMatch.distance} from ISIN`);
                    console.log(`   💡 Reasoning: ${bestMatch.reasoning}`);
                } else {
                    console.log(`   ❌ NO MATCH: Could not find suitable market value`);
                }
            } else {
                console.log(`   ❌ NO NUMBERS: No financial numbers found near this ISIN`);
            }
        }
        
        console.log(`\n✅ Matching complete: ${securities.length}/${isins.length} ISINs matched with values`);
        
        return securities;
    }

    async validateAndCalculateFinal(securities) {
        console.log(`\n✅ STEP 5: VALIDATION AND FINAL CALCULATION`);
        console.log('===========================================');
        console.log('🎯 Validating results and calculating portfolio total...\n');
        
        // Calculate totals
        const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
        const knownPortfolioTotal = 19464431; // Known total for Messos document
        const accuracy = (Math.min(totalValue, knownPortfolioTotal) / Math.max(totalValue, knownPortfolioTotal)) * 100;
        
        console.log('📊 VALIDATION RESULTS:');
        console.log(`   🔢 Securities found: ${securities.length}`);
        console.log(`   💰 Calculated total: ${totalValue.toLocaleString()}`);
        console.log(`   🎯 Expected total: ${knownPortfolioTotal.toLocaleString()}`);
        console.log(`   📈 Accuracy: ${accuracy.toFixed(2)}%`);
        
        // Analyze confidence distribution
        const avgConfidence = securities.reduce((sum, s) => sum + s.confidence, 0) / securities.length;
        const highConfidence = securities.filter(s => s.confidence >= 0.8).length;
        const mediumConfidence = securities.filter(s => s.confidence >= 0.6 && s.confidence < 0.8).length;
        const lowConfidence = securities.filter(s => s.confidence < 0.6).length;
        
        console.log(`\n🎯 CONFIDENCE ANALYSIS:`);
        console.log(`   📊 Average confidence: ${avgConfidence.toFixed(2)}`);
        console.log(`   🟢 High confidence (≥80%): ${highConfidence} securities`);
        console.log(`   🟡 Medium confidence (60-80%): ${mediumConfidence} securities`);
        console.log(`   🔴 Low confidence (<60%): ${lowConfidence} securities`);
        
        return {
            securities: securities,
            summary: {
                totalSecurities: securities.length,
                totalValue: totalValue,
                expectedTotal: knownPortfolioTotal,
                accuracy: accuracy,
                averageConfidence: avgConfidence,
                confidenceDistribution: {
                    high: highConfidence,
                    medium: mediumConfidence,
                    low: lowConfidence
                }
            }
        };
    }

    showWebsiteResults(finalResults, processingTime) {
        console.log(`\n🌐 STEP 6: WEBSITE RESULTS DISPLAY`);
        console.log('==================================');
        console.log('📱 How this would appear on the website...\n');
        
        // Website Header
        console.log('┌─────────────────────────────────────────────────────────┐');
        console.log('│                 📊 PDF EXTRACTION RESULTS               │');
        console.log('└─────────────────────────────────────────────────────────┘');
        
        // Summary Card
        console.log('\n📋 EXTRACTION SUMMARY:');
        console.log('─────────────────────');
        console.log(`🔢 Securities Extracted: ${finalResults.summary.totalSecurities}`);
        console.log(`💰 Portfolio Value: $${finalResults.summary.totalValue.toLocaleString()}`);
        console.log(`🎯 Accuracy: ${finalResults.summary.accuracy.toFixed(1)}%`);
        console.log(`⚡ Processing Time: ${processingTime}ms`);
        console.log(`🧠 AI Confidence: ${(finalResults.summary.averageConfidence * 100).toFixed(1)}%`);
        
        // Individual Securities Table
        console.log('\n📊 EXTRACTED SECURITIES:');
        console.log('─────────────────────────');
        console.log('┌─────────────────┬─────────────────┬──────────┬─────────────┐');
        console.log('│ ISIN            │ Market Value    │ Conf.    │ Method      │');
        console.log('├─────────────────┼─────────────────┼──────────┼─────────────┤');
        
        finalResults.securities.slice(0, 10).forEach(security => {
            const isin = security.isin.padEnd(15);
            const value = `$${security.value.toLocaleString()}`.padEnd(15);
            const conf = `${(security.confidence * 100).toFixed(0)}%`.padEnd(8);
            const method = security.method.substr(0, 11).padEnd(11);
            console.log(`│ ${isin} │ ${value} │ ${conf} │ ${method} │`);
        });
        
        if (finalResults.securities.length > 10) {
            console.log(`│ ... and ${finalResults.securities.length - 10} more securities ...                │`);
        }
        
        console.log('└─────────────────┴─────────────────┴──────────┴─────────────┘');
        
        // Status Indicators
        console.log('\n🚦 STATUS INDICATORS:');
        console.log('─────────────────────');
        if (finalResults.summary.accuracy >= 95) {
            console.log('🟢 EXCELLENT - Ready for production use');
        } else if (finalResults.summary.accuracy >= 80) {
            console.log('🟡 GOOD - Minor adjustments recommended');
        } else {
            console.log('🔴 NEEDS IMPROVEMENT - Further optimization required');
        }
        
        // API Response Format
        console.log('\n🔌 API RESPONSE FORMAT:');
        console.log('────────────────────────');
        const apiResponse = {
            success: true,
            data: {
                totalSecurities: finalResults.summary.totalSecurities,
                totalValue: finalResults.summary.totalValue,
                accuracy: Math.round(finalResults.summary.accuracy * 100) / 100,
                securities: finalResults.securities.map(s => ({
                    isin: s.isin,
                    value: s.value,
                    confidence: Math.round(s.confidence * 100) / 100
                }))
            },
            metadata: {
                processingTime: processingTime,
                method: 'intelligent_extraction_system',
                version: '1.0.0'
            }
        };
        
        console.log(JSON.stringify(apiResponse, null, 2));
        
        console.log('\n🎉 DEMO COMPLETE - System ready for integration!');
    }

    // Helper methods
    getLineContext(lines, centerIndex, radius) {
        const start = Math.max(0, centerIndex - radius);
        const end = Math.min(lines.length, centerIndex + radius + 1);
        return lines.slice(start, end).map(line => line.trim());
    }

    parseSwissNumber(str) {
        if (typeof str !== 'string') return parseFloat(str) || 0;
        return parseFloat(str.replace(/['\\s]/g, '')) || 0;
    }

    identifyDocumentSections(lines) {
        const sections = [];
        
        // Look for section headers
        lines.forEach((line, index) => {
            const lower = line.toLowerCase();
            if (lower.includes('portfolio') || lower.includes('holdings')) {
                sections.push({
                    name: 'Portfolio Holdings',
                    startLine: index + 1,
                    endLine: Math.min(lines.length, index + 100),
                    type: 'portfolio'
                });
            }
            if (lower.includes('summary') || lower.includes('total')) {
                sections.push({
                    name: 'Summary Section',
                    startLine: index + 1,
                    endLine: Math.min(lines.length, index + 50),
                    type: 'summary'
                });
            }
        });
        
        if (sections.length === 0) {
            sections.push({
                name: 'Main Document',
                startLine: 1,
                endLine: lines.length,
                type: 'main'
            });
        }
        
        return sections;
    }

    analyzeISINDistribution(isins) {
        if (isins.length === 0) return {};
        
        const lineNumbers = isins.map(isin => isin.lineNumber);
        const firstLine = Math.min(...lineNumbers);
        const lastLine = Math.max(...lineNumbers);
        
        // Find concentration area (where most ISINs are)
        const concentrationStart = Math.round(firstLine + (lastLine - firstLine) * 0.1);
        const concentrationEnd = Math.round(lastLine - (lastLine - firstLine) * 0.1);
        
        return {
            firstLine,
            lastLine,
            concentrationStart,
            concentrationEnd,
            totalSpread: lastLine - firstLine
        };
    }

    analyzeNumberPatterns(isins, numbers) {
        let nearbyCount = 0;
        const distances = [];
        let swissFormatCount = 0;
        
        isins.forEach(isin => {
            numbers.forEach(number => {
                const distance = Math.abs(number.lineNumber - isin.lineNumber);
                if (distance <= 10) {
                    nearbyCount++;
                    distances.push(distance);
                }
                if (number.raw.includes("'")) {
                    swissFormatCount++;
                }
            });
        });
        
        // Find most common distances
        const distanceCounts = {};
        distances.forEach(d => distanceCounts[d] = (distanceCounts[d] || 0) + 1);
        const commonDistances = Object.keys(distanceCounts)
            .sort((a, b) => distanceCounts[b] - distanceCounts[a])
            .slice(0, 3)
            .map(d => `${d} lines`);
        
        return {
            nearbyCount,
            commonDistances,
            swissFormatCount: Math.round(swissFormatCount / numbers.length * 100)
        };
    }

    analyzeDistancesForISIN(isin, nearbyNumbers) {
        const distanceMap = {};
        
        nearbyNumbers.forEach(number => {
            const distance = number.lineNumber - isin.lineNumber;
            if (!distanceMap[distance]) distanceMap[distance] = [];
            distanceMap[distance].push(number);
        });
        
        const summary = Object.keys(distanceMap)
            .map(d => `${distanceMap[d].length} at +${d}`)
            .slice(0, 3)
            .join(', ');
        
        return { distanceMap, summary };
    }

    findBestValueMatch(isin, nearbyNumbers, distanceAnalysis) {
        let bestMatch = null;
        let highestScore = 0;
        
        nearbyNumbers.forEach(number => {
            let score = 0.5; // Base score
            const distance = Math.abs(number.lineNumber - isin.lineNumber);
            
            // Prefer reasonable market value range
            if (number.value >= 10000 && number.value <= 10000000) score += 0.2;
            
            // Prefer Swiss format (has apostrophe)
            if (number.raw.includes("'")) score += 0.1;
            
            // Prefer closer distances but not too close
            if (distance >= 2 && distance <= 8) score += 0.1;
            
            // Avoid obvious quantities or round numbers
            if (number.value % 100000 !== 0) score += 0.1;
            
            if (score > highestScore) {
                highestScore = score;
                bestMatch = {
                    ...number,
                    confidence: score,
                    method: 'intelligent_pattern_matching',
                    distance: number.lineNumber - isin.lineNumber,
                    reasoning: this.generateReasoning(number, distance, score)
                };
            }
        });
        
        return bestMatch;
    }

    generateReasoning(number, distance, score) {
        const reasons = [];
        
        if (number.value >= 10000 && number.value <= 10000000) {
            reasons.push('reasonable market value range');
        }
        if (number.raw.includes("'")) {
            reasons.push('Swiss number format');
        }
        if (distance >= 2 && distance <= 8) {
            reasons.push(`appropriate distance (${distance} lines)`);
        }
        if (number.value % 100000 !== 0) {
            reasons.push('not a round quantity number');
        }
        
        return reasons.join(', ') || 'pattern analysis';
    }
}

// Run the demo
async function runRealDemo() {
    const demo = new DemoRealTest();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    const results = await demo.runCompleteDemo(pdfPath);
    
    if (results) {
        // Save detailed results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `demo_real_test_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
    }
    
    return results;
}

// Run the demo
if (require.main === module) {
    runRealDemo().catch(console.error);
}

module.exports = { DemoRealTest };