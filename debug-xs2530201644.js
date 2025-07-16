// Debug XS2530201644 specific extraction
const pdfParse = require('pdf-parse');
const fs = require('fs');

// Function to parse Swiss numbers
function parseSwissNumber(swissNumber) {
    if (!swissNumber) return 0;
    return parseFloat(swissNumber.replace(/'/g, '')) || 0;
}

// Function to extract securities
function extractSecurities(text) {
    const securities = [];
    const isinRegex = /ISIN[:\s]*([A-Z]{2}[A-Z0-9]{9}[0-9])/g;
    let match;
    
    while ((match = isinRegex.exec(text)) !== null) {
        const isin = match[1];
        const position = match.index;
        
        // Only debug XS2530201644
        if (isin === 'XS2530201644') {
            console.log(`\\n=== DEBUGGING ${isin} ===`);
            console.log(`Position: ${position}`);
            
            // Extract context around ISIN
            const contextStart = Math.max(0, position - 500);
            const contextEnd = Math.min(text.length, position + 500);
            const context = text.substring(contextStart, contextEnd);
            
            console.log(`\\nContext around ISIN:`);
            console.log(context);
            
            // Find all numbers in context
            const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
            console.log(`\\nAll numbers found:`, valueMatches);
            
            if (valueMatches) {
                const parsedValues = valueMatches.map(v => ({ original: v, parsed: parseSwissNumber(v) }));
                console.log(`\\nParsed values:`, parsedValues);
                
                // Look for specific patterns
                const valuePattern = /(?:Value:|USD|EUR|CHF)\s*([\d']+(?:\.\d{2})?)/i;
                const valueMatch = context.match(valuePattern);
                console.log(`\\nValue pattern match:`, valueMatch);
                
                if (valueMatch) {
                    console.log(`Found value via pattern: ${valueMatch[1]} -> ${parseSwissNumber(valueMatch[1])}`);
                } else {
                    const values = valueMatches.map(v => parseSwissNumber(v)).filter(v => v > 1000 && v < 1000000000);
                    console.log(`Fallback values (filtered):`, values);
                    console.log(`Max value selected: ${Math.max(...values, 0)}`);
                }
            }
            
            console.log(`\\n=== END DEBUG ===\\n`);
        }
        
        // Extract context around ISIN for processing
        const contextStart = Math.max(0, position - 500);
        const contextEnd = Math.min(text.length, position + 500);
        const context = text.substring(contextStart, contextEnd);
        
        // Extract security name
        let name = '';
        const namePatterns = [
            /([A-Z][A-Z\s&,.-]+(?:NOTES?|BONDS?|BANK|CORP|LIMITED|LTD|INC|AG|SA|PLC|FUND|TRUST|FINANCIAL|CAPITAL|TREASURY|GOVERNMENT|MUNICIPAL|CORPORATE))\s*ISIN/i,
            /([A-Z][A-Z\s&,.'-]+)\s*ISIN/i
        ];
        
        for (const pattern of namePatterns) {
            const match = context.match(pattern);
            if (match && match[1]) {
                name = match[1].trim();
                break;
            }
        }
        
        // Extract value
        const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
        let value = 0;
        
        if (valueMatches) {
            const valuePattern = /(?:Value:|USD|EUR|CHF)\s*([\d']+(?:\.\d{2})?)/i;
            const valueMatch = context.match(valuePattern);
            
            if (valueMatch) {
                value = parseSwissNumber(valueMatch[1]);
            } else {
                const values = valueMatches.map(v => parseSwissNumber(v)).filter(v => v > 1000 && v < 1000000000);
                value = values.length > 0 ? Math.max(...values) : 0;
            }
        }
        
        // Extract currency
        const currencyMatch = context.match(/\\b(USD|EUR|CHF|GBP)\\b/);
        const currency = currencyMatch ? currencyMatch[1] : 'USD';
        
        securities.push({
            isin: isin,
            name: name,
            value: value,
            currency: currency
        });
    }
    
    return securities;
}

async function debugExtraction() {
    try {
        console.log('🔍 Debugging XS2530201644 extraction...');
        
        // Read the PDF file
        const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
        const pdfData = await pdfParse(pdfBuffer);
        
        console.log(`PDF pages: ${pdfData.numpages}`);
        console.log(`Text length: ${pdfData.text.length}`);
        
        // Extract securities
        const securities = extractSecurities(pdfData.text);
        
        // Find XS2530201644
        const target = securities.find(s => s.isin === 'XS2530201644');
        if (target) {
            console.log(`\\n✅ Found XS2530201644:`);
            console.log(`Name: "${target.name}"`);
            console.log(`Value: ${target.value}`);
            console.log(`Currency: ${target.currency}`);
        } else {
            console.log(`\\n❌ XS2530201644 not found`);
        }
        
    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debugExtraction();