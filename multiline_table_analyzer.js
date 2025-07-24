/**
 * MULTILINE TABLE ANALYZER
 * Each security spans multiple lines - need to analyze the full context
 * Line 1: Quantities (USD200'000 etc)
 * Line 2: ISIN reference  
 * Line 3: Prices and MARKET VALUES
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class MultilineTableAnalyzer {
    constructor() {
        console.log('📊 MULTILINE TABLE ANALYZER');
        console.log('🎯 Analyzing multi-line table structure');
        console.log('📋 Each security spans multiple lines with different data');
    }

    async analyzePDF(pdfBuffer) {
        console.log('\n📊 ANALYZING MULTILINE TABLE STRUCTURE');
        console.log('====================================');
        console.log('🔍 Looking at multi-line context around each ISIN\n');
        
        try {
            const pdfData = await pdf(pdfBuffer);
            const text = pdfData.text;
            const lines = text.split('\n');
            
            // Find all ISIN positions with context
            const isinContexts = this.findISINContexts(lines);
            console.log(`🏦 Found ${isinContexts.length} ISINs with context\n`);
            
            // Analyze first few to understand pattern
            for (let i = 0; i < Math.min(5, isinContexts.length); i++) {
                const context = isinContexts[i];
                console.log(`📋 ANALYZING ISIN ${i+1}: ${context.isin}`);
                console.log(`Found at line ${context.lineNumber}`);
                
                // Show context lines
                console.log('📄 CONTEXT LINES:');
                context.contextLines.forEach((line, idx) => {
                    const lineNum = context.lineNumber - 3 + idx;
                    console.log(`   ${lineNum}: "${line}"`);
                });
                
                // Parse the multiline structure
                const structure = this.parseMultilineStructure(context);
                console.log('\n🔢 NUMBERS FOUND IN CONTEXT:');
                structure.allNumbers.forEach((num, idx) => {
                    console.log(`   ${idx+1}. ${num.raw} = ${num.value.toLocaleString()} (${num.type}) [Line ${num.lineIndex}]`);
                });
                
                // Try to identify market value
                const marketValue = this.identifyMarketValueFromContext(structure);
                if (marketValue) {
                    console.log(`💰 MARKET VALUE: ${marketValue.value.toLocaleString()}`);
                    console.log(`📝 Found on line ${marketValue.lineIndex}: ${marketValue.reasoning}`);
                } else {
                    console.log(`❌ No market value identified`);
                }
                
                console.log('\n' + '='.repeat(80) + '\n');
            }
            
            // Now process all ISINs
            console.log('🔄 PROCESSING ALL ISINs...\n');
            const securities = [];
            
            for (const context of isinContexts) {
                const structure = this.parseMultilineStructure(context);
                const marketValue = this.identifyMarketValueFromContext(structure);
                
                if (marketValue) {
                    securities.push({
                        isin: context.isin,
                        value: marketValue.value,
                        reasoning: marketValue.reasoning,
                        isinLine: context.lineNumber,
                        valueLine: context.lineNumber - 3 + marketValue.lineIndex,
                        quantity: this.findQuantity(structure),
                        allNumbers: structure.allNumbers.map(n => ({ value: n.value, type: n.type, line: n.lineIndex }))
                    });
                }
            }
            
            const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
            console.log(`✅ MULTILINE ANALYSIS COMPLETE`);
            console.log(`📊 Securities with market values: ${securities.length}`);
            console.log(`💰 Total market value: ${totalValue.toLocaleString()}`);
            
            // Compare with known total
            const knownTotal = 19464431;
            const accuracy = (Math.min(totalValue, knownTotal) / Math.max(totalValue, knownTotal)) * 100;
            console.log(`🎯 Known portfolio total: ${knownTotal.toLocaleString()}`);
            console.log(`📈 Accuracy: ${accuracy.toFixed(2)}%`);
            
            // Show all securities
            console.log('\n📋 ALL SECURITIES WITH MARKET VALUES:');
            securities.forEach((sec, i) => {
                console.log(`${i+1}. ${sec.isin}: ${sec.value.toLocaleString()}`);
                console.log(`   ISIN Line: ${sec.isinLine}, Value Line: ${sec.valueLine}`);
                console.log(`   Quantity: ${sec.quantity ? sec.quantity.toLocaleString() : 'Unknown'}`);
                console.log(`   Reasoning: ${sec.reasoning}`);
                console.log('');
            });
            
            return {
                success: true,
                securities: securities,
                totalValue: totalValue,
                accuracy: accuracy,
                analysis: 'multiline_table_analysis'
            };
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find all ISINs with their surrounding context lines
     */
    findISINContexts(lines) {
        const contexts = [];
        
        lines.forEach((line, index) => {
            const isinMatch = line.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
            if (isinMatch) {
                // Get context lines (3 before, current, 3 after)
                const contextLines = [];
                for (let i = -3; i <= 3; i++) {
                    const lineIndex = index + i;
                    if (lineIndex >= 0 && lineIndex < lines.length) {
                        contextLines.push(lines[lineIndex].trim());
                    } else {
                        contextLines.push('');
                    }
                }
                
                contexts.push({
                    isin: isinMatch[1],
                    lineNumber: index + 1,
                    contextLines: contextLines,
                    centerLineIndex: 3 // The ISIN line is at index 3 in the context
                });
            }
        });
        
        return contexts;
    }

    /**
     * Parse the multiline structure to find all numbers and their types
     */
    parseMultilineStructure(context) {
        const allNumbers = [];
        
        context.contextLines.forEach((line, lineIndex) => {
            const numbers = this.extractNumbersFromLine(line, lineIndex);
            allNumbers.push(...numbers);
        });
        
        return {
            isin: context.isin,
            contextLines: context.contextLines,
            allNumbers: allNumbers
        };
    }

    /**
     * Extract all numbers from a line with their classification
     */
    extractNumbersFromLine(line, lineIndex) {
        const numbers = [];
        const numberRegex = /\b(\d{1,10}(?:[',\s]\d{3})*(?:\.\d{1,6})?)\b/g;
        let match;
        
        while ((match = numberRegex.exec(line)) !== null) {
            const raw = match[1];
            const value = this.parseNumber(raw);
            const position = match.index;
            
            // Get context around the number
            const before = line.substring(Math.max(0, position - 15), position);
            const after = line.substring(position + raw.length, Math.min(line.length, position + raw.length + 15));
            
            const type = this.classifyNumberInContext(raw, value, before, after, line);
            
            numbers.push({
                raw: raw,
                value: value,
                position: position,
                before: before,
                after: after,
                type: type,
                lineIndex: lineIndex,
                fullLine: line
            });
        }
        
        return numbers;
    }

    /**
     * Classify number type based on context
     */
    classifyNumberInContext(raw, value, before, after, fullLine) {
        const context = (before + after).toLowerCase();
        const line = fullLine.toLowerCase();
        
        // Valor number (specific pattern)
        if (before.includes('Valorn') || before.includes('valorn')) {
            return 'valor_number';
        }
        
        // Year (4 digits, 2000-2040)
        if (value >= 2000 && value <= 2040 && raw.length === 4) {
            return 'year';
        }
        
        // Percentage (small numbers with % or decimal context)
        if (value < 50 && (context.includes('%') || raw.includes('.'))) {
            return 'percentage';
        }
        
        // Price (around 100, usually with decimals)
        if (value > 80 && value < 120 && raw.includes('.')) {
            return 'price';
        }
        
        // Quantity (with USD prefix, medium numbers)
        if (before.toLowerCase().includes('usd') && value >= 1000 && value <= 10000000) {
            return 'quantity';
        }
        
        // Large market value candidate (big numbers at end of lines)
        if (value >= 10000 && value <= 50000000) {
            // Check if it's likely a market value (at end of line, large number)
            const positionInLine = raw.length + before.length;
            const nearEndOfLine = (positionInLine / fullLine.length) > 0.6;
            
            if (nearEndOfLine) {
                return 'market_value_candidate';
            }
            
            return 'large_number';
        }
        
        // Small number
        if (value < 10000) {
            return 'small_number';
        }
        
        return 'unknown';
    }

    /**
     * Identify market value from the multiline context
     */
    identifyMarketValueFromContext(structure) {
        // Look for market value candidates
        const marketValueCandidates = structure.allNumbers.filter(n => 
            n.type === 'market_value_candidate' && 
            n.value >= 1000 && 
            n.value <= 15000000
        );
        
        if (marketValueCandidates.length === 0) {
            // Fallback: look for any large numbers
            const largeNumbers = structure.allNumbers.filter(n => 
                n.value >= 10000 && 
                n.value <= 15000000 &&
                n.type !== 'valor_number'
            );
            
            if (largeNumbers.length > 0) {
                const largest = largeNumbers.reduce((max, current) => 
                    current.value > max.value ? current : max
                );
                
                return {
                    value: largest.value,
                    lineIndex: largest.lineIndex,
                    reasoning: `Largest number (${largest.raw}) from line: "${largest.fullLine}"`
                };
            }
            
            return null;
        }
        
        // If multiple candidates, prefer the one that's more likely to be a market value
        if (marketValueCandidates.length > 1) {
            // Prefer numbers that are NOT on the quantity line (line with USD prefix)
            const nonQuantityCandidates = marketValueCandidates.filter(n => 
                !n.fullLine.toLowerCase().includes('usd') || n.type !== 'quantity'
            );
            
            if (nonQuantityCandidates.length > 0) {
                marketValueCandidates.splice(0, marketValueCandidates.length, ...nonQuantityCandidates);
            }
        }
        
        // Return the best candidate
        const best = marketValueCandidates[0];
        
        return {
            value: best.value,
            lineIndex: best.lineIndex,
            reasoning: `Market value candidate (${best.raw}) from line: "${best.fullLine}"`
        };
    }

    /**
     * Find the quantity from the context
     */
    findQuantity(structure) {
        const quantities = structure.allNumbers.filter(n => n.type === 'quantity');
        if (quantities.length > 0) {
            return quantities[0].value;
        }
        return null;
    }

    /**
     * Parse number handling Swiss format
     */
    parseNumber(str) {
        if (typeof str !== 'string') return parseFloat(str) || 0;
        
        // Remove apostrophes and spaces for Swiss format
        const cleaned = str.replace(/[''\s]/g, '');
        return parseFloat(cleaned) || 0;
    }
}

module.exports = { MultilineTableAnalyzer };

// Test the multiline analyzer
async function testMultilineAnalysis() {
    console.log('📊 TESTING MULTILINE TABLE ANALYZER');
    console.log('🎯 Analyzing multi-line table structure');
    console.log('=' * 50);
    
    const analyzer = new MultilineTableAnalyzer();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const results = await analyzer.analyzePDF(pdfBuffer);
    
    if (results.success) {
        console.log('\n🎉 MULTILINE ANALYSIS COMPLETE!');
        console.log('==============================');
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `multiline_table_analysis_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${resultsFile}`);
        
        return results;
        
    } else {
        console.log('❌ Analysis failed:', results.error);
        return null;
    }
}

// Run test
if (require.main === module) {
    testMultilineAnalysis().catch(console.error);
}