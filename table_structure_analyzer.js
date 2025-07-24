/**
 * TABLE STRUCTURE ANALYZER
 * Properly analyze the table structure to find MARKET VALUES, not quantities
 * Based on the user's feedback that USD200'000 is quantity, not valuation
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class TableStructureAnalyzer {
    constructor() {
        console.log('📊 TABLE STRUCTURE ANALYZER');
        console.log('🎯 Goal: Find actual MARKET VALUES in table, not quantities');
        console.log('🔍 Analyzing table columns and structure');
    }

    async analyzePDF(pdfBuffer) {
        console.log('\n📊 ANALYZING TABLE STRUCTURE');
        console.log('============================');
        console.log('🔍 Looking for actual market values, not quantities\n');
        
        try {
            const pdfData = await pdf(pdfBuffer);
            const text = pdfData.text;
            
            // Find all ISINs and their complete line context
            const isinLines = this.findISINLines(text);
            console.log(`🏦 Found ${isinLines.length} ISIN lines\n`);
            
            // Analyze each ISIN line to understand table structure
            for (let i = 0; i < Math.min(5, isinLines.length); i++) {
                const isinLine = isinLines[i];
                console.log(`📋 ANALYZING ISIN ${i+1}: ${isinLine.isin}`);
                console.log(`Line ${isinLine.lineNumber}: "${isinLine.content}"`);
                
                // Parse the line structure
                const structure = this.parseLineStructure(isinLine);
                console.log(`🔢 Numbers found: ${structure.numbers.length}`);
                
                structure.numbers.forEach((num, idx) => {
                    console.log(`   ${idx+1}. ${num.raw} = ${num.value.toLocaleString()} (${num.type})`);
                });
                
                // Try to identify which number is the market value
                const marketValue = this.identifyMarketValue(structure);
                if (marketValue) {
                    console.log(`💰 LIKELY MARKET VALUE: ${marketValue.value.toLocaleString()}`);
                    console.log(`📝 Reasoning: ${marketValue.reasoning}`);
                } else {
                    console.log(`❌ Could not identify market value`);
                }
                
                console.log('');
            }
            
            // Now analyze the full document pattern
            console.log('\n🔄 ANALYZING COMPLETE PATTERN...\n');
            const securities = [];
            
            for (const isinLine of isinLines) {
                const structure = this.parseLineStructure(isinLine);
                const marketValue = this.identifyMarketValue(structure);
                
                if (marketValue) {
                    securities.push({
                        isin: isinLine.isin,
                        value: marketValue.value,
                        reasoning: marketValue.reasoning,
                        line: isinLine.lineNumber,
                        allNumbers: structure.numbers.map(n => n.value)
                    });
                }
            }
            
            const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
            console.log(`✅ PATTERN ANALYSIS COMPLETE`);
            console.log(`📊 Securities with market values: ${securities.length}`);
            console.log(`💰 Total market value: ${totalValue.toLocaleString()}`);
            
            // Compare with known portfolio total
            const knownTotal = 19464431;
            const accuracy = (Math.min(totalValue, knownTotal) / Math.max(totalValue, knownTotal)) * 100;
            console.log(`🎯 Known portfolio total: ${knownTotal.toLocaleString()}`);
            console.log(`📈 Accuracy: ${accuracy.toFixed(2)}%`);
            
            // Show all securities found
            console.log('\n📋 ALL SECURITIES WITH MARKET VALUES:');
            securities.forEach((sec, i) => {
                console.log(`${i+1}. ${sec.isin}: ${sec.value.toLocaleString()}`);
                console.log(`   Line ${sec.line} | ${sec.reasoning}`);
                console.log(`   All numbers: [${sec.allNumbers.map(n => n.toLocaleString()).join(', ')}]`);
            });
            
            return {
                success: true,
                securities: securities,
                totalValue: totalValue,
                accuracy: accuracy,
                analysis: 'table_structure_analysis'
            };
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find all lines containing ISINs
     */
    findISINLines(text) {
        const lines = text.split('\n');
        const isinLines = [];
        
        lines.forEach((line, index) => {
            const isinMatch = line.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
            if (isinMatch) {
                isinLines.push({
                    isin: isinMatch[1],
                    content: line.trim(),
                    lineNumber: index + 1,
                    originalLine: line
                });
            }
        });
        
        return isinLines;
    }

    /**
     * Parse the structure of a line containing an ISIN
     */
    parseLineStructure(isinLine) {
        const content = isinLine.content;
        const numbers = [];
        
        // Find all numbers in the line
        const numberRegex = /\b(\d{1,10}(?:[',\s]\d{3})*(?:\.\d{1,6})?)\b/g;
        let match;
        
        while ((match = numberRegex.exec(content)) !== null) {
            const raw = match[1];
            const value = this.parseNumber(raw);
            const position = match.index;
            
            // Get context around the number
            const before = content.substring(Math.max(0, position - 20), position);
            const after = content.substring(position + raw.length, Math.min(content.length, position + raw.length + 20));
            
            // Classify the number type
            const type = this.classifyNumber(raw, value, before, after);
            
            numbers.push({
                raw: raw,
                value: value,
                position: position,
                before: before,
                after: after,
                type: type
            });
        }
        
        return {
            isin: isinLine.isin,
            content: content,
            numbers: numbers
        };
    }

    /**
     * Classify what type of number this might be
     */
    classifyNumber(raw, value, before, after) {
        const context = (before + after).toLowerCase();
        
        // Price-like (usually around 100, with decimals)
        if (value > 50 && value < 150 && raw.includes('.')) {
            return 'price';
        }
        
        // Percentage (usually small decimals or has % nearby)
        if (value < 50 && (raw.includes('.') || context.includes('%'))) {
            return 'percentage';
        }
        
        // Date-like (4 digits around 2000-2040)
        if (value >= 2000 && value <= 2040 && raw.length === 4) {
            return 'year';
        }
        
        // Quantity/Nominal (medium numbers, often with USD before)
        if (value >= 10000 && value <= 10000000 && before.toLowerCase().includes('usd')) {
            return 'quantity';
        }
        
        // Large market value (big numbers, often at end of line)
        if (value >= 10000 && value <= 50000000) {
            return 'market_value_candidate';
        }
        
        // Small numbers (could be anything)
        if (value < 10000) {
            return 'small_number';
        }
        
        return 'unknown';
    }

    /**
     * Try to identify which number is the market value
     */
    identifyMarketValue(structure) {
        const marketValueCandidates = structure.numbers.filter(n => 
            n.type === 'market_value_candidate' && n.value >= 1000 && n.value <= 15000000
        );
        
        if (marketValueCandidates.length === 0) {
            return null;
        }
        
        // If there's only one candidate, use it
        if (marketValueCandidates.length === 1) {
            return {
                value: marketValueCandidates[0].value,
                reasoning: `Only market value candidate: ${marketValueCandidates[0].raw}`
            };
        }
        
        // Multiple candidates - choose the largest one (often the market value)
        const largest = marketValueCandidates.reduce((max, current) => 
            current.value > max.value ? current : max
        );
        
        return {
            value: largest.value,
            reasoning: `Largest of ${marketValueCandidates.length} candidates: ${largest.raw}`
        };
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

module.exports = { TableStructureAnalyzer };

// Test the table structure analyzer
async function testTableAnalysis() {
    console.log('📊 TESTING TABLE STRUCTURE ANALYZER');
    console.log('🎯 Goal: Find actual market values, not quantities');
    console.log('=' * 50);
    
    const analyzer = new TableStructureAnalyzer();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const results = await analyzer.analyzePDF(pdfBuffer);
    
    if (results.success) {
        console.log('\n🎉 TABLE ANALYSIS COMPLETE!');
        console.log('===========================');
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `table_structure_analysis_${timestamp}.json`;
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
    testTableAnalysis().catch(console.error);
}