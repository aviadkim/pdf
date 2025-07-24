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
            const contextStart = Math.max(0, position - 300);
            const contextEnd = Math.min(text.length, position + 300);
            const context = text.substring(contextStart, contextEnd);
            
            console.log(`\\nContext around ISIN:`);
            console.log(context);
            
            // Find all numbers in context - improved regex to handle consecutive numbers
            const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
            
            // Also look for Swiss numbers specifically (with apostrophes)
            const swissMatches = context.match(/(\d{1,3}(?:'\d{3})+)/g);
            console.log(`\\nSwiss format numbers found:`, swissMatches);
            console.log(`\\nAll numbers found:`, valueMatches);
            
            if (valueMatches) {
                const parsedValues = valueMatches.map(v => ({ original: v, parsed: parseSwissNumber(v) }));
                console.log(`\\nParsed values:`, parsedValues);
                
                // NEW ALGORITHM - Look for market values vs nominal values
                const swissMatchesDebug = context.match(/(\d{1,3}(?:'\d{3})+)/g);
                const valueMatchesDebug = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
                
                console.log(`\\nSwiss matches in debug:`, swissMatchesDebug);
                console.log(`\\nValue matches in debug:`, valueMatchesDebug);
                
                // Combine Swiss format matches with regular matches, prioritizing Swiss format
                let allMatches = [];
                if (swissMatchesDebug) {
                    allMatches = [...swissMatchesDebug];
                }
                if (valueMatchesDebug) {
                    // Add non-Swiss matches that aren't already covered
                    const swissValues = swissMatchesDebug ? swissMatchesDebug.map(v => parseSwissNumber(v)) : [];
                    valueMatchesDebug.forEach(v => {
                        const parsed = parseSwissNumber(v);
                        if (!swissValues.includes(parsed)) {
                            allMatches.push(v);
                        }
                    });
                }
                
                console.log(`\\nCombined matches:`, allMatches);
                
                if (allMatches.length > 0) {
                    const allParsedValues = allMatches.map(v => parseSwissNumber(v));
                    console.log(`\\nAll parsed values:`, allParsedValues);
                    
                    const nominalPattern = /(?:USD|EUR|CHF)\s*([\d']+(?:\.\d{2})?)/i;
                    const nominalMatch = context.match(nominalPattern);
                    const nominalValue = nominalMatch ? parseSwissNumber(nominalMatch[1]) : 0;
                    console.log(`\\nNominal value found: ${nominalValue}`);
                    
                    const marketValues = allParsedValues.filter(v => 
                        v > 10000 && // Minimum threshold
                        v < 1000000000 && // Maximum threshold
                        v !== nominalValue && // Exclude nominal value
                        v % 1000 !== 0 // Prefer values that aren't round thousands (more likely to be market values)
                    );
                    console.log(`\\nMarket values (filtered):`, marketValues);
                    
                    if (marketValues.length > 0) {
                        const selectedValue = Math.max(...marketValues);
                        console.log(`Market value selected: ${selectedValue}`);
                    } else {
                        const reasonableValues = allParsedValues.filter(v => v > 1000 && v < 1000000000);
                        console.log(`\\nFallback to reasonable values:`, reasonableValues);
                        const selectedValue = reasonableValues.length > 0 ? Math.max(...reasonableValues) : 0;
                        console.log(`Fallback value selected: ${selectedValue}`);
                    }
                }
            }
            
            console.log(`\\n=== END DEBUG ===\\n`);
        }
        
        // Extract context around ISIN for processing
        const contextStart = Math.max(0, position - 300);
        const contextEnd = Math.min(text.length, position + 300);
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
        
        // Extract value - prioritize Swiss format numbers
        const swissMatches = context.match(/(\d{1,3}(?:'\d{3})+)/g);
        const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/g);
        let value = 0;
        
        // Combine Swiss format matches with regular matches, prioritizing Swiss format
        let allMatches = [];
        if (swissMatches) {
            allMatches = [...swissMatches];
        }
        if (valueMatches) {
            // Add non-Swiss matches that aren't already covered
            const swissValues = swissMatches ? swissMatches.map(v => parseSwissNumber(v)) : [];
            valueMatches.forEach(v => {
                const parsed = parseSwissNumber(v);
                if (!swissValues.includes(parsed)) {
                    allMatches.push(v);
                }
            });
        }
        
        if (allMatches.length > 0) {
            // Parse all values
            const parsedValues = allMatches.map(v => parseSwissNumber(v));
            
            // First try to find market value (typically after price info, not the nominal USD amount)
            // Look for patterns that indicate market value vs nominal value
            const nominalPattern = /(?:USD|EUR|CHF)\s*([\d']+(?:\.\d{2})?)/i;
            const nominalMatch = context.match(nominalPattern);
            const nominalValue = nominalMatch ? parseSwissNumber(nominalMatch[1]) : 0;
            
            // Filter out the nominal value and look for actual market values
            const marketValues = parsedValues.filter(v => 
                v > 10000 && // Minimum threshold
                v < 1000000000 && // Maximum threshold
                v !== nominalValue && // Exclude nominal value
                v % 1000 !== 0 // Prefer values that aren't round thousands (more likely to be market values)
            );
            
            if (marketValues.length > 0) {
                // Pick the largest market value (most likely to be the total position value)
                value = Math.max(...marketValues);
            } else {
                // Fallback to all reasonable values if no market value found
                const reasonableValues = parsedValues.filter(v => v > 1000 && v < 1000000000);
                value = reasonableValues.length > 0 ? Math.max(...reasonableValues) : 0;
            }
        }
        
        // Extract currency
        const currencyMatch = context.match(/\b(USD|EUR|CHF|GBP)\b/);
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