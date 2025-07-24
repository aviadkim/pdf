/**
 * CONCATENATED PARSER FOR MESSOS
 * Parse concatenated number formats like "100.1000106.9200737'748"
 * Pattern: Price + Factor + MarketValue
 * Goal: Extract the actual market values (usually the last large number)
 */

const fs = require('fs');
const pdf = require('pdf-parse');

class ConcatenatedParser {
    constructor() {
        console.log('📊 CONCATENATED PARSER FOR MESSOS');
        console.log('🎯 Parse concatenated number formats correctly');
        console.log('📋 Pattern: Price + Factor + MarketValue');
    }

    async parsePDF(pdfBuffer) {
        console.log('\n📊 PARSING CONCATENATED NUMBER FORMATS');
        console.log('====================================');
        console.log('🔍 Looking for concatenated values like "100.1000106.9200737\'748"\n');
        
        try {
            const pdfData = await pdf(pdfBuffer);
            const text = pdfData.text;
            const lines = text.split('\n');
            
            // Find all ISIN contexts
            const isinContexts = this.findISINContexts(lines);
            console.log(`🏦 Found ${isinContexts.length} ISINs with context\n`);
            
            // Show first few examples of concatenated parsing
            for (let i = 0; i < Math.min(3, isinContexts.length); i++) {
                const context = isinContexts[i];
                console.log(`📋 PARSING EXAMPLE ${i+1}: ${context.isin}`);
                
                const concatenatedLines = this.findConcatenatedLines(context);
                if (concatenatedLines.length > 0) {
                    concatenatedLines.forEach(line => {
                        console.log(`📄 Concatenated line: "${line.content}"`);
                        const parsed = this.parseConcatenatedNumbers(line.content);
                        console.log(`🔢 Parsed values: [${parsed.map(v => v.toLocaleString()).join(', ')}]`);
                        
                        const marketValue = this.selectMarketValue(parsed);
                        if (marketValue) {
                            console.log(`💰 Market Value: ${marketValue.toLocaleString()}`);
                        }
                    });
                } else {
                    console.log(`❌ No concatenated lines found`);
                }
                console.log('');
            }
            
            // Process all ISINs
            const securities = [];
            
            for (const context of isinContexts) {
                const concatenatedLines = this.findConcatenatedLines(context);
                let marketValue = null;
                let reasoning = '';
                
                for (const line of concatenatedLines) {
                    const parsed = this.parseConcatenatedNumbers(line.content);
                    const value = this.selectMarketValue(parsed);
                    
                    if (value && value >= 1000 && value <= 15000000) {
                        marketValue = value;
                        reasoning = `Parsed from concatenated line: "${line.content}" -> ${parsed.map(v => v.toLocaleString()).join(', ')} -> selected ${value.toLocaleString()}`;
                        break;
                    }
                }
                
                // Fallback: look for regular patterns
                if (!marketValue) {
                    const fallback = this.findFallbackValue(context);
                    if (fallback) {
                        marketValue = fallback.value;
                        reasoning = fallback.reasoning;
                    }
                }
                
                if (marketValue) {
                    securities.push({
                        isin: context.isin,
                        value: marketValue,
                        reasoning: reasoning,
                        isinLine: context.lineNumber
                    });
                }
            }
            
            const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
            console.log(`✅ CONCATENATED PARSING COMPLETE`);
            console.log(`📊 Securities parsed: ${securities.length}`);
            console.log(`💰 Total market value: ${totalValue.toLocaleString()}`);
            
            // Compare with known total
            const knownTotal = 19464431;
            const accuracy = (Math.min(totalValue, knownTotal) / Math.max(totalValue, knownTotal)) * 100;
            console.log(`🎯 Known portfolio total: ${knownTotal.toLocaleString()}`);
            console.log(`📈 Accuracy: ${accuracy.toFixed(2)}%`);
            
            // Show all securities
            console.log('\n📋 ALL SECURITIES WITH PARSED VALUES:');
            securities.forEach((sec, i) => {
                console.log(`${i+1}. ${sec.isin}: ${sec.value.toLocaleString()}`);
                console.log(`   Line: ${sec.isinLine}`);
                console.log(`   ${sec.reasoning}`);
                console.log('');
            });
            
            return {
                success: true,
                securities: securities,
                totalValue: totalValue,
                accuracy: accuracy,
                method: 'concatenated_parsing'
            };
            
        } catch (error) {
            console.error('❌ Parsing failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find ISIN contexts
     */
    findISINContexts(lines) {
        const contexts = [];
        
        lines.forEach((line, index) => {
            const isinMatch = line.match(/\b([A-Z]{2}[A-Z0-9]{10})\b/);
            if (isinMatch) {
                const contextLines = [];
                for (let i = -2; i <= 4; i++) {
                    const lineIndex = index + i;
                    if (lineIndex >= 0 && lineIndex < lines.length) {
                        contextLines.push({
                            content: lines[lineIndex].trim(),
                            lineNumber: lineIndex + 1
                        });
                    }
                }
                
                contexts.push({
                    isin: isinMatch[1],
                    lineNumber: index + 1,
                    contextLines: contextLines
                });
            }
        });
        
        return contexts;
    }

    /**
     * Find lines with concatenated number formats
     */
    findConcatenatedLines(context) {
        const concatenatedLines = [];
        
        for (const line of context.contextLines) {
            // Look for patterns like "100.1000106.9200737'748"
            // Multiple numbers smashed together, often ending with Swiss format
            if (this.isConcatenatedNumberLine(line.content)) {
                concatenatedLines.push(line);
            }
        }
        
        return concatenatedLines;
    }

    /**
     * Check if a line contains concatenated numbers
     */
    isConcatenatedNumberLine(content) {
        // Patterns that suggest concatenated numbers:
        // 1. Multiple decimal points: 100.1000106.9200
        // 2. Numbers followed by apostrophe numbers: 737'748
        // 3. Long sequences of digits with minimal separators
        
        const patterns = [
            /\d{2,}\.\d{4,}\d{2,}\.\d{4,}/,  // Multiple decimals: 100.1000106.9200
            /\d{6,}'\d{3,}/,                   // Long number with apostrophe: 1000106'748
            /\d+\.\d{6,}'/,                    // Decimal followed by apostrophe: 106.9200737'
            /\d{3}\.\d{6,}\d{3,}/             // Pattern like 100.1000106748
        ];
        
        return patterns.some(pattern => pattern.test(content));
    }

    /**
     * Parse concatenated numbers into individual values
     */
    parseConcatenatedNumbers(content) {
        const values = [];
        
        // Strategy 1: Split on common boundaries
        // Look for pattern: price.factor.value'suffix or price.factorvalue'suffix
        
        // Pattern 1: 100.1000106.9200737'748
        let match = content.match(/(\d{2,3})\.(\d{4,})\.(\d{4,})(\d+)'(\d{3})/);
        if (match) {
            values.push(parseFloat(match[1])); // Price: 100
            values.push(parseFloat(match[2])); // Factor: 1000106
            const marketValue = parseFloat(match[3] + match[4]); // Market value: 9200737
            values.push(marketValue);
            // Also try the full last part with apostrophe
            const withApostrophe = parseFloat(match[3] + match[4] + match[5]); // 9200737748
            if (withApostrophe !== marketValue) {
                values.push(withApostrophe);
            }
            return values;
        }
        
        // Pattern 2: 100.1000100.10001'101'100
        match = content.match(/(\d{2,3})\.(\d{4,})\.(\d+)'(\d{3})'(\d{3})/);
        if (match) {
            values.push(parseFloat(match[1])); // Price: 100
            values.push(parseFloat(match[2])); // Factor: 1000100
            const part3 = parseFloat(match[3]); // 10001
            values.push(part3);
            const marketValue = parseFloat(match[4] + match[5]); // 101100 (from '101'100)
            values.push(marketValue);
            return values;
        }
        
        // Pattern 3: 100.200099.6285200'288
        match = content.match(/(\d{2,3})\.(\d{4,})(\d{2,})\.(\d{4})(\d+)'(\d{3})/);
        if (match) {
            values.push(parseFloat(match[1])); // Price: 100
            const factor = parseFloat(match[2] + '.' + match[4]); // 200099.6285
            values.push(factor);
            const marketValue = parseFloat(match[5] + match[6]); // Market value from last part
            values.push(marketValue);
            return values;
        }
        
        // Pattern 4: Simple apostrophe numbers like 737'748
        const apostropheNumbers = content.match(/\d+'\d{3}/g);
        if (apostropheNumbers) {
            apostropheNumbers.forEach(num => {
                values.push(parseFloat(num.replace("'", "")));
            });
        }
        
        // Pattern 5: Extract all reasonable numbers as fallback
        const allNumbers = content.match(/\d{4,}/g);
        if (allNumbers && values.length === 0) {
            allNumbers.forEach(num => {
                const value = parseFloat(num);
                if (value >= 1000) {
                    values.push(value);
                }
            });
        }
        
        return values;
    }

    /**
     * Select the most likely market value from parsed numbers
     */
    selectMarketValue(values) {
        if (values.length === 0) return null;
        
        // Filter to reasonable market value range
        const candidates = values.filter(v => v >= 1000 && v <= 15000000);
        
        if (candidates.length === 0) return null;
        if (candidates.length === 1) return candidates[0];
        
        // Multiple candidates: prefer the largest (often the market value)
        // But exclude obvious outliers (>10M)
        const reasonable = candidates.filter(v => v <= 10000000);
        if (reasonable.length > 0) {
            return Math.max(...reasonable);
        }
        
        return Math.max(...candidates);
    }

    /**
     * Fallback value detection for non-concatenated patterns
     */
    findFallbackValue(context) {
        for (const line of context.contextLines) {
            const content = line.content;
            
            // Look for Swiss format numbers
            const swissMatch = content.match(/(\d{1,3}(?:'\d{3})+)/);
            if (swissMatch) {
                const value = parseFloat(swissMatch[1].replace(/'/g, ''));
                if (value >= 1000 && value <= 15000000) {
                    return {
                        value: value,
                        reasoning: `Swiss format number: ${swissMatch[1]} from line "${content}"`
                    };
                }
            }
            
            // Look for large isolated numbers
            const largeNumbers = content.match(/\b(\d{4,})\b/g);
            if (largeNumbers) {
                for (const num of largeNumbers) {
                    const value = parseFloat(num);
                    if (value >= 10000 && value <= 15000000) {
                        return {
                            value: value,
                            reasoning: `Large number: ${num} from line "${content}"`
                        };
                    }
                }
            }
        }
        
        return null;
    }
}

module.exports = { ConcatenatedParser };

// Test the concatenated parser
async function testConcatenatedParsing() {
    console.log('📊 TESTING CONCATENATED PARSER');
    console.log('🎯 Parse concatenated number formats correctly');
    console.log('=' * 50);
    
    const parser = new ConcatenatedParser();
    const pdfPath = '2. Messos  - 31.03.2025.pdf';
    
    if (!fs.existsSync(pdfPath)) {
        console.log('❌ PDF not found');
        return;
    }
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const results = await parser.parsePDF(pdfBuffer);
    
    if (results.success) {
        console.log('\n🎉 CONCATENATED PARSING COMPLETE!');
        console.log('================================');
        
        // Save results
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const resultsFile = `concatenated_parsing_results_${timestamp}.json`;
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${resultsFile}`);
        
        console.log('\n📈 COMPARISON WITH PREVIOUS METHODS:');
        console.log('   Breakthrough System: 86.87%');
        console.log('   Smart Extraction: 3.24%');
        console.log('   True 100% System: 22.18%');
        console.log('   Multiline Analysis: 29.97%');
        console.log(`   🎯 Concatenated Parser: ${results.accuracy.toFixed(2)}%`);
        
        return results;
        
    } else {
        console.log('❌ Parsing failed:', results.error);
        return null;
    }
}

// Run test
if (require.main === module) {
    testConcatenatedParsing().catch(console.error);
}