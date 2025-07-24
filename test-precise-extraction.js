// Test the precise extraction locally
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Copy the precise extraction functions here for testing
function extractSecuritiesPrecise(text) {
    console.log('🎯 Starting precise Messos extraction...');
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const securities = [];
    
    // Find the exact portfolio total first
    let portfolioTotal = null;
    const portfolioTotalRegex = /Portfolio Total([\s\d']+)/;
    const totalMatch = text.match(portfolioTotalRegex);
    
    if (totalMatch) {
        portfolioTotal = parseFloat(totalMatch[1].replace(/[\s']/g, ''));
        console.log(`📊 Portfolio Total Found: ${portfolioTotal.toLocaleString()}`);
    }
    
    // Find actual securities in the holdings section
    let inHoldingsSection = false;
    let holdingsStarted = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Start of holdings section - look for first ISIN after page structure
        if (line.includes('ISIN:') && !holdingsStarted) {
            // Check if this is actually in the holdings section (not summary)
            const contextLines = lines.slice(Math.max(0, i-5), i+5);
            const hasPageMarker = contextLines.some(l => l.includes('Page') && l.includes('/'));
            
            if (hasPageMarker) {
                inHoldingsSection = true;
                holdingsStarted = true;
                console.log(`📋 Holdings section starts at line ${i}: ${line}`);
            }
        }
        
        // End of holdings section - look for final portfolio total
        if (inHoldingsSection && line.includes('Portfolio Total')) {
            console.log(`📋 Holdings section ends at line ${i}: ${line}`);
            break;
        }
        
        // Extract securities from holdings section
        if (inHoldingsSection && line.includes('ISIN:')) {
            const security = parseMessosSecurityLine(line, lines, i);
            if (security && security.value > 1000) {
                securities.push(security);
                console.log(`✅ Extracted: ${security.isin} = $${security.value.toLocaleString()}`);
            }
        }
    }
    
    console.log(`📊 Total securities found: ${securities.length}`);
    const totalValue = securities.reduce((sum, s) => sum + s.value, 0);
    console.log(`💰 Total value: $${totalValue.toLocaleString()}`);
    
    // Validate against expected portfolio total
    if (portfolioTotal) {
        const accuracy = Math.min(totalValue, portfolioTotal) / Math.max(totalValue, portfolioTotal);
        console.log(`🎯 Accuracy: ${(accuracy * 100).toFixed(2)}%`);
        
        if (accuracy < 0.95) {
            console.log('⚠️ Low accuracy - applying corrections');
            return applyMessosCorrections(securities, portfolioTotal);
        }
    }
    
    return securities;
}

// Parse individual Messos security line
function parseMessosSecurityLine(line, allLines, lineIndex) {
    const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])/);
    if (!isinMatch) return null;
    
    const isin = isinMatch[1];
    
    // Get extended context for this security
    const contextStart = Math.max(0, lineIndex - 3);
    const contextEnd = Math.min(allLines.length, lineIndex + 10);
    const context = allLines.slice(contextStart, contextEnd).join(' ');
    
    // Extract security name (look in following lines)
    let name = '';
    for (let i = lineIndex + 1; i < Math.min(allLines.length, lineIndex + 5); i++) {
        const nextLine = allLines[i].trim();
        if (nextLine && !nextLine.includes('ISIN') && !nextLine.includes('Valorn') && nextLine.length > 5) {
            name = nextLine;
            break;
        }
    }
    
    // Extract value - look for USD amounts in context
    let value = 0;
    const valuePatterns = [
        /([\d']+)\s*USD/g,
        /USD\s*([\d']+)/g,
        /(\d{1,3}(?:'\d{3})*)/g
    ];
    
    for (const pattern of valuePatterns) {
        const matches = [...context.matchAll(pattern)];
        if (matches.length > 0) {
            const values = matches.map(m => parseFloat(m[1].replace(/'/g, '')));
            const validValues = values.filter(v => v > 1000 && v < 100000000);
            if (validValues.length > 0) {
                value = Math.max(...validValues);
                break;
            }
        }
    }
    
    return {
        isin: isin,
        name: name || '',
        value: value,
        currency: 'USD',
        extractionMethod: 'messos-precise',
        context: context.substring(0, 100)
    };
}

function applyMessosCorrections(securities, portfolioTotal) {
    console.log('🔧 Applying Messos corrections...');
    return securities; // For now, just return as-is
}

// Test the extraction
async function testPreciseExtraction() {
    try {
        const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
        const pdfData = await pdfParse(pdfBuffer);
        
        console.log('=== TESTING PRECISE EXTRACTION ===');
        const securities = extractSecuritiesPrecise(pdfData.text);
        
        console.log('\n=== RESULTS ===');
        console.log(`Securities found: ${securities.length}`);
        
        securities.forEach(s => {
            console.log(`${s.isin}: ${s.name} = $${s.value.toLocaleString()}`);
        });
        
        const total = securities.reduce((sum, s) => sum + s.value, 0);
        console.log(`\nTotal: $${total.toLocaleString()}`);
        console.log(`Expected: $19,464,431`);
        console.log(`Difference: $${Math.abs(total - 19464431).toLocaleString()}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

testPreciseExtraction();