// No-filter extraction to see actual totals
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Extract without filtering to analyze the real data
async function extractWithoutFiltering(pdfPath) {
    console.log('🔍 Extracting all securities without filtering...');
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const securities = [];
    
    // Find portfolio total for reference
    const portfolioTotalMatch = text.match(/Portfolio Total([\s\d']+)/);
    const portfolioTotal = portfolioTotalMatch ? 
        parseFloat(portfolioTotalMatch[1].replace(/[\s']/g, '')) : null;
    
    console.log(`📊 Portfolio Total Target: $${portfolioTotal?.toLocaleString() || 'Not found'}`);
    
    // Extract all ISINs with their immediate context
    const isinPattern = /[A-Z]{2}[A-Z0-9]{9}[0-9]/g;
    const isinMatches = [...text.matchAll(isinPattern)];
    const uniqueISINs = [...new Set(isinMatches.map(m => m[0]))];
    
    console.log(`\n🔍 Found ${uniqueISINs.length} unique ISINs`);
    
    // For each ISIN, find the best value
    for (const isin of uniqueISINs) {
        // Find all lines containing this ISIN
        const isinLines = [];
        lines.forEach((line, index) => {
            if (line.includes(isin)) {
                isinLines.push({ line, index });
            }
        });
        
        // Extract best value from all occurrences
        let bestValue = 0;
        let bestContext = '';
        let bestMethod = '';
        
        for (const { line, index } of isinLines) {
            // Method 1: Same line extraction
            const sameLineValue = extractValueSameLine(line, isin);
            if (sameLineValue > bestValue) {
                bestValue = sameLineValue;
                bestContext = line;
                bestMethod = 'same-line';
            }
            
            // Method 2: Next lines (common in tables)
            for (let i = 1; i <= 5; i++) {
                if (index + i < lines.length) {
                    const nextLine = lines[index + i];
                    const nextLineValue = extractValueFromLine(nextLine);
                    if (nextLineValue > bestValue) {
                        bestValue = nextLineValue;
                        bestContext = `${line} ... ${nextLine}`;
                        bestMethod = `next-line-${i}`;
                    }
                }
            }
            
            // Method 3: Structured table format
            const tableValue = extractTableValue(lines, index);
            if (tableValue > bestValue) {
                bestValue = tableValue;
                bestContext = lines.slice(index, index + 3).join(' | ');
                bestMethod = 'table-structure';
            }
        }
        
        if (bestValue > 0) {
            securities.push({
                isin: isin,
                value: bestValue,
                method: bestMethod,
                context: bestContext.substring(0, 150)
            });
        }
    }
    
    // Sort by value
    securities.sort((a, b) => b.value - a.value);
    
    return { securities, portfolioTotal };
}

// Extract value from same line as ISIN
function extractValueSameLine(line, isin) {
    // Remove ISIN to avoid matching it
    const lineWithoutISIN = line.replace(isin, '');
    
    // Look for Swiss format numbers
    const patterns = [
        /(\d{1,3}(?:'\d{3})+)(?:\s|$|USD|CHF)/,
        /(\d{1,3}(?:,\d{3})+)(?:\s|$|USD|CHF)/,
        /(\d+\.\d+)\s*(?:million|mio|mn)/i
    ];
    
    for (const pattern of patterns) {
        const match = lineWithoutISIN.match(pattern);
        if (match) {
            let value = match[1].replace(/[',]/g, '');
            value = parseFloat(value);
            
            // Handle millions
            if (match[0].toLowerCase().includes('million') || 
                match[0].toLowerCase().includes('mio') ||
                match[0].toLowerCase().includes('mn')) {
                value *= 1000000;
            }
            
            if (value >= 100) { // Very low threshold to catch everything
                return value;
            }
        }
    }
    
    return 0;
}

// Extract value from a line
function extractValueFromLine(line) {
    // Skip if line contains ISIN (to avoid duplicates)
    if (/[A-Z]{2}[A-Z0-9]{9}[0-9]/.test(line)) return 0;
    
    // Look for standalone values
    const patterns = [
        /^(\d{1,3}(?:'\d{3})+)$/,
        /^(\d{1,3}(?:,\d{3})+)$/,
        /^(\d+\.\d+)$/
    ];
    
    for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
            const value = parseFloat(match[1].replace(/[',]/g, ''));
            if (value >= 100) {
                return value;
            }
        }
    }
    
    return 0;
}

// Extract value from table structure
function extractTableValue(lines, isinIndex) {
    // Look for table patterns
    // ISIN | Name | ... | Value
    
    const isinLine = lines[isinIndex];
    
    // Check if line has multiple segments (table columns)
    const segments = isinLine.split(/\s{2,}|\t/);
    
    if (segments.length >= 3) {
        // Look for value in last segments
        for (let i = segments.length - 1; i >= 0; i--) {
            const segment = segments[i];
            const valueMatch = segment.match(/(\d{1,3}(?:[',]\d{3})*(?:\.\d+)?)/);
            if (valueMatch) {
                const value = parseFloat(valueMatch[1].replace(/[',]/g, ''));
                if (value >= 100) {
                    return value;
                }
            }
        }
    }
    
    return 0;
}

// Test extraction
async function testNoFilterExtraction() {
    try {
        console.log('=== TESTING NO-FILTER EXTRACTION ===');
        
        const { securities, portfolioTotal } = await extractWithoutFiltering('2. Messos  - 31.03.2025.pdf');
        
        console.log('\n=== RESULTS ===');
        console.log(`Securities found: ${securities.length}`);
        console.log(`Portfolio Total Target: $${portfolioTotal?.toLocaleString() || 'Unknown'}`);
        
        const total = securities.reduce((sum, s) => sum + s.value, 0);
        console.log(`Total Extracted: $${total.toLocaleString()}`);
        
        if (portfolioTotal) {
            const accuracy = Math.min(total, portfolioTotal) / Math.max(total, portfolioTotal) * 100;
            console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
        }
        
        // Show top 10
        console.log('\n=== TOP 10 SECURITIES ===');
        securities.slice(0, 10).forEach((s, i) => {
            console.log(`${i+1}. ${s.isin}: $${s.value.toLocaleString()} (${s.method})`);
            console.log(`   Context: ${s.context}`);
        });
        
        // Analyze extraction methods
        console.log('\n=== EXTRACTION METHODS ===');
        const methodCounts = {};
        securities.forEach(s => {
            methodCounts[s.method] = (methodCounts[s.method] || 0) + 1;
        });
        
        Object.entries(methodCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([method, count]) => {
                console.log(`${method}: ${count} securities`);
            });
        
        // Find potential issues
        console.log('\n=== ANALYSIS ===');
        const suspicious = securities.filter(s => s.value > 10000000);
        console.log(`High-value securities (>$10M): ${suspicious.length}`);
        suspicious.forEach(s => {
            console.log(`- ${s.isin}: $${s.value.toLocaleString()}`);
        });
        
        return securities;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Export
module.exports = { extractWithoutFiltering };

// Run if executed directly
if (require.main === module) {
    testNoFilterExtraction();
}