// Free table extraction using advanced regex and pattern matching
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Advanced table extraction without paid APIs
async function extractAllSecurities(pdfPath) {
    console.log('🔍 Starting comprehensive free extraction...');
    
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdfParse(pdfBuffer);
    const text = pdfData.text;
    
    // Multiple extraction strategies
    const strategies = [
        extractMainPortfolioSecurities,
        extractContinuationSecurities,
        extractFootnoteSecurities,
        extractSummarySecurities,
        extractDerivativeSecurities
    ];
    
    const allSecurities = new Map(); // Use Map to avoid duplicates
    
    // Apply each strategy
    for (const strategy of strategies) {
        console.log(`\n🔧 Applying ${strategy.name} strategy...`);
        const securities = strategy(text);
        
        securities.forEach(sec => {
            if (!allSecurities.has(sec.isin) || sec.value > allSecurities.get(sec.isin).value) {
                allSecurities.set(sec.isin, sec);
            }
        });
    }
    
    return Array.from(allSecurities.values());
}

// Strategy 1: Main portfolio section
function extractMainPortfolioSecurities(text) {
    const securities = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Find all ISIN patterns with flexible matching
    const isinRegex = /(?:ISIN\s*:?\s*)?([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const isinMatches = [...line.matchAll(isinRegex)];
        
        for (const match of isinMatches) {
            const isin = match[1];
            
            // Look for value in surrounding context (wider search)
            const contextStart = Math.max(0, i - 5);
            const contextEnd = Math.min(lines.length, i + 15);
            const context = lines.slice(contextStart, contextEnd).join(' ');
            
            const value = extractBestValue(context, isin);
            
            if (value > 0) {
                securities.push({
                    isin: isin,
                    value: value,
                    currency: 'USD',
                    extractionMethod: 'main-portfolio',
                    context: context.substring(0, 200)
                });
            }
        }
    }
    
    return securities;
}

// Strategy 2: Continuation pages
function extractContinuationSecurities(text) {
    const securities = [];
    
    // Look for patterns that indicate continuation
    const continuationMarkers = [
        /continued from previous page/i,
        /\(continued\)/i,
        /page \d+ of \d+/i,
        /\.{3,}/  // Ellipsis indicating continuation
    ];
    
    // Split by pages if possible
    const pages = text.split(/page \d+/i);
    
    pages.forEach((page, pageIndex) => {
        if (pageIndex === 0) return; // Skip first page (handled by main)
        
        // Extract ISINs from continuation pages
        const isinMatches = [...page.matchAll(/([A-Z]{2}[A-Z0-9]{9}[0-9])/g)];
        
        isinMatches.forEach(match => {
            const isin = match[1];
            const value = extractBestValue(page, isin);
            
            if (value > 0) {
                securities.push({
                    isin: isin,
                    value: value,
                    currency: 'USD',
                    extractionMethod: 'continuation',
                    page: pageIndex + 1
                });
            }
        });
    });
    
    return securities;
}

// Strategy 3: Footnotes and small holdings
function extractFootnoteSecurities(text) {
    const securities = [];
    
    // Look for footnote sections
    const footnoteRegex = /\*{1,3}|†|‡|§|¶|\(\d+\)|\[\d+\]/g;
    const lines = text.split('\n');
    
    lines.forEach((line, i) => {
        if (footnoteRegex.test(line)) {
            // Check for ISINs in footnotes
            const isinMatch = line.match(/([A-Z]{2}[A-Z0-9]{9}[0-9])/);
            if (isinMatch) {
                const context = lines.slice(i, Math.min(i + 5, lines.length)).join(' ');
                const value = extractBestValue(context, isinMatch[1]);
                
                if (value > 0) {
                    securities.push({
                        isin: isinMatch[1],
                        value: value,
                        currency: 'USD',
                        extractionMethod: 'footnote'
                    });
                }
            }
        }
    });
    
    return securities;
}

// Strategy 4: Summary sections
function extractSummarySecurities(text) {
    const securities = [];
    
    // Look for summary tables that might have been missed
    const summaryMarkers = [
        /summary of holdings/i,
        /investment summary/i,
        /portfolio summary/i,
        /total securities/i
    ];
    
    const lines = text.split('\n');
    let inSummary = false;
    
    lines.forEach((line, i) => {
        // Check if we're in a summary section
        if (summaryMarkers.some(marker => marker.test(line))) {
            inSummary = true;
        }
        
        if (inSummary) {
            const isinMatch = line.match(/([A-Z]{2}[A-Z0-9]{9}[0-9])/);
            if (isinMatch) {
                const context = lines.slice(i - 2, i + 5).join(' ');
                const value = extractBestValue(context, isinMatch[1]);
                
                if (value > 0) {
                    securities.push({
                        isin: isinMatch[1],
                        value: value,
                        currency: 'USD',
                        extractionMethod: 'summary'
                    });
                }
            }
        }
        
        // Check for end of summary
        if (inSummary && /end of summary|next section/i.test(line)) {
            inSummary = false;
        }
    });
    
    return securities;
}

// Strategy 5: Derivatives and structured products
function extractDerivativeSecurities(text) {
    const securities = [];
    
    // Look for derivative indicators
    const derivativeMarkers = [
        /derivative/i,
        /warrant/i,
        /option/i,
        /structured product/i,
        /certificate/i,
        /note/i
    ];
    
    const lines = text.split('\n');
    
    lines.forEach((line, i) => {
        if (derivativeMarkers.some(marker => marker.test(line))) {
            // Look for ISINs near derivative mentions
            const contextLines = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3));
            
            contextLines.forEach(contextLine => {
                const isinMatch = contextLine.match(/([A-Z]{2}[A-Z0-9]{9}[0-9])/);
                if (isinMatch) {
                    const value = extractBestValue(contextLines.join(' '), isinMatch[1]);
                    
                    if (value > 0) {
                        securities.push({
                            isin: isinMatch[1],
                            value: value,
                            currency: 'USD',
                            extractionMethod: 'derivative',
                            type: 'structured'
                        });
                    }
                }
            });
        }
    });
    
    return securities;
}

// Enhanced value extraction
function extractBestValue(context, isin) {
    // Multiple value patterns
    const valuePatterns = [
        // Swiss format with apostrophes
        /(\d{1,3}(?:'\d{3})*(?:\.\d+)?)/g,
        // Standard format with commas
        /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g,
        // Space-separated thousands
        /(\d{1,3}(?:\s\d{3})*(?:\.\d+)?)/g,
        // Compact notation (1.5M, 2.3MM)
        /(\d+(?:\.\d+)?)\s*(?:M|MM|K)/gi
    ];
    
    const values = [];
    
    for (const pattern of valuePatterns) {
        const matches = [...context.matchAll(pattern)];
        
        matches.forEach(match => {
            let value = match[1].replace(/[',\s]/g, '');
            value = parseFloat(value);
            
            // Handle compact notation
            if (match[0].toUpperCase().includes('MM')) {
                value *= 1000000;
            } else if (match[0].toUpperCase().includes('M')) {
                value *= 1000000;
            } else if (match[0].toUpperCase().includes('K')) {
                value *= 1000;
            }
            
            // Reasonable range for securities
            if (value >= 500 && value <= 50000000) {
                values.push(value);
            }
        });
    }
    
    if (values.length === 0) return 0;
    
    // Use smart selection based on context
    if (context.includes('market value') || context.includes('valuation')) {
        // For market value context, take the first reasonable value
        return values[0];
    } else if (values.length > 1) {
        // Take median to avoid outliers
        values.sort((a, b) => a - b);
        return values[Math.floor(values.length / 2)];
    }
    
    return values[0];
}

// Test the comprehensive extraction
async function testComprehensiveExtraction() {
    try {
        console.log('=== TESTING COMPREHENSIVE FREE EXTRACTION ===');
        
        const securities = await extractAllSecurities('2. Messos  - 31.03.2025.pdf');
        
        // Sort by value for analysis
        securities.sort((a, b) => b.value - a.value);
        
        console.log('\n=== EXTRACTION SUMMARY ===');
        const methodCounts = {};
        securities.forEach(s => {
            methodCounts[s.extractionMethod] = (methodCounts[s.extractionMethod] || 0) + 1;
        });
        
        Object.entries(methodCounts).forEach(([method, count]) => {
            console.log(`${method}: ${count} securities`);
        });
        
        console.log('\n=== FINAL RESULTS ===');
        console.log(`Securities found: ${securities.length}`);
        
        const total = securities.reduce((sum, s) => sum + s.value, 0);
        console.log(`Total: $${total.toLocaleString()}`);
        console.log(`Expected: $19,464,431`);
        
        const accuracy = Math.min(total, 19464431) / Math.max(total, 19464431) * 100;
        console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
        
        // Compare with current results
        console.log('\n=== IMPROVEMENT ===');
        console.log(`Previous: 23 securities, 92.21% accuracy`);
        console.log(`Now: ${securities.length} securities, ${accuracy.toFixed(2)}% accuracy`);
        
        if (securities.length > 23) {
            console.log(`\n🎉 Found ${securities.length - 23} additional securities!`);
        }
        
        // Show all securities
        console.log('\n=== ALL SECURITIES ===');
        securities.forEach((s, i) => {
            console.log(`${i+1}. ${s.isin}: $${s.value.toLocaleString()} (${s.extractionMethod})`);
        });
        
        return securities;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Export for server integration
module.exports = { extractAllSecurities };

// Run test if executed directly
if (require.main === module) {
    testComprehensiveExtraction();
}