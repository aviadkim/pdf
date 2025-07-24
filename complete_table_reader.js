/**
 * COMPLETE TABLE READER
 * Read the full table structure to understand where the actual market values are
 * Each security spans multiple lines - need to find the complete pattern
 * Based on user feedback: "continue reading the table" - there's more after quantities
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class CompleteTableReader {
    constructor() {
        console.log('📊 COMPLETE TABLE READER');
        console.log('🎯 Analyze complete table structure for each security');
        console.log('📋 Read FULL table rows, not just ISIN context');
    }

    async readTablePDF(pdfBuffer) {
        console.log('\n📊 READING COMPLETE TABLE STRUCTURE');
        console.log('================================');
        console.log('🔍 Analyzing full table rows for each security\n');
        
        try {
            const pdfData = await pdf(pdfBuffer);
            const text = pdfData.text;
            const lines = text.split('\n');
            
            // Find all securities with their complete table data
            const securities = this.extractCompleteSecurityData(lines);
            console.log(`🏦 Found ${securities.length} securities with complete data\n`);
            
            // Show detailed analysis for first few securities
            for (let i = 0; i < Math.min(3, securities.length); i++) {
                const security = securities[i];
                console.log(`📋 COMPLETE TABLE ANALYSIS ${i+1}: ${security.isin}`);
                console.log(`Lines ${security.startLine} to ${security.endLine}:`);
                
                security.allLines.forEach((line, idx) => {
                    console.log(`   ${security.startLine + idx}: "${line}"`);
                });
                
                console.log('\n🔢 ALL NUMBERS IN THIS SECURITY:');
                security.allNumbers.forEach((num, idx) => {
                    console.log(`   ${idx+1}. ${num.value.toLocaleString()} (${num.type}) - Line ${num.line}: "${num.context}"`);
                });
                
                const marketValue = this.identifyMarketValueFromCompleteData(security);
                if (marketValue) {
                    console.log(`💰 MARKET VALUE: ${marketValue.value.toLocaleString()}`);
                    console.log(`📝 ${marketValue.reasoning}`);
                } else {
                    console.log(`❌ No market value identified`);
                }
                
                console.log('\n' + '='.repeat(100) + '\n');
            }
            
            // Process all securities to find market values
            const processedSecurities = [];
            
            for (const security of securities) {
                const marketValue = this.identifyMarketValueFromCompleteData(security);
                
                if (marketValue) {
                    processedSecurities.push({
                        isin: security.isin,
                        value: marketValue.value,
                        reasoning: marketValue.reasoning,
                        startLine: security.startLine,
                        endLine: security.endLine,
                        valueLine: marketValue.line,
                        allNumbers: security.allNumbers.length
                    });
                }
            }
            
            const totalValue = processedSecurities.reduce((sum, s) => sum + s.value, 0);
            console.log(`✅ COMPLETE TABLE READING FINISHED`);
            console.log(`📊 Securities with market values: ${processedSecurities.length}`);
            console.log(`💰 Total market value: ${totalValue.toLocaleString()}`);
            
            // Compare with known total
            const knownTotal = 19464431;
            const accuracy = (Math.min(totalValue, knownTotal) / Math.max(totalValue, knownTotal)) * 100;
            console.log(`🎯 Known portfolio total: ${knownTotal.toLocaleString()}`);
            console.log(`📈 Accuracy: ${accuracy.toFixed(2)}%`);
            
            // Show summary
            console.log('\n📋 ALL SECURITIES WITH COMPLETE TABLE ANALYSIS:');
            processedSecurities.forEach((sec, i) => {
                console.log(`${i+1}. ${sec.isin}: ${sec.value.toLocaleString()}`);
                console.log(`   Table: Lines ${sec.startLine}-${sec.endLine}, Value: Line ${sec.valueLine}`);
                console.log(`   ${sec.reasoning}`);
                console.log('');
            });
            
            return {
                success: true,
                securities: processedSecurities,
                totalValue: totalValue,
                accuracy: accuracy,
                method: 'complete_table_reading'
            };
            
        } catch (error) {
            console.error('❌ Table reading failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extract complete security data including full table rows
     */
    extractCompleteSecurityData(lines) {
        const securities = [];
        
        // Find all lines with ISINs
        const isinLines = [];
        lines.forEach((line, index) => {
            const isinMatch = line.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
            if (isinMatch) {
                isinLines.push({
                    isin: isinMatch[1],
                    lineIndex: index,
                    content: line.trim()
                });
            }
        });
        
        // For each ISIN, find the complete table data
        for (let i = 0; i < isinLines.length; i++) {
            const isinLine = isinLines[i];
            const nextIsinLine = isinLines[i + 1];
            
            // Determine the range of lines that belong to this security
            const startLine = Math.max(0, isinLine.lineIndex - 5); // Go back to find start
            const endLine = nextIsinLine ? 
                Math.min(nextIsinLine.lineIndex - 1, isinLine.lineIndex + 10) : 
                Math.min(lines.length - 1, isinLine.lineIndex + 10);
            
            // Extract all lines for this security
            const securityLines = [];
            for (let lineIdx = startLine; lineIdx <= endLine; lineIdx++) {
                securityLines.push(lines[lineIdx].trim());
            }
            
            // Extract all numbers from all lines for this security
            const allNumbers = this.extractAllNumbersFromLines(securityLines, startLine);
            
            securities.push({
                isin: isinLine.isin,
                startLine: startLine + 1,
                endLine: endLine + 1,
                isinLine: isinLine.lineIndex + 1,
                allLines: securityLines,
                allNumbers: allNumbers
            });
        }
        
        return securities;
    }

    /**
     * Extract all numbers from all lines with classification
     */
    extractAllNumbersFromLines(lines, startLineIndex) {
        const allNumbers = [];
        
        lines.forEach((line, relativeIndex) => {
            const actualLineNumber = startLineIndex + relativeIndex + 1;
            const numbers = this.extractNumbersFromSingleLine(line, actualLineNumber);
            allNumbers.push(...numbers);
        });
        
        return allNumbers;
    }

    /**
     * Extract numbers from a single line with detailed classification
     */
    extractNumbersFromSingleLine(line, lineNumber) {
        const numbers = [];
        const numberRegex = /\b(\d{1,10}(?:[',\s]\d{3})*(?:\.\d{1,6})?)\b/g;
        let match;
        
        while ((match = numberRegex.exec(line)) !== null) {
            const raw = match[1];
            const value = this.parseNumber(raw);
            const position = match.index;
            
            // Get context around the number
            const before = line.substring(Math.max(0, position - 20), position);
            const after = line.substring(position + raw.length, Math.min(line.length, position + raw.length + 20));
            
            const classification = this.classifyNumberInFullContext(raw, value, before, after, line);
            
            numbers.push({
                raw: raw,
                value: value,
                line: lineNumber,
                position: position,
                before: before,
                after: after,
                context: line,
                type: classification.type,
                confidence: classification.confidence,
                reasoning: classification.reasoning
            });
        }
        
        return numbers;
    }

    /**
     * Classify numbers with detailed analysis
     */
    classifyNumberInFullContext(raw, value, before, after, line) {
        const context = (before + after).toLowerCase();
        const fullLine = line.toLowerCase();
        
        // High confidence classifications
        
        // 1. Valor numbers (unique identifiers)
        if (before.includes('Valorn') || before.includes('valorn')) {
            return { type: 'valor_number', confidence: 0.95, reasoning: 'Valor number identifier' };
        }
        
        // 2. Quantities (USD prefixed amounts)
        if (before.toLowerCase().includes('usd') && value >= 1000) {
            return { type: 'quantity', confidence: 0.9, reasoning: 'USD prefixed quantity' };
        }
        
        // 3. Years
        if (value >= 2000 && value <= 2040 && raw.length === 4) {
            return { type: 'year', confidence: 0.9, reasoning: 'Year format' };
        }
        
        // 4. Percentages
        if (value < 100 && (context.includes('%') || raw.includes('.') && value < 50)) {
            return { type: 'percentage', confidence: 0.85, reasoning: 'Percentage format or small decimal' };
        }
        
        // 5. Prices (around 100)
        if (value > 80 && value < 120 && raw.includes('.')) {
            return { type: 'price', confidence: 0.8, reasoning: 'Price-like value around 100' };
        }
        
        // Medium confidence classifications
        
        // 6. Market value candidates (large numbers in reasonable range)
        if (value >= 10000 && value <= 50000000) {
            // Higher confidence if it's at the end of line or in specific contexts
            const isEndOfLine = (raw.length + before.length) / line.length > 0.7;
            const hasMarketContext = fullLine.includes('market') || fullLine.includes('value') || fullLine.includes('countervalue');
            
            let confidence = 0.6;
            if (isEndOfLine) confidence += 0.1;
            if (hasMarketContext) confidence += 0.2;
            
            return { 
                type: 'market_value_candidate', 
                confidence: confidence, 
                reasoning: `Large number (${value.toLocaleString()}) ${isEndOfLine ? 'at line end' : ''} ${hasMarketContext ? 'with market context' : ''}` 
            };
        }
        
        // 7. Other large numbers
        if (value >= 1000) {
            return { type: 'large_number', confidence: 0.4, reasoning: 'Large number without specific context' };
        }
        
        // Low confidence
        return { type: 'small_number', confidence: 0.2, reasoning: 'Small or unclassified number' };
    }

    /**
     * Identify market value from complete security data
     */
    identifyMarketValueFromCompleteData(security) {
        // Strategy 1: Look for high-confidence market value candidates
        const marketValueCandidates = security.allNumbers.filter(n => 
            n.type === 'market_value_candidate' && 
            n.confidence > 0.7 &&
            n.value >= 1000 && 
            n.value <= 15000000
        );
        
        if (marketValueCandidates.length > 0) {
            // Choose the one with highest confidence, or largest if tied
            const best = marketValueCandidates.reduce((best, current) => {
                if (current.confidence > best.confidence) return current;
                if (current.confidence === best.confidence && current.value > best.value) return current;
                return best;
            });
            
            return {
                value: best.value,
                line: best.line,
                reasoning: `High-confidence market value: ${best.reasoning}`
            };
        }
        
        // Strategy 2: Look for any market value candidates
        const anyMarketCandidates = security.allNumbers.filter(n => 
            n.type === 'market_value_candidate' &&
            n.value >= 1000 && 
            n.value <= 15000000
        );
        
        if (anyMarketCandidates.length > 0) {
            const largest = anyMarketCandidates.reduce((max, current) => 
                current.value > max.value ? current : max
            );
            
            return {
                value: largest.value,
                line: largest.line,
                reasoning: `Market value candidate: ${largest.reasoning}`
            };
        }
        
        // Strategy 3: Look for large numbers excluding quantities and valor numbers
        const otherLargeNumbers = security.allNumbers.filter(n => 
            n.type !== 'quantity' && 
            n.type !== 'valor_number' && 
            n.type !== 'year' &&
            n.value >= 1000 && 
            n.value <= 15000000
        );
        
        if (otherLargeNumbers.length > 0) {
            const largest = otherLargeNumbers.reduce((max, current) => 
                current.value > max.value ? current : max
            );
            
            return {
                value: largest.value,
                line: largest.line,
                reasoning: `Largest non-quantity number: ${largest.reasoning}`
            };
        }
        
        return null;
    }

    /**
     * Parse number handling Swiss format
     */
    parseNumber(str) {
        if (typeof str !== 'string') return parseFloat(str) || 0;
        return parseFloat(str.replace(/[''\s]/g, '')) || 0;
    }
}

module.exports = { CompleteTableReader };

// Test the complete table reader
async function testCompleteTableReading() {
    console.log('📊 TESTING COMPLETE TABLE READER');
    console.log('🎯 Analyze complete table structure');
    console.log('=' * 50);
    
    const reader = new CompleteTableReader();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const results = await reader.readTablePDF(pdfBuffer);
    
    if (results.success) {
        console.log('\n🎉 COMPLETE TABLE READING COMPLETE!');
        console.log('==================================');
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `complete_table_reading_results_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${resultsFile}`);
        
        console.log('\n📈 COMPARISON WITH ALL PREVIOUS METHODS:');
        console.log('   Breakthrough System: 86.87%');
        console.log('   Smart Extraction: 3.24%');
        console.log('   True 100% System: 22.18%');
        console.log('   Multiline Analysis: 29.97%');
        console.log('   Concatenated Parser: 26.26%');
        console.log(`   🎯 Complete Table Reader: ${results.accuracy.toFixed(2)}%`);
        
        return results;
        
    } else {
        console.log('❌ Table reading failed:', results.error);
        return null;
    }
}

// Run test
if (require.main === module) {
    testCompleteTableReading().catch(console.error);
}