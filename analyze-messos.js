const fs = require('fs');
const pdf = require('pdf-parse');

async function analyzePDF() {
    console.log('📄 ANALYZING MESSOS PDF STRUCTURE');
    console.log('==================================');
    
    const pdfBuffer = fs.readFileSync('2. Messos  - 31.03.2025.pdf');
    const data = await pdf(pdfBuffer);
    const text = data.text;
    
    console.log('Document Length:', text.length, 'characters');
    console.log('Number of pages:', data.numpages);
    console.log('');
    
    // Find ISINs
    const isinPattern = /\b[A-Z]{2}[A-Z0-9]{10}\b/g;
    const isins = [...text.matchAll(isinPattern)];
    console.log('🔍 FOUND ISINs:', isins.length);
    isins.slice(0, 10).forEach((match, i) => {
        console.log(`  ${i+1}. ${match[0]}`);
    });
    
    // Find numbers (Swiss format)
    const swissNumbers = text.match(/\b\d{1,3}(?:'\d{3})*(?:\.\d{2})?\b/g) || [];
    console.log('');
    console.log('💰 SWISS FORMAT NUMBERS (sample):', swissNumbers.length);
    swissNumbers.slice(0, 10).forEach((num, i) => {
        console.log(`  ${i+1}. ${num}`);
    });
    
    // Find currency mentions
    const currencies = text.match(/\b(USD|EUR|CHF|GBP)\b/g) || [];
    console.log('');
    console.log('💱 CURRENCIES:', [...new Set(currencies)].join(', '));
    
    // Find total mentions
    const totalPattern = /(?:total|sum|portfolio|gesamt)[\s:]*(\d{1,3}(?:'\d{3})*(?:\.\d{2})?)/gi;
    const totals = [...text.matchAll(totalPattern)];
    console.log('');
    console.log('📊 TOTAL MENTIONS:', totals.length);
    totals.forEach((match, i) => {
        console.log(`  ${i+1}. ${match[0]} -> ${match[1]}`);
    });
    
    // Show document structure
    const lines = text.split('\n').filter(line => line.trim());
    console.log('');
    console.log('📄 DOCUMENT STRUCTURE (first 20 lines):');
    lines.slice(0, 20).forEach((line, i) => {
        console.log(`  ${i+1}. ${line.trim().substring(0, 80)}...`);
    });
    
    // Find securities context
    console.log('');
    console.log('🔍 SECURITIES CONTEXT (first 5 ISINs with surrounding text):');
    isins.slice(0, 5).forEach((match, i) => {
        const position = match.index;
        const context = text.substring(position - 100, position + 200);
        console.log(`\n  ${i+1}. ${match[0]}:`);
        console.log(`     Context: ${context.replace(/\n/g, ' ').trim()}`);
    });
}

analyzePDF().catch(console.error);