const fs = require('fs');
const pdfParse = require('pdf-parse');

async function findAllSecurities() {
    const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
    const data = await pdfParse(pdfBuffer);
    
    const text = data.text;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    console.log('=== FINDING ALL SECURITIES ===');
    
    // Find all ISIN mentions
    const allSecurities = [];
    lines.forEach((line, i) => {
        if (line.includes('ISIN:')) {
            const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])/);
            if (isinMatch) {
                const isin = isinMatch[1];
                
                // Get context around this ISIN
                const contextStart = Math.max(0, i - 2);
                const contextEnd = Math.min(lines.length, i + 8);
                const context = lines.slice(contextStart, contextEnd).join(' ');
                
                // Look for value in context
                const valueMatches = context.match(/(\d{1,3}(?:'\d{3})*)/g);
                let value = 0;
                if (valueMatches) {
                    const values = valueMatches.map(v => parseFloat(v.replace(/'/g, '')));
                    const validValues = values.filter(v => v > 1000 && v < 100000000);
                    if (validValues.length > 0) {
                        value = Math.max(...validValues);
                    }
                }
                
                allSecurities.push({
                    isin: isin,
                    value: value,
                    line: i,
                    context: context.substring(0, 150)
                });
            }
        }
    });
    
    console.log(`Found ${allSecurities.length} total ISIN mentions`);
    
    // Remove duplicates
    const uniqueSecurities = [];
    const seenISINs = new Set();
    
    for (const security of allSecurities) {
        if (!seenISINs.has(security.isin)) {
            uniqueSecurities.push(security);
            seenISINs.add(security.isin);
        }
    }
    
    console.log(`Found ${uniqueSecurities.length} unique securities`);
    
    uniqueSecurities.forEach(s => {
        console.log(`${s.isin}: $${s.value.toLocaleString()} (line ${s.line})`);
    });
    
    const totalValue = uniqueSecurities.reduce((sum, s) => sum + s.value, 0);
    console.log(`\nTotal value: $${totalValue.toLocaleString()}`);
    console.log(`Expected: $19,464,431`);
    console.log(`Difference: $${Math.abs(totalValue - 19464431).toLocaleString()}`);
    
    // Show any securities with very high values that might be incorrect
    console.log('\n=== HIGH VALUE SECURITIES ===');
    const highValueSecurities = uniqueSecurities.filter(s => s.value > 1000000);
    highValueSecurities.forEach(s => {
        console.log(`${s.isin}: $${s.value.toLocaleString()}`);
        console.log(`Context: ${s.context}`);
        console.log('---');
    });
}

findAllSecurities().catch(console.error);