// Combined extraction - find all 40 securities with correct values
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Import the working enhanced extraction
const { extractSecuritiesEnhanced } = require('./enhanced-precision-v2.js');

// Combined extraction approach
async function extractAllSecuritiesWithValues(pdfPath) {
    console.log('🔍 Starting combined extraction approach...');
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;
    
    // First, get all securities with good values using enhanced method
    const enhancedSecurities = extractSecuritiesEnhanced(text);
    console.log(`\n✅ Enhanced method found ${enhancedSecurities.length} securities with good values`);
    
    // Create a map of known good values
    const knownValues = new Map();
    enhancedSecurities.forEach(s => {
        knownValues.set(s.isin, s);
    });
    
    // Now find ALL ISINs in the document
    const allISINs = findAllISINs(text);
    console.log(`\n🔍 Found ${allISINs.size} unique ISINs in document`);
    
    // For ISINs not in enhanced results, try to extract values
    const missingISINs = [];
    allISINs.forEach(isin => {
        if (!knownValues.has(isin)) {
            missingISINs.push(isin);
        }
    });
    
    console.log(`\n📊 Missing ${missingISINs.length} securities from enhanced extraction`);
    
    // Extract values for missing securities
    const additionalSecurities = extractMissingSecurities(text, missingISINs);
    
    // Combine results
    const allSecurities = [...enhancedSecurities];
    additionalSecurities.forEach(s => {
        if (!knownValues.has(s.isin)) {
            allSecurities.push(s);
        }
    });
    
    return allSecurities;
}

// Find all unique ISINs in the document
function findAllISINs(text) {
    const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
    const isins = new Set();
    
    const matches = text.matchAll(isinPattern);
    for (const match of matches) {
        isins.add(match[0]);
    }
    
    return isins;
}

// Extract values for missing securities
function extractMissingSecurities(text, missingISINs) {
    console.log('\n🔧 Extracting values for missing securities...');
    const securities = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const isin of missingISINs) {
        console.log(`\n🔍 Searching for ${isin}...`);
        
        // Find all occurrences of this ISIN
        const occurrences = [];
        lines.forEach((line, index) => {
            if (line.includes(isin)) {
                occurrences.push(index);
            }
        });
        
        console.log(`  Found in ${occurrences.length} locations`);
        
        // Try to extract value from each occurrence
        let bestValue = 0;
        let bestContext = '';
        
        for (const lineIndex of occurrences) {
            // Get wide context
            const contextStart = Math.max(0, lineIndex - 10);
            const contextEnd = Math.min(lines.length, lineIndex + 10);
            const contextLines = lines.slice(contextStart, contextEnd);
            const context = contextLines.join(' ');
            
            // Look for value in the same line first
            const sameLine = lines[lineIndex];
            let value = extractValueFromLine(sameLine, isin);
            
            // If not found, look in surrounding lines
            if (value === 0) {
                value = extractValueFromContext(contextLines, isin);
            }
            
            if (value > bestValue) {
                bestValue = value;
                bestContext = context;
            }
        }
        
        if (bestValue > 0) {
            securities.push({
                isin: isin,
                name: extractSecurityName(bestContext, isin),
                value: bestValue,
                currency: 'USD',
                extractionMethod: 'missing-recovery',
                context: bestContext.substring(0, 200)
            });
            console.log(`  ✅ Found value: $${bestValue.toLocaleString()}`);
        } else {
            console.log(`  ❌ No valid value found`);
        }
    }
    
    return securities;
}

// Extract value from a specific line
function extractValueFromLine(line, isin) {
    // Remove the ISIN to avoid matching it as a number
    const lineWithoutISIN = line.replace(isin, '');
    
    // Look for values in specific patterns
    const patterns = [
        // Value after ISIN: "XS123... 1'234'567"
        /(\d{1,3}(?:[']\d{3})*(?:\.\d+)?)\s*(?:USD|CHF)?/,
        // Value with currency: "1,234,567 USD"
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:USD|CHF)/,
        // Percentage and value: "2.5% 1'234'567"
        /\d+\.\d+%\s+(\d{1,3}(?:[']\d{3})*)/
    ];
    
    for (const pattern of patterns) {
        const match = lineWithoutISIN.match(pattern);
        if (match) {
            const value = parseFloat(match[1].replace(/[',]/g, ''));
            if (value >= 1000 && value <= 50000000) {
                return value;
            }
        }
    }
    
    return 0;
}

// Extract value from context lines
function extractValueFromContext(contextLines, isin) {
    // Find the line with the ISIN
    const isinLineIndex = contextLines.findIndex(line => line.includes(isin));
    if (isinLineIndex === -1) return 0;
    
    // Look for values in a structured way
    // Check lines after ISIN (common in tables)
    for (let i = isinLineIndex; i < Math.min(isinLineIndex + 5, contextLines.length); i++) {
        const line = contextLines[i];
        
        // Skip if it's another ISIN
        if (/[A-Z]{2}[A-Z0-9]{9}[0-9]/.test(line) && !line.includes(isin)) continue;
        
        // Look for standalone values
        const valueMatch = line.match(/^\s*(\d{1,3}(?:[']\d{3})*(?:\.\d+)?)\s*$/);
        if (valueMatch) {
            const value = parseFloat(valueMatch[1].replace(/[',]/g, ''));
            if (value >= 1000 && value <= 50000000) {
                return value;
            }
        }
        
        // Look for values with indicators
        if (line.includes('CHF') || line.includes('USD') || line.includes('Value') || line.includes('%')) {
            const numbers = line.match(/(\d{1,3}(?:[']\d{3})*(?:\.\d+)?)/g);
            if (numbers) {
                for (const num of numbers) {
                    const value = parseFloat(num.replace(/[',]/g, ''));
                    if (value >= 1000 && value <= 50000000) {
                        return value;
                    }
                }
            }
        }
    }
    
    return 0;
}

// Extract security name
function extractSecurityName(context, isin) {
    const lines = context.split(/\s+/);
    const isinIndex = lines.findIndex(part => part.includes(isin));
    
    if (isinIndex >= 0 && isinIndex < lines.length - 1) {
        // Look for name after ISIN
        const nameParts = [];
        for (let i = isinIndex + 1; i < Math.min(isinIndex + 10, lines.length); i++) {
            const part = lines[i];
            // Stop at numbers or special characters
            if (/^\d/.test(part) || /^[%$]/.test(part)) break;
            if (part.length > 2) {
                nameParts.push(part);
            }
            if (nameParts.length >= 5) break;
        }
        return nameParts.join(' ');
    }
    
    return '';
}

// Test the combined approach
async function testCombinedExtraction() {
    try {
        console.log('=== TESTING COMBINED EXTRACTION ===');
        
        const securities = await extractAllSecuritiesWithValues('2. Messos  - 31.03.2025.pdf');
        
        // Sort by value
        securities.sort((a, b) => b.value - a.value);
        
        console.log('\n=== FINAL RESULTS ===');
        console.log(`Securities found: ${securities.length}`);
        
        const total = securities.reduce((sum, s) => sum + s.value, 0);
        console.log(`Total: $${total.toLocaleString()}`);
        console.log(`Expected: $19,464,431`);
        
        const accuracy = Math.min(total, 19464431) / Math.max(total, 19464431) * 100;
        console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
        
        // Show improvement
        console.log('\n=== PROGRESS ===');
        console.log(`Initial: 23 securities, $652M (33x overextraction)`);
        console.log(`Enhanced: 35 securities, $9.9M after filtering (51% accuracy)`);
        console.log(`Combined: ${securities.length} securities, $${total.toLocaleString()} (${accuracy.toFixed(2)}% accuracy)`);
        
        // Show all securities
        console.log('\n=== ALL SECURITIES ===');
        securities.forEach((s, i) => {
            console.log(`${i+1}. ${s.isin}: $${s.value.toLocaleString()} - ${s.name || 'No name'} (${s.extractionMethod})`);
        });
        
        // Analysis
        console.log('\n=== ANALYSIS ===');
        const methodCounts = {};
        securities.forEach(s => {
            methodCounts[s.extractionMethod] = (methodCounts[s.extractionMethod] || 0) + 1;
        });
        
        Object.entries(methodCounts).forEach(([method, count]) => {
            console.log(`${method}: ${count} securities`);
        });
        
        return securities;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Export for server use
module.exports = { extractAllSecuritiesWithValues };

// Run if executed directly
if (require.main === module) {
    testCombinedExtraction();
}