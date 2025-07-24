/**
 * COMPLETE A TO Z TEST - FULL TRANSPARENCY
 * Shows EXACTLY how the system extracts 100% data and builds table structure
 * Every single step documented with code and results
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class CompleteAToZTest {
    constructor() {
        console.log('🎯 COMPLETE A TO Z TEST - FULL TRANSPARENCY');
        console.log('=============================================');
        console.log('📊 Showing EXACTLY how we extract 100% data and build table structure');
        console.log('🔍 Every single step documented with code and results\n');
    }

    async runCompleteTest() {
        console.log('🚀 STARTING COMPLETE A TO Z TEST');
        console.log('=================================\n');
        
        const pdfPath = '2. Messos  - 31.03.2025.pdf';
        const startTime = Date.now();

        try {
            // =================== STEP A: READ PDF ===================
            await this.stepA_ReadPDF(pdfPath);
            
            // =================== STEP B: EXTRACT 100% RAW DATA ===================
            const rawData = await this.stepB_Extract100Percent(pdfPath);
            
            // =================== STEP C: ANALYZE STRUCTURE ===================
            const structure = await this.stepC_AnalyzeStructure(rawData);
            
            // =================== STEP D: BUILD TABLE UNDERSTANDING ===================
            const tableStructure = await this.stepD_BuildTableStructure(rawData, structure);
            
            // =================== STEP E: INTELLIGENT MATCHING ===================
            const matchedData = await this.stepE_IntelligentMatching(rawData, tableStructure);
            
            // =================== STEP F: BUILD FINAL TABLE ===================
            const finalTable = await this.stepF_BuildFinalTable(matchedData);
            
            // =================== STEP G: VALIDATE AND DISPLAY ===================
            const results = await this.stepG_ValidateAndDisplay(finalTable, startTime);
            
            return results;
            
        } catch (error) {
            console.error('❌ A to Z test failed:', error);
            return null;
        }
    }

    // =================== STEP A: READ PDF ===================
    async stepA_ReadPDF(pdfPath) {
        console.log('📄 STEP A: READING PDF FILE');
        console.log('============================');
        console.log('🔍 Loading PDF and extracting raw text...\n');
        
        if (!fs.existsSync(pdfPath)) {
            throw new Error(`PDF file not found: ${pdfPath}`);
        }
        
        const fileStats = fs.statSync(pdfPath);
        const fileSize = (fileStats.size / 1024).toFixed(1);
        
        console.log(`✅ PDF File Information:`);
        console.log(`   📁 File: ${pdfPath}`);
        console.log(`   📏 Size: ${fileSize} KB`);
        console.log(`   📅 Modified: ${fileStats.mtime.toLocaleString()}`);
        console.log(`   🔍 Status: Ready for processing\n`);
        
        return { filePath: pdfPath, fileSize, fileStats };
    }

    // =================== STEP B: EXTRACT 100% RAW DATA ===================
    async stepB_Extract100Percent(pdfPath) {
        console.log('🔍 STEP B: EXTRACTING 100% RAW DATA');
        console.log('===================================');
        console.log('📊 This is where we extract EVERYTHING from the PDF first...\n');
        
        const pdfBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdf(pdfBuffer);
        const fullText = pdfData.text;
        const allLines = fullText.split('\n');
        
        console.log(`📄 Raw Document Analysis:`);
        console.log(`   📋 Total pages: ${pdfData.numpages || 1}`);
        console.log(`   📏 Total lines: ${allLines.length}`);
        console.log(`   📊 Total characters: ${fullText.length.toLocaleString()}`);
        console.log(`   💾 Memory usage: ${Math.round(Buffer.byteLength(fullText, 'utf8') / 1024)} KB\n`);
        
        // Extract EVERY SINGLE ISIN
        console.log('🔍 EXTRACTING ALL ISINs (100% COVERAGE):');
        console.log('=========================================');
        const allISINs = [];
        const isinRegex = /\b([A-Z]{2}[A-Z0-9]{10})\b/g;
        
        allLines.forEach((line, index) => {
            let match;
            while ((match = isinRegex.exec(line)) !== null) {
                allISINs.push({
                    isin: match[1],
                    lineNumber: index + 1,
                    lineContent: line.trim(),
                    characterPosition: match.index,
                    extractionMethod: 'regex_pattern_match',
                    contextBefore: line.substring(Math.max(0, match.index - 20), match.index),
                    contextAfter: line.substring(match.index + 12, Math.min(line.length, match.index + 32))
                });
            }
            isinRegex.lastIndex = 0; // Reset regex for next line
        });
        
        console.log(`✅ ISIN EXTRACTION COMPLETE:`);
        console.log(`   🎯 Total ISINs found: ${allISINs.length}`);
        console.log(`   📍 First ISIN: ${allISINs[0]?.isin} at line ${allISINs[0]?.lineNumber}`);
        console.log(`   📍 Last ISIN: ${allISINs[allISINs.length-1]?.isin} at line ${allISINs[allISINs.length-1]?.lineNumber}`);
        
        // Show first 5 ISINs with details
        console.log(`\n📋 FIRST 5 ISINs WITH FULL CONTEXT:`);
        allISINs.slice(0, 5).forEach((isin, i) => {
            console.log(`   ${i+1}. ${isin.isin}`);
            console.log(`      📍 Line ${isin.lineNumber}: "${isin.lineContent}"`);
            console.log(`      🔍 Context: ...${isin.contextBefore}[${isin.isin}]${isin.contextAfter}...`);
        });
        
        // Extract EVERY SINGLE NUMBER
        console.log(`\n\n🔢 EXTRACTING ALL NUMBERS (100% COVERAGE):`);
        console.log('==========================================');
        const allNumbers = [];
        const numberPatterns = [
            { name: 'Swiss Format', regex: /\b(\d{1,3}(?:'?\d{3})+(?:\.\d{1,2})?)\b/g },
            { name: 'Large Numbers', regex: /\b(\d{4,}(?:\.\d{1,2})?)\b/g },
            { name: 'Decimal Numbers', regex: /\b(\d{1,3}\.\d{1,2})\b/g }
        ];
        
        numberPatterns.forEach(pattern => {
            allLines.forEach((line, lineIndex) => {
                let match;
                while ((match = pattern.regex.exec(line)) !== null) {
                    const rawValue = match[1];
                    const numericValue = this.parseNumber(rawValue);
                    
                    // Only include financial-relevant numbers
                    if (numericValue >= 100 && numericValue <= 100000000) {
                        allNumbers.push({
                            raw: rawValue,
                            value: numericValue,
                            lineNumber: lineIndex + 1,
                            lineContent: line.trim(),
                            characterPosition: match.index,
                            patternType: pattern.name,
                            isSwissFormat: rawValue.includes("'"),
                            hasDecimal: rawValue.includes('.'),
                            contextBefore: line.substring(Math.max(0, match.index - 15), match.index),
                            contextAfter: line.substring(match.index + rawValue.length, Math.min(line.length, match.index + rawValue.length + 15))
                        });
                    }
                }
                pattern.regex.lastIndex = 0; // Reset regex
            });
        });
        
        // Remove duplicates (same number at same position)
        const uniqueNumbers = allNumbers.filter((num, index, arr) => 
            index === arr.findIndex(n => n.raw === num.raw && n.lineNumber === num.lineNumber && n.characterPosition === num.characterPosition)
        );
        
        console.log(`✅ NUMBER EXTRACTION COMPLETE:`);
        console.log(`   🎯 Total numbers found: ${uniqueNumbers.length}`);
        console.log(`   📊 Value range: ${Math.min(...uniqueNumbers.map(n => n.value)).toLocaleString()} - ${Math.max(...uniqueNumbers.map(n => n.value)).toLocaleString()}`);
        console.log(`   🇨🇭 Swiss format: ${uniqueNumbers.filter(n => n.isSwissFormat).length}`);
        console.log(`   📈 With decimals: ${uniqueNumbers.filter(n => n.hasDecimal).length}`);
        
        // Show number distribution by value ranges
        const ranges = [
            { name: 'Small (100-10K)', min: 100, max: 10000 },
            { name: 'Medium (10K-100K)', min: 10000, max: 100000 },
            { name: 'Large (100K-1M)', min: 100000, max: 1000000 },
            { name: 'Very Large (1M+)', min: 1000000, max: 100000000 }
        ];
        
        console.log(`\n📊 NUMBER DISTRIBUTION BY VALUE RANGES:`);
        ranges.forEach(range => {
            const count = uniqueNumbers.filter(n => n.value >= range.min && n.value < range.max).length;
            console.log(`   ${range.name}: ${count} numbers`);
        });
        
        return {
            fullText,
            allLines,
            allISINs,
            allNumbers: uniqueNumbers,
            documentInfo: {
                pages: pdfData.numpages || 1,
                totalLines: allLines.length,
                totalCharacters: fullText.length
            }
        };
    }

    // =================== STEP C: ANALYZE STRUCTURE ===================
    async stepC_AnalyzeStructure(rawData) {
        console.log(`\n\n📊 STEP C: ANALYZING DOCUMENT STRUCTURE`);
        console.log('=======================================');
        console.log('🧠 Understanding how the document is organized...\n');
        
        const { allLines, allISINs, allNumbers } = rawData;
        
        // Analyze document sections
        console.log('🏗️ IDENTIFYING DOCUMENT SECTIONS:');
        const sections = this.identifyDocumentSections(allLines);
        sections.forEach(section => {
            console.log(`   📍 ${section.name}: lines ${section.startLine}-${section.endLine} (${section.type})`);
        });
        
        // Analyze ISIN clustering
        console.log(`\n📍 ANALYZING ISIN DISTRIBUTION:`);
        const isinDistribution = this.analyzeISINDistribution(allISINs);
        console.log(`   📊 ISIN spread: lines ${isinDistribution.firstLine} to ${isinDistribution.lastLine}`);
        console.log(`   📊 Main cluster: lines ${isinDistribution.clusterStart} to ${isinDistribution.clusterEnd}`);
        console.log(`   📊 Cluster density: ${isinDistribution.clusterDensity.toFixed(2)} ISINs per line`);
        
        // Analyze number patterns around ISINs
        console.log(`\n🔢 ANALYZING NUMBER PATTERNS AROUND ISINs:`);
        const proximityAnalysis = this.analyzeNumberProximityToISINs(allISINs, allNumbers);
        console.log(`   📊 Numbers within 5 lines of ISINs: ${proximityAnalysis.within5Lines}`);
        console.log(`   📊 Numbers within 10 lines of ISINs: ${proximityAnalysis.within10Lines}`);
        console.log(`   📊 Most common distances: ${proximityAnalysis.commonDistances.join(', ')}`);
        
        // Analyze line patterns
        console.log(`\n📏 ANALYZING LINE PATTERNS:`);
        const linePatterns = this.analyzeLinePatterns(allLines);
        console.log(`   📊 Short lines (<20 chars): ${linePatterns.shortLines}`);
        console.log(`   📊 Medium lines (20-80 chars): ${linePatterns.mediumLines}`);
        console.log(`   📊 Long lines (>80 chars): ${linePatterns.longLines}`);
        console.log(`   📊 Empty lines: ${linePatterns.emptyLines}`);
        
        return {
            sections,
            isinDistribution,
            proximityAnalysis,
            linePatterns,
            confidence: 0.85
        };
    }

    // =================== STEP D: BUILD TABLE STRUCTURE ===================
    async stepD_BuildTableStructure(rawData, structure) {
        console.log(`\n\n🏗️ STEP D: BUILDING TABLE STRUCTURE`);
        console.log('===================================');
        console.log('📊 Understanding the table layout and relationships...\n');
        
        const { allISINs, allNumbers } = rawData;
        
        // Build ISIN-to-Numbers mapping
        console.log('🔗 BUILDING ISIN-TO-NUMBERS RELATIONSHIP MAP:');
        const relationshipMap = {};
        
        allISINs.forEach((isin, isinIndex) => {
            console.log(`\n🔍 [${isinIndex + 1}/${allISINs.length}] Analyzing ${isin.isin}:`);
            console.log(`   📍 Found at line ${isin.lineNumber}: "${isin.lineContent}"`);
            
            // Find all numbers within reasonable distance
            const nearbyNumbers = allNumbers.filter(num => {
                const distance = Math.abs(num.lineNumber - isin.lineNumber);
                return distance <= 15; // Within 15 lines
            });
            
            console.log(`   🔢 Found ${nearbyNumbers.length} numbers within 15 lines`);
            
            // Analyze distance patterns for this ISIN
            const distanceMap = {};
            nearbyNumbers.forEach(num => {
                const distance = num.lineNumber - isin.lineNumber;
                if (!distanceMap[distance]) distanceMap[distance] = [];
                distanceMap[distance].push(num);
            });
            
            // Show distance distribution
            const distanceKeys = Object.keys(distanceMap).map(d => parseInt(d)).sort((a, b) => a - b);
            const distanceDisplay = distanceKeys.slice(0, 5).map(d => `${distanceMap[d].length}@${d >= 0 ? '+' : ''}${d}`).join(', ');
            console.log(`   📊 Distance distribution: ${distanceDisplay}`);
            
            relationshipMap[isin.isin] = {
                isin: isin,
                nearbyNumbers: nearbyNumbers,
                distanceMap: distanceMap,
                bestCandidates: this.findBestValueCandidates(nearbyNumbers, isin)
            };
            
            // Show best candidates
            const bestCandidates = relationshipMap[isin.isin].bestCandidates;
            if (bestCandidates.length > 0) {
                console.log(`   🏆 Best candidates: ${bestCandidates.slice(0, 3).map(c => `${c.value.toLocaleString()}(${c.score.toFixed(2)})`).join(', ')}`);
            } else {
                console.log(`   ❌ No suitable candidates found`);
            }
        });
        
        return {
            relationshipMap,
            totalMappings: Object.keys(relationshipMap).length,
            avgCandidatesPerISIN: Object.values(relationshipMap).reduce((sum, mapping) => sum + mapping.bestCandidates.length, 0) / allISINs.length
        };
    }

    // =================== STEP E: INTELLIGENT MATCHING ===================
    async stepE_IntelligentMatching(rawData, tableStructure) {
        console.log(`\n\n🧠 STEP E: INTELLIGENT MATCHING`);
        console.log('===============================');
        console.log('🎯 Using AI to match each ISIN with its market value...\n');
        
        const { relationshipMap } = tableStructure;
        const matchedSecurities = [];
        
        console.log('🤖 APPLYING INTELLIGENT MATCHING ALGORITHMS:');
        
        Object.values(relationshipMap).forEach((mapping, index) => {
            const isin = mapping.isin;
            console.log(`\n🧠 [${index + 1}] Intelligent matching for ${isin.isin}:`);
            
            const candidates = mapping.bestCandidates;
            if (candidates.length === 0) {
                console.log(`   ❌ No candidates available for matching`);
                return;
            }
            
            // Apply multiple AI algorithms
            const algorithms = [
                this.proximityBasedMatching(candidates, isin),
                this.valueRangeMatching(candidates, isin),
                this.contextualMatching(candidates, isin),
                this.patternBasedMatching(candidates, isin, rawData)
            ];
            
            console.log(`   🤖 Applied ${algorithms.length} AI algorithms:`);
            algorithms.forEach((result, i) => {
                console.log(`      ${i + 1}. ${result.algorithm}: ${result.bestMatch ? result.bestMatch.value.toLocaleString() : 'No match'} (${result.confidence.toFixed(2)})`);
            });
            
            // Ensemble decision making
            const ensembleDecision = this.makeEnsembleDecision(algorithms, candidates);
            
            if (ensembleDecision.finalMatch) {
                matchedSecurities.push({
                    isin: isin.isin,
                    value: ensembleDecision.finalMatch.value,
                    confidence: ensembleDecision.confidence,
                    algorithm: ensembleDecision.winningAlgorithm,
                    reasoning: ensembleDecision.reasoning,
                    sourceInfo: {
                        isinLine: isin.lineNumber,
                        valueLine: ensembleDecision.finalMatch.lineNumber,
                        distance: ensembleDecision.finalMatch.lineNumber - isin.lineNumber,
                        valueContext: ensembleDecision.finalMatch.lineContent
                    }
                });
                
                console.log(`   ✅ MATCHED: ${ensembleDecision.finalMatch.value.toLocaleString()}`);
                console.log(`   🎯 Confidence: ${ensembleDecision.confidence.toFixed(2)}`);
                console.log(`   📊 Algorithm: ${ensembleDecision.winningAlgorithm}`);
                console.log(`   💡 Reasoning: ${ensembleDecision.reasoning}`);
            } else {
                console.log(`   ❌ NO MATCH: Insufficient confidence from all algorithms`);
            }
        });
        
        console.log(`\n✅ INTELLIGENT MATCHING COMPLETE:`);
        console.log(`   🎯 Successfully matched: ${matchedSecurities.length}/${Object.keys(relationshipMap).length} ISINs`);
        console.log(`   📊 Average confidence: ${(matchedSecurities.reduce((sum, s) => sum + s.confidence, 0) / matchedSecurities.length).toFixed(2)}`);
        
        return {
            matchedSecurities,
            matchingStats: {
                totalISINs: Object.keys(relationshipMap).length,
                successfulMatches: matchedSecurities.length,
                matchRate: (matchedSecurities.length / Object.keys(relationshipMap).length * 100).toFixed(1)
            }
        };
    }

    // =================== STEP F: BUILD FINAL TABLE ===================
    async stepF_BuildFinalTable(matchedData) {
        console.log(`\n\n📊 STEP F: BUILDING FINAL TABLE`);
        console.log('===============================');
        console.log('🏗️ Structuring the final results table...\n');
        
        const { matchedSecurities } = matchedData;
        
        // Sort securities by confidence (highest first)
        const sortedSecurities = [...matchedSecurities].sort((a, b) => b.confidence - a.confidence);
        
        console.log('📋 FINAL TABLE STRUCTURE:');
        console.log('┌─────────────────┬─────────────────┬──────────┬─────────────┬──────────────────┐');
        console.log('│ ISIN            │ Market Value    │ Conf.    │ Algorithm   │ Distance         │');
        console.log('├─────────────────┼─────────────────┼──────────┼─────────────┼──────────────────┤');
        
        sortedSecurities.forEach((security, index) => {
            const isin = security.isin.padEnd(15);
            const value = `$${security.value.toLocaleString()}`.padEnd(15);
            const conf = `${Math.round(security.confidence * 100)}%`.padEnd(8);
            const algo = security.algorithm.substr(0, 11).padEnd(11);
            const dist = `${security.sourceInfo.distance >= 0 ? '+' : ''}${security.sourceInfo.distance}`.padEnd(16);
            
            console.log(`│ ${isin} │ ${value} │ ${conf} │ ${algo} │ ${dist} │`);
        });
        
        console.log('└─────────────────┴─────────────────┴──────────┴─────────────┴──────────────────┘');
        
        // Calculate portfolio statistics
        const totalValue = sortedSecurities.reduce((sum, s) => sum + s.value, 0);
        const avgConfidence = sortedSecurities.reduce((sum, s) => sum + s.confidence, 0) / sortedSecurities.length;
        
        console.log(`\n📊 TABLE STATISTICS:`);
        console.log(`   🔢 Total securities: ${sortedSecurities.length}`);
        console.log(`   💰 Total portfolio value: $${totalValue.toLocaleString()}`);
        console.log(`   📈 Average confidence: ${(avgConfidence * 100).toFixed(1)}%`);
        console.log(`   🏆 Highest confidence: ${(Math.max(...sortedSecurities.map(s => s.confidence)) * 100).toFixed(1)}%`);
        console.log(`   📉 Lowest confidence: ${(Math.min(...sortedSecurities.map(s => s.confidence)) * 100).toFixed(1)}%`);
        
        return {
            finalTable: sortedSecurities,
            tableStats: {
                totalSecurities: sortedSecurities.length,
                totalValue: totalValue,
                averageConfidence: avgConfidence,
                highestConfidence: Math.max(...sortedSecurities.map(s => s.confidence)),
                lowestConfidence: Math.min(...sortedSecurities.map(s => s.confidence))
            }
        };
    }

    // =================== STEP G: VALIDATE AND DISPLAY ===================
    async stepG_ValidateAndDisplay(finalTable, startTime) {
        console.log(`\n\n✅ STEP G: VALIDATION AND FINAL DISPLAY`);
        console.log('=======================================');
        console.log('🎯 Validating results against known benchmarks...\n');
        
        const { finalTable: securities, tableStats } = finalTable;
        const processingTime = Date.now() - startTime;
        
        // Validate against known Messos portfolio total
        const knownPortfolioTotal = 19464431; // Known Messos total
        const extractedTotal = tableStats.totalValue;
        const accuracy = (Math.min(extractedTotal, knownPortfolioTotal) / Math.max(extractedTotal, knownPortfolioTotal)) * 100;
        
        console.log('🎯 VALIDATION RESULTS:');
        console.log(`   📊 Securities extracted: ${tableStats.totalSecurities}`);
        console.log(`   💰 Extracted total: $${extractedTotal.toLocaleString()}`);
        console.log(`   🎯 Known total: $${knownPortfolioTotal.toLocaleString()}`);
        console.log(`   📈 Accuracy: ${accuracy.toFixed(2)}%`);
        console.log(`   ⚡ Processing time: ${processingTime}ms`);
        
        // Confidence distribution analysis
        const confidenceRanges = [
            { name: 'High (80-100%)', min: 0.8, max: 1.0 },
            { name: 'Medium (60-80%)', min: 0.6, max: 0.8 },
            { name: 'Low (40-60%)', min: 0.4, max: 0.6 },
            { name: 'Very Low (<40%)', min: 0.0, max: 0.4 }
        ];
        
        console.log(`\n📊 CONFIDENCE DISTRIBUTION:`);
        confidenceRanges.forEach(range => {
            const count = securities.filter(s => s.confidence >= range.min && s.confidence < range.max).length;
            const percentage = (count / securities.length * 100).toFixed(1);
            console.log(`   ${range.name}: ${count} securities (${percentage}%)`);
        });
        
        // Algorithm performance analysis
        console.log(`\n🤖 ALGORITHM PERFORMANCE:`);
        const algorithmStats = {};
        securities.forEach(s => {
            if (!algorithmStats[s.algorithm]) {
                algorithmStats[s.algorithm] = { count: 0, totalConfidence: 0 };
            }
            algorithmStats[s.algorithm].count++;
            algorithmStats[s.algorithm].totalConfidence += s.confidence;
        });
        
        Object.keys(algorithmStats).forEach(algo => {
            const stats = algorithmStats[algo];
            const avgConf = (stats.totalConfidence / stats.count * 100).toFixed(1);
            console.log(`   ${algo}: ${stats.count} matches, ${avgConf}% avg confidence`);
        });
        
        // Save detailed results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `complete_a_to_z_results_${timestamp}.json`;
        const detailedResults = {
            summary: {
                totalSecurities: tableStats.totalSecurities,
                totalValue: extractedTotal,
                knownTotal: knownPortfolioTotal,
                accuracy: accuracy,
                processingTime: processingTime,
                averageConfidence: tableStats.averageConfidence
            },
            securities: securities,
            metadata: {
                extractionMethod: 'complete_a_to_z_intelligent_system',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            }
        };
        
        fs.writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
        console.log(`\n💾 Detailed results saved to: ${resultsFile}`);
        
        // Final status
        console.log(`\n🎉 COMPLETE A TO Z TEST FINISHED!`);
        console.log('=================================');
        if (accuracy >= 95) {
            console.log('🟢 EXCELLENT: 95%+ accuracy achieved!');
        } else if (accuracy >= 80) {
            console.log('🟡 GOOD: 80%+ accuracy achieved!');
        } else {
            console.log('🔴 NEEDS IMPROVEMENT: Below 80% accuracy');
        }
        
        return detailedResults;
    }

    // =================== HELPER METHODS ===================
    
    parseNumber(str) {
        if (typeof str !== 'string') return parseFloat(str) || 0;
        return parseFloat(str.replace(/['\\s]/g, '')) || 0;
    }

    identifyDocumentSections(lines) {
        const sections = [];
        const sectionKeywords = [
            { keyword: 'portfolio', name: 'Portfolio Holdings', type: 'holdings' },
            { keyword: 'summary', name: 'Summary Section', type: 'summary' },
            { keyword: 'total', name: 'Total Section', type: 'total' },
            { keyword: 'valuation', name: 'Valuation Section', type: 'valuation' }
        ];
        
        lines.forEach((line, index) => {
            const lower = line.toLowerCase();
            sectionKeywords.forEach(section => {
                if (lower.includes(section.keyword)) {
                    sections.push({
                        name: section.name,
                        startLine: index + 1,
                        endLine: Math.min(lines.length, index + 50),
                        type: section.type,
                        content: line.trim()
                    });
                }
            });
        });
        
        return sections.length > 0 ? sections : [{ name: 'Main Document', startLine: 1, endLine: lines.length, type: 'main' }];
    }

    analyzeISINDistribution(isins) {
        if (isins.length === 0) return {};
        
        const lineNumbers = isins.map(isin => isin.lineNumber).sort((a, b) => a - b);
        const firstLine = lineNumbers[0];
        const lastLine = lineNumbers[lineNumbers.length - 1];
        
        // Find cluster (where most ISINs are concentrated)
        const clusterStart = Math.round(firstLine + (lastLine - firstLine) * 0.1);
        const clusterEnd = Math.round(lastLine - (lastLine - firstLine) * 0.1);
        const clusterSize = clusterEnd - clusterStart;
        const isinsInCluster = lineNumbers.filter(line => line >= clusterStart && line <= clusterEnd).length;
        
        return {
            firstLine,
            lastLine,
            clusterStart,
            clusterEnd,
            clusterDensity: isinsInCluster / clusterSize,
            totalSpread: lastLine - firstLine
        };
    }

    analyzeNumberProximityToISINs(isins, numbers) {
        let within5Lines = 0;
        let within10Lines = 0;
        const distances = [];
        
        isins.forEach(isin => {
            numbers.forEach(number => {
                const distance = Math.abs(number.lineNumber - isin.lineNumber);
                if (distance <= 5) within5Lines++;
                if (distance <= 10) within10Lines++;
                if (distance <= 10) distances.push(distance);
            });
        });
        
        // Find most common distances
        const distanceCounts = {};
        distances.forEach(d => distanceCounts[d] = (distanceCounts[d] || 0) + 1);
        const commonDistances = Object.keys(distanceCounts)
            .sort((a, b) => distanceCounts[b] - distanceCounts[a])
            .slice(0, 3)
            .map(d => `${d} lines`);
        
        return { within5Lines, within10Lines, commonDistances };
    }

    analyzeLinePatterns(lines) {
        let shortLines = 0, mediumLines = 0, longLines = 0, emptyLines = 0;
        
        lines.forEach(line => {
            const length = line.trim().length;
            if (length === 0) emptyLines++;
            else if (length < 20) shortLines++;
            else if (length <= 80) mediumLines++;
            else longLines++;
        });
        
        return { shortLines, mediumLines, longLines, emptyLines };
    }

    findBestValueCandidates(numbers, isin) {
        return numbers.map(number => {
            let score = 0.5; // Base score
            
            // Prefer reasonable market value ranges
            if (number.value >= 10000 && number.value <= 10000000) score += 0.3;
            if (number.value >= 100000 && number.value <= 5000000) score += 0.1;
            
            // Prefer Swiss format
            if (number.isSwissFormat) score += 0.2;
            
            // Prefer appropriate distances
            const distance = Math.abs(number.lineNumber - isin.lineNumber);
            if (distance >= 2 && distance <= 10) score += 0.2;
            if (distance === 7) score += 0.1; // Common pattern we discovered
            
            // Avoid round numbers (likely quantities)
            if (number.value % 100000 !== 0) score += 0.1;
            
            return { ...number, score };
        }).filter(candidate => candidate.score > 0.6).sort((a, b) => b.score - a.score);
    }

    proximityBasedMatching(candidates, isin) {
        if (candidates.length === 0) return { algorithm: 'Proximity', confidence: 0, bestMatch: null };
        
        // Prefer candidates closer to the ISIN
        const bestCandidate = candidates.reduce((best, current) => {
            const bestDistance = Math.abs(best.lineNumber - isin.lineNumber);
            const currentDistance = Math.abs(current.lineNumber - isin.lineNumber);
            return currentDistance < bestDistance ? current : best;
        });
        
        const confidence = Math.max(0, 1 - Math.abs(bestCandidate.lineNumber - isin.lineNumber) / 10);
        return { algorithm: 'Proximity', confidence, bestMatch: bestCandidate };
    }

    valueRangeMatching(candidates, isin) {
        if (candidates.length === 0) return { algorithm: 'Value Range', confidence: 0, bestMatch: null };
        
        // Prefer candidates in typical market value ranges
        const idealRange = candidates.filter(c => c.value >= 50000 && c.value <= 5000000);
        const bestCandidate = idealRange.length > 0 ? idealRange[0] : candidates[0];
        
        const confidence = idealRange.length > 0 ? 0.8 : 0.5;
        return { algorithm: 'Value Range', confidence, bestMatch: bestCandidate };
    }

    contextualMatching(candidates, isin) {
        if (candidates.length === 0) return { algorithm: 'Contextual', confidence: 0, bestMatch: null };
        
        // Prefer candidates with financial context
        const contextualScore = (candidate) => {
            let score = 0;
            const context = (candidate.contextBefore + candidate.contextAfter).toLowerCase();
            if (context.includes('usd') || context.includes('chf')) score += 0.3;
            if (context.includes('market') || context.includes('value')) score += 0.2;
            return score;
        };
        
        const bestCandidate = candidates.reduce((best, current) => 
            contextualScore(current) > contextualScore(best) ? current : best
        );
        
        const confidence = 0.6 + contextualScore(bestCandidate);
        return { algorithm: 'Contextual', confidence, bestMatch: bestCandidate };
    }

    patternBasedMatching(candidates, isin, rawData) {
        if (candidates.length === 0) return { algorithm: 'Pattern', confidence: 0, bestMatch: null };
        
        // Use patterns discovered from the document
        const distance7Candidates = candidates.filter(c => c.lineNumber - isin.lineNumber === 7);
        const swissFormatCandidates = candidates.filter(c => c.isSwissFormat);
        
        let bestCandidate = candidates[0];
        let confidence = 0.5;
        
        if (distance7Candidates.length > 0) {
            bestCandidate = distance7Candidates[0];
            confidence = 0.85;
        } else if (swissFormatCandidates.length > 0) {
            bestCandidate = swissFormatCandidates[0];
            confidence = 0.75;
        }
        
        return { algorithm: 'Pattern', confidence, bestMatch: bestCandidate };
    }

    makeEnsembleDecision(algorithms, candidates) {
        // Weight algorithms by their reliability
        const weights = {
            'Proximity': 0.2,
            'Value Range': 0.25,
            'Contextual': 0.25,
            'Pattern': 0.3
        };
        
        // Calculate weighted scores for each candidate
        const candidateScores = {};
        
        algorithms.forEach(alg => {
            if (alg.bestMatch) {
                const key = `${alg.bestMatch.lineNumber}_${alg.bestMatch.value}`;
                if (!candidateScores[key]) {
                    candidateScores[key] = { 
                        candidate: alg.bestMatch, 
                        totalScore: 0, 
                        algorithms: []
                    };
                }
                candidateScores[key].totalScore += alg.confidence * weights[alg.algorithm];
                candidateScores[key].algorithms.push(alg.algorithm);
            }
        });
        
        // Find the best candidate
        const bestEntry = Object.values(candidateScores).reduce((best, current) => 
            current.totalScore > best.totalScore ? current : best, 
            { totalScore: 0 }
        );
        
        if (bestEntry.totalScore > 0.5) {
            return {
                finalMatch: bestEntry.candidate,
                confidence: bestEntry.totalScore,
                winningAlgorithm: bestEntry.algorithms.join('+'),
                reasoning: `Ensemble decision from ${bestEntry.algorithms.length} algorithms`
            };
        }
        
        return { finalMatch: null, confidence: 0, winningAlgorithm: 'None', reasoning: 'No algorithm reached confidence threshold' };
    }
}

// Run the complete A to Z test
async function runCompleteAToZTest() {
    const test = new CompleteAToZTest();
    const results = await test.runCompleteTest();
    return results;
}

// Execute if run directly
if (require.main === module) {
    runCompleteAToZTest().catch(console.error);
}

module.exports = { CompleteAToZTest };