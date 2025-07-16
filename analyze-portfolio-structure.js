const fs = require('fs');
const pdfParse = require('pdf-parse');

async function findExactPortfolioData() {
    const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
    const data = await pdfParse(pdfBuffer);
    
    console.log('=== EXACT PORTFOLIO ANALYSIS ===');
    
    const lines = data.text.split('\n').map(line => line.trim()).filter(line => line);
    
    // Find the exact portfolio total
    console.log('Looking for portfolio total mentions:');
    lines.forEach((line, i) => {
        if (line.includes('19') && line.includes('464') && line.includes('431')) {
            console.log(`Line ${i}: ${line}`);
        }
    });
    
    // Find currency context around the total
    console.log('\nCurrency context around portfolio total:');
    lines.forEach((line, i) => {
        if (line.includes('Portfolio Total')) {
            console.log(`Line ${i-1}: ${lines[i-1] || ''}`);
            console.log(`Line ${i}: ${line}`);
            console.log(`Line ${i+1}: ${lines[i+1] || ''}`);
            console.log(`Line ${i+2}: ${lines[i+2] || ''}`);
        }
    });
    
    // Check what currency is used in individual securities
    console.log('\nCurrency in individual securities:');
    let usdCount = 0, chfCount = 0;
    
    lines.forEach(line => {
        if (line.includes('USD')) usdCount++;
        if (line.includes('CHF')) chfCount++;
    });
    
    console.log(`USD mentions: ${usdCount}`);
    console.log(`CHF mentions: ${chfCount}`);
    
    // Find the specific portfolio section
    console.log('\nPortfolio section boundaries:');
    let portfolioStart = -1, portfolioEnd = -1;
    
    lines.forEach((line, i) => {
        if (line.includes('ISIN') && line.includes('Valorn') && portfolioStart === -1) {
            portfolioStart = i;
            console.log(`Portfolio starts at line ${i}: ${line}`);
        }
        if (portfolioStart !== -1 && portfolioEnd === -1 && (line.includes('Total') || line.includes('Summary'))) {
            portfolioEnd = i;
            console.log(`Portfolio ends at line ${i}: ${line}`);
        }
    });
    
    // Extract actual securities from the portfolio section
    console.log('\nActual securities from portfolio section:');
    if (portfolioStart !== -1 && portfolioEnd !== -1) {
        const portfolioLines = lines.slice(portfolioStart + 1, portfolioEnd);
        const securities = [];
        
        portfolioLines.forEach(line => {
            if (line.includes('ISIN:')) {
                const isinMatch = line.match(/ISIN:\s*([A-Z]{2}[A-Z0-9]{9}[0-9])/);
                if (isinMatch) {
                    console.log(`Security: ${line}`);
                    securities.push(line);
                }
            }
        });
        
        console.log(`\nFound ${securities.length} actual securities in portfolio section`);
        
        // Look for the exact total that should match these securities
        console.log('\nLooking for matching total:');
        const totalLines = lines.filter(line => 
            line.includes('Total') && 
            (line.includes('USD') || line.includes('CHF')) &&
            line.match(/\d{1,3}[']\d{3}[']\d{3}/)
        );
        
        totalLines.forEach(line => console.log(`Total line: ${line}`));
    }
}

findExactPortfolioData().catch(console.error);