const fs = require('fs');
const pdf = require('pdf-parse');

async function analyzeTotals() {
    const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
    const data = await pdf(pdfBuffer);
    const text = data.text;
    
    console.log('📊 ANALYZING PORTFOLIO TOTALS IN MESSOS PDF');
    console.log('==========================================');
    
    // Look for total patterns
    const totalPatterns = [
        /total[\s:]*([\\d\\s',]+)/gi,
        /sum[\s:]*([\\d\\s',]+)/gi,
        /portfolio[\s:]*total[\s:]*([\\d\\s',]+)/gi,
        /([\\d\\s',]+).*total/gi,
        /19[\s',]*464[\s',]*431/gi
    ];
    
    console.log('\n🔍 SEARCHING FOR TOTAL PATTERNS:');
    for (const pattern of totalPatterns) {
        const matches = [...text.matchAll(pattern)];
        console.log('\nPattern:', pattern);
        console.log('Matches:', matches.length);
        matches.slice(0, 3).forEach(match => {
            console.log('  -', match[0]);
        });
    }
    
    // Look for large numbers
    console.log('\n💰 LARGE NUMBERS IN DOCUMENT:');
    const largeNumbers = text.match(/\\b\\d{1,3}(?:[\\s',]\\d{3})*(?:\\.\\d{2})?\\b/g) || [];
    const parsedNumbers = largeNumbers.map(num => {
        const cleaned = num.replace(/[\\s',]/g, '');
        return parseFloat(cleaned);
    }).filter(num => num > 5000000 && num < 100000000);
    
    const uniqueNumbers = [...new Set(parsedNumbers)].sort((a, b) => b - a);
    console.log('Large numbers found:', uniqueNumbers.slice(0, 10));
    
    // Look for context around 19464431
    console.log('\n🎯 CONTEXT AROUND 19464431:');
    const targetIndex = text.indexOf('19464431');
    if (targetIndex !== -1) {
        const context = text.substring(targetIndex - 100, targetIndex + 100);
        console.log('Context:', context);
    } else {
        console.log('19464431 not found as continuous number');
        
        // Try with apostrophes
        const apostropheIndex = text.indexOf("19'464'431");
        if (apostropheIndex !== -1) {
            const context = text.substring(apostropheIndex - 100, apostropheIndex + 100);
            console.log('Context with apostrophes:', context);
        }
    }
    
    // Look for the exact pattern from our earlier analysis
    console.log('\n🔍 SEARCHING FOR EXACT TOTAL PATTERN:');
    const exactPattern = /Total19'464'431/g;
    const exactMatches = [...text.matchAll(exactPattern)];
    console.log('Exact matches found:', exactMatches.length);
    exactMatches.forEach(match => {
        console.log('Found:', match[0]);
        const context = text.substring(match.index - 50, match.index + 50);
        console.log('Context:', context);
    });
}

analyzeTotals().catch(console.error);